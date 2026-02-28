# Triplog ERD 설계

> 요구사항: [requirements.md](./requirements.md) 2. 도메인 모델 정의 기준

---

## 1. 개요

- **Auth**: Supabase Auth (Google OAuth). 사용자 식별자는 `auth.users.id` (uuid).
- **Public 스키마**: `profiles`, `journeys`, `journey_members`, `memories`.
- Journey 1개당 최대 8명(owner 포함). 초대는 `invite_code`(6자리 숫자, unique)로 수행.

---

## 2. 엔티티 및 테이블 정의

### 2.1 profiles (User Profile)

| 컬럼        | 타입        | Nullable | 설명                    |
| ----------- | ----------- | -------- | ----------------------- |
| id          | uuid        | NO       | PK, `auth.users.id` FK  |
| email       | text        | YES      | 이메일                  |
| full_name   | text        | YES      | 사용자 이름             |
| avatar_url  | text        | YES      | 프로필 이미지 URL       |
| created_at  | timestamptz | NO       | 생성일 (default: now()) |

- **PK**: `id`
- **FK**: `id` → `auth.users(id)` ON DELETE CASCADE
- **비고**: Auth 가입 시 트리거로 1행 자동 생성.

---

### 2.2 journeys

| 컬럼          | 타입        | Nullable | 설명                        |
| ------------- | ----------- | -------- | --------------------------- |
| id            | uuid        | NO       | PK (default: gen_random_uuid()) |
| title         | text        | NO       | 여행 제목                   |
| country_code  | text        | YES      | 국가 코드 (2자리 등)        |
| start_date    | date        | YES      | 여행 시작일                 |
| end_date      | date        | YES      | 여행 종료일                 |
| thumbnail_url | text        | YES      | 여행 썸네일 URL/경로        |
| invite_code   | text        | NO       | 초대 코드 (6자리 숫자, unique) |
| created_by    | uuid        | NO       | 생성자 = owner              |
| created_at    | timestamptz | NO       | 생성일 (default: now())     |
| updated_at    | timestamptz | NO       | 수정일 (default: now())     |

- **PK**: `id`
- **FK**: `created_by` → `auth.users(id)` ON DELETE CASCADE
- **Unique**: `invite_code`
- **비고**: `invite_code`는 트리거/함수로 자동 생성. 수정/삭제는 owner만 가능(RLS).

---

### 2.3 journey_members

| 컬럼       | 타입        | Nullable | 설명                    |
| ---------- | ----------- | -------- | ----------------------- |
| journey_id | uuid        | NO       | PK, FK → journeys.id    |
| user_id    | uuid        | NO       | PK, FK → auth.users.id  |
| role       | text        | NO       | 'owner' \| 'member'      |
| joined_at  | timestamptz | NO       | 참여 시각 (default: now()) |

- **PK**: `(journey_id, user_id)`
- **FK**: `journey_id` → `journeys(id)` ON DELETE CASCADE
- **FK**: `user_id` → `auth.users(id)` ON DELETE CASCADE
- **Check**: `role IN ('owner', 'member')`
- **비고**: 한 journey당 최대 8명. Join RPC/앱 로직에서 검사.

---

### 2.4 memories

| 컬럼        | 타입        | Nullable | 설명                          |
| ----------- | ----------- | -------- | ----------------------------- |
| id          | uuid        | NO       | PK (default: gen_random_uuid()) |
| journey_id  | uuid        | NO       | FK → journeys.id              |
| created_by  | uuid        | NO       | 작성자, FK → auth.users.id    |
| image_url   | text        | NO       | 이미지 경로/URL               |
| description | text        | YES      | 기록 내용                     |
| latitude    | float8      | YES      | 위도                          |
| longitude   | float8      | YES      | 경도                          |
| place_id    | text        | YES      | 장소 고유 ID (Google Place ID 등) |
| mood        | mood        | NO       | 감정 (enum)                   |
| created_at  | timestamptz | NO       | 생성일 (default: now())       |
| updated_at  | timestamptz | NO       | 수정일 (default: now())       |

- **PK**: `id`
- **FK**: `journey_id` → `journeys(id)` ON DELETE CASCADE
- **FK**: `created_by` → `auth.users(id)` ON DELETE CASCADE
- **Enum**: `mood` — 3.5절 감정 시스템 참고.

---

## 3. Enum 정의

### 3.1 mood (Memory 감정)

요구사항 3.5 기준:

| DB 값     | 설명   |
| --------- | ------ |
| happy     | HAPPY  |
| excited   | EXCITED|
| calm      | CALM   |
| sad       | SAD    |
| surprised | SURPRISED |

- **타입명**: `public.mood`
- **용도**: Memory 생성 시 필수 선택, 지도 감정별 색상 구분.

---

## 4. 관계 요약

```
auth.users (1) ─────────────┬── (1) public.profiles [id]
                            ├── (N) public.journeys [created_by]
                            ├── (N) public.journey_members [user_id]
                            └── (N) public.memories [created_by]

public.journeys (1) ────────┬── (N) public.journey_members [journey_id]
                            └── (N) public.memories [journey_id]
```

- **profiles**: 사용자 1명당 1행.
- **journeys**: 1개 journey당 1명 owner(created_by), N명 member(journey_members).
- **journey_members**: journey–user 다대다, role로 owner/member 구분. 최대 8명/journey.
- **memories**: journey당 N개, 작성자(created_by) 및 위치/감정 정보 보유.

---

## 5. 인덱스 권장

| 테이블          | 컬럼               | 용도                    |
| ---------------- | ------------------ | ----------------------- |
| journeys         | created_by         | 내 여행 목록 조회       |
| journeys         | invite_code        | 초대 코드 조회 (unique) |
| journey_members | (journey_id, user_id) | PK, 멤버 여부 조회   |
| journey_members | user_id            | 사용자별 참여 journey   |
| memories         | journey_id         | journey별 memory 목록   |
| memories         | created_by         | 작성자별 memory         |
| memories         | (latitude, longitude) | 지도 쿼리 (nullable 많으면 부분 인덱스 고려) |

---

## 6. Storage (Supabase Storage)

- **버킷**: 예) `media`
- **경로 예시**:
  - Journey 썸네일: `journeys/{journey_id}/thumbnail.{ext}`
  - Memory 이미지: `journeys/{journey_id}/memories/{memory_id}.{ext}`
- DB에는 URL 또는 `thumbnail_url` / `image_url` 형태로 경로 저장.

이 문서는 DB 스키마 및 ERD 설계만 다룹니다. RLS는 [RLS.md](./RLS.md), 트리거/함수는 [TRIGGERS_AND_FUNCTIONS.md](./TRIGGERS_AND_FUNCTIONS.md)를 참고하세요.
