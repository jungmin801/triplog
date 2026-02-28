# Triplog 트리거 및 함수 설계

> 요구사항: [requirements.md](./requirements.md) 4. 자동화 및 DB 트리거 요구사항 기준

---

## 1. 개요

| 구분 | 내용 |
|------|------|
| 트리거 | Auth → profiles 생성, Journey 생성 → owner 등록, invite_code 자동 생성, updated_at 자동 갱신 |
| 함수 | RLS 보조 함수, 초대 코드 생성, Join RPC |
| 실행 순서 | Auth INSERT → profiles 트리거 / Journey INSERT → invite_code 트리거 → journey_members 트리거 |

---

## 2. 공통 유틸 함수

### 2.1 make_invite_code(p_len integer) → text

- **역할**: 길이 `p_len`의 숫자만 있는 랜덤 코드 생성 (0~9).
- **규칙**: 6자리 숫자, unique는 호출부(트리거)에서 재시도로 보장.
- **예시 구현**: `lpad(floor(random() * power(10, p_len))::text, p_len, '0')` 등. 중복 시 INSERT 재시도 또는 루프.

---

### 2.2 set_updated_at()

- **역할**: `NEW.updated_at := now()` 후 `RETURN NEW`.
- **용도**: `journeys`, `memories` 등에 `BEFORE UPDATE` 트리거로 연결.
- **시그니처**: 트리거 함수이므로 인자 없음, `RETURNS TRIGGER`.

---

## 3. Auth → Profile 자동 생성 (요구사항 4.1)

### 3.1 트리거

| 항목 | 내용 |
|------|------|
| 이름 | `on_auth_user_created` (또는 `trg_create_profile_on_signup`) |
| 테이블 | `auth.users` |
| 시점 | `AFTER INSERT` |
| 함수 | `public.handle_new_user()` |

### 3.2 함수: handle_new_user()

- **시그니처**: `RETURNS TRIGGER`, `LANGUAGE plpgsql` (또는 `SECURITY DEFINER`로 public.profiles INSERT 권한 보유).
- **동작**:
  - `NEW.id`, `NEW.email`, `NEW.raw_user_meta_data->>'full_name'`, `NEW.raw_user_meta_data->>'avatar_url'` 등으로 행 구성.
  - `INSERT INTO public.profiles (id, email, full_name, avatar_url, created_at) VALUES (...)` 1건 실행.
- **비고**: `auth.users`는 Supabase 관리 스키마이므로 트리거는 Supabase Dashboard 또는 migration에서 `auth` 스키마에 생성.

---

## 4. Journey 관련

### 4.1 Invite Code 자동 생성 (요구사항 4.3)

| 항목 | 내용 |
|------|------|
| 트리거 이름 | `trg_journeys_invite_code` |
| 테이블 | `public.journeys` |
| 시점 | `BEFORE INSERT` |
| 함수 | `public.set_invite_code_if_missing()` |

**함수: set_invite_code_if_missing()**

- `NEW.invite_code`가 NULL이거나 빈 문자열이면:
  - 6자리 숫자 생성 (`make_invite_code(6)` 또는 인라인 로직).
  - `journeys`에 이미 존재하면 재생성(루프 또는 재시도).
- `RETURN NEW`.

---

### 4.2 Journey 생성 시 Owner 자동 등록 (요구사항 4.2)

| 항목 | 내용 |
|------|------|
| 트리거 이름 | `trg_journeys_owner_membership` |
| 테이블 | `public.journeys` |
| 시점 | `AFTER INSERT` |
| 함수 | `public.ensure_owner_membership()` |

**함수: ensure_owner_membership()**

- `INSERT INTO public.journey_members (journey_id, user_id, role) VALUES (NEW.id, NEW.created_by, 'owner')`.
- `RETURN NEW` (AFTER 트리거이므로 반환값은 사용하지 않아도 됨).

---

### 4.3 Journey updated_at 자동 갱신

| 항목 | 내용 |
|------|------|
| 트리거 이름 | `trg_journeys_updated_at` |
| 테이블 | `public.journeys` |
| 시점 | `BEFORE UPDATE` |
| 함수 | `public.set_updated_at()` |

---

## 5. Memory 관련

### 5.1 Memory updated_at 자동 갱신

| 항목 | 내용 |
|------|------|
| 트리거 이름 | `trg_memories_updated_at` |
| 테이블 | `public.memories` |
| 시점 | `BEFORE UPDATE` |
| 함수 | `public.set_updated_at()` (journeys와 공통) |

---

## 6. RLS 보조 함수

### 6.1 is_journey_member(p_journey_id uuid) → boolean

- **역할**: 현재 사용자(`auth.uid()`)가 해당 journey의 멤버(owner 또는 member)인지 여부.
- **구현**: `EXISTS (SELECT 1 FROM public.journey_members WHERE journey_id = p_journey_id AND user_id = auth.uid())`.
- **SECURITY DEFINER**: RLS 내에서 사용하므로 정의자 권한으로 실행하도록 설정 권장.

---

### 6.2 is_journey_owner(p_journey_id uuid) → boolean

- **역할**: 현재 사용자가 해당 journey의 owner인지 여부.
- **구현**: `EXISTS (SELECT 1 FROM public.journey_members WHERE journey_id = p_journey_id AND user_id = auth.uid() AND role = 'owner')`.
- **SECURITY DEFINER**: 동일하게 권장.

---

## 7. 초대 코드 참여 RPC (요구사항 4.4)

### 7.1 join_journey_by_invite(p_code text) → uuid

- **역할**: 6자리 초대 코드로 참여 처리, 성공 시 `journey_id` 반환.
- **입력**: `p_code` — 6자리 숫자 문자열.
- **처리 순서**:
  1. `p_code`로 `journeys`에서 `id` 조회. 없으면 예외 또는 null 반환.
  2. 해당 journey의 `journey_members` 행 수가 8명 이상이면 “참여 불가” 예외.
  3. `auth.uid()`가 이미 해당 journey 멤버면 “이미 멤버”로 무시(또는 동일 `journey_id` 반환).
  4. 그 외: `INSERT INTO journey_members (journey_id, user_id, role) VALUES (journey_id, auth.uid(), 'member')`.
  5. `journey_id` 반환.
- **출력**: 성공 시 `journey_id` (uuid).
- **SECURITY DEFINER**: RLS를 우회해 멤버 삽입 가능하도록 정의자 권한 권장.
- **비고**: 8명 제한, 중복 참가 방지는 이 RPC 내에서만 적용. RLS는 “본인 행만 삽입” 등으로 보완.

---

## 8. 함수/트리거 목록 요약

| 이름 | 타입 | 테이블/대상 | 설명 |
|------|------|-------------|------|
| make_invite_code(integer) | 함수 | - | 6자리 숫자 코드 생성 |
| set_updated_at() | 트리거 함수 | journeys, memories | updated_at 갱신 |
| handle_new_user() | 트리거 함수 | auth.users | 가입 시 profiles 1행 생성 |
| set_invite_code_if_missing() | 트리거 함수 | journeys | INSERT 시 invite_code 자동 설정 |
| ensure_owner_membership() | 트리거 함수 | journeys | INSERT 후 owner를 journey_members에 등록 |
| is_journey_member(uuid) | 함수 | - | RLS: 멤버 여부 |
| is_journey_owner(uuid) | 함수 | - | RLS: owner 여부 |
| join_journey_by_invite(text) | 함수(RPC) | - | 초대 코드로 참여, journey_id 반환 |

---

## 9. 적용 순서 (마이그레이션 시 권장)

1. Enum `mood` 생성.
2. 테이블 생성: profiles → journeys → journey_members → memories (FK 순서).
3. 공통 함수: `make_invite_code`, `set_updated_at`.
4. Auth 트리거: `handle_new_user` 함수 생성 후 `auth.users` AFTER INSERT 트리거.
5. Journey 트리거: `set_invite_code_if_missing`, `ensure_owner_membership` 함수 생성 후 journeys 트리거.
6. Memory 트리거: `set_updated_at`으로 memories BEFORE UPDATE 트리거.
7. RLS 보조 함수: `is_journey_member`, `is_journey_owner` (SECURITY DEFINER).
8. RPC: `join_journey_by_invite`.
9. RLS 활성화 및 정책 적용 ([RLS.md](./RLS.md) 참고).

이 문서는 트리거·함수 설계만 다룹니다. 테이블 구조는 [ERD.md](./ERD.md), 정책은 [RLS.md](./RLS.md)를 참고하세요.
