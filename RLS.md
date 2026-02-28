# Triplog RLS 정책 설계

> 요구사항: [requirements.md](./requirements.md) 2. 도메인 정책, 3. 기능 요구사항, 5.1 보안 기준

---

## 1. 원칙

- 모든 public 테이블에 **Row Level Security(RLS)** 적용.
- 접근 제어는 **멤버십 기반**: `is_journey_member(journey_id)` 등 보조 함수로 “해당 journey 멤버인지” 판단.
- 비멤버는 해당 journey 및 관련 row에 접근 불가.

---

## 2. 보조 함수 (RLS에서 사용)

정책에서 공통으로 사용할 함수는 [TRIGGERS_AND_FUNCTIONS.md](./TRIGGERS_AND_FUNCTIONS.md)에 정의. 여기서는 시그니처만 명시.

| 함수 | 시그니처 | 반환 | 설명 |
|------|----------|------|------|
| `auth.uid()` | - | uuid | 현재 로그인 사용자 ID (Supabase 내장). |
| `is_journey_member` | `(p_journey_id uuid)` | boolean | 현재 사용자가 해당 journey의 멤버(owner 포함)이면 true. |
| `is_journey_owner` | `(p_journey_id uuid)` | boolean | 현재 사용자가 해당 journey의 owner이면 true. |

---

## 3. 테이블별 RLS 정책

### 3.1 profiles

| 정책명 | 명령 | 역할 | USING | WITH CHECK | 비고 |
|--------|------|------|--------|------------|------|
| profiles_select_own | SELECT | authenticated | `id = auth.uid()` | - | 본인 프로필만 조회 |
| profiles_update_own | UPDATE | authenticated | `id = auth.uid()` | `id = auth.uid()` | 본인만 수정 |
| profiles_insert_own | INSERT | authenticated | - | `id = auth.uid()` | 트리거로만 생성 권장, 정책은 본인 id만 허용 |

- **INSERT**: 주로 `auth.users` INSERT 트리거에서 실행. 클라이언트 직접 INSERT 시 본인 `id`만 허용.
- **DELETE**: 프로필 삭제는 요구사항에 없음. 필요 시 “본인만 삭제” 정책 추가.

---

### 3.2 journeys

| 정책명 | 명령 | 역할 | USING | WITH CHECK | 비고 |
|--------|------|------|--------|------------|------|
| journeys_member_select | SELECT | authenticated | `is_journey_member(id)` | - | 멤버만 조회 |
| journeys_owner_insert | INSERT | authenticated | - | `created_by = auth.uid()` | 생성자는 본인만 |
| journeys_owner_update | UPDATE | authenticated | `is_journey_owner(id)` | `is_journey_owner(id)` | owner만 수정 |
| journeys_owner_delete | DELETE | authenticated | `is_journey_owner(id)` | - | owner만 삭제 (관련 memory는 FK CASCADE) |

- Journey 수정/삭제는 **owner만** 가능 (요구사항 2.2, 3.2.3, 3.2.4).
- 최대 8명 제한은 RLS가 아니라 **Join RPC/앱 로직**에서 검사.

---

### 3.3 journey_members

| 정책명 | 명령 | 역할 | USING | WITH CHECK | 비고 |
|--------|------|------|--------|------------|------|
| journey_members_member_select | SELECT | authenticated | `is_journey_member(journey_id)` | - | 같은 journey 멤버만 조회 |
| journey_members_insert_via_trigger_or_join | INSERT | authenticated | - | `user_id = auth.uid()` AND `is_journey_member(journey_id) = false` 로직은 RPC에서 | RPC/트리거로만 삽입 권장; 정책은 “본인이 참가하는 행만” 등으로 제한 |
| (선택) journey_members_owner_remove_member | DELETE | authenticated | `is_journey_owner(journey_id)` OR `user_id = auth.uid()` | - | owner가 멤버 추방 또는 본인 탈퇴 |

- **INSERT**: 실제 삽입은 (1) Journey 생성 트리거(owner 행), (2) 초대 참여 RPC(member 행). RLS는 `user_id = auth.uid()` 및 필요 시 journey 존재/중복/8명 제한은 RPC에서 보장.
- **UPDATE**: 요구사항에 role 변경 없음. 필요 시 owner만 role 수정 정책 추가.

---

### 3.4 memories

| 정책명 | 명령 | 역할 | USING | WITH CHECK | 비고 |
|--------|------|------|--------|------------|------|
| memories_member_select | SELECT | authenticated | `is_journey_member(journey_id)` | - | 같은 journey 멤버만 조회 |
| memories_member_insert | INSERT | authenticated | - | `is_journey_member(journey_id)` AND `created_by = auth.uid()` | 멤버만 생성, 작성자는 본인 |
| memories_author_update | UPDATE | authenticated | `created_by = auth.uid()` | `created_by = auth.uid()` | 작성자만 수정 |
| memories_author_or_owner_delete | DELETE | authenticated | `created_by = auth.uid()` OR `is_journey_owner(journey_id)` | - | 작성자 또는 journey owner만 삭제 |

- Memory 수정은 **작성자만**, 삭제는 **작성자 또는 Journey owner** (요구사항 2.4, 3.3.3, 3.3.4).

---

## 4. 정책 적용 순서 요약

1. **profiles**: RLS 활성화 → select_own, update_own, insert_own 적용.
2. **journeys**: RLS 활성화 → member_select, owner_insert, owner_update, owner_delete 적용.
3. **journey_members**: RLS 활성화 → member_select, insert(본인 참가만), (선택) owner/self delete 적용.
4. **memories**: RLS 활성화 → member_select, member_insert, author_update, author_or_owner_delete 적용.

---

## 5. 주의사항

- **anon**: 비로그인 사용자. public 테이블에는 권한 부여하지 않음(요구사항: 로그인 유도).
- **service_role**: RLS 우회. 마이그레이션/백오피스용으로만 사용.
- 새 테이블 추가 시 **기본 거부**가 되도록 RLS를 먼저 켠 뒤, 필요한 정책만 추가하는 것을 권장.

이 문서는 정책 설계만 다룹니다. 실제 함수 정의·트리거는 [TRIGGERS_AND_FUNCTIONS.md](./TRIGGERS_AND_FUNCTIONS.md), 테이블 구조는 [ERD.md](./ERD.md)를 참고하세요.
