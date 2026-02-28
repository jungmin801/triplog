# Triplog 요구사항 명세서 (MVP v1.2)

---

# 1. 서비스 개요

## 1.1 서비스명

**Triplog**

## 1.2 서비스 컨셉

- 여행을 좋아하지만 기록은 귀찮은 사람들을 위한 여행 기록 앱
- 폴라로이드 감성 기반의 가벼운 기록 서비스
- 함께 여행한 사람들과 기록을 공유
- 감정 중심의 지도 시각화

## 1.3 핵심 키워드

- 여행
- 폴라로이드
- 기록(Log)
- 공유
- 감정
- 지도

---

# 2. 도메인 모델 정의

---

## 2.1 User (Auth + Profile)

### Auth

- Supabase Auth (Google OAuth)

### Profile (public.profiles)

| 필드       | 타입                     | 설명          |
| ---------- | ------------------------ | ------------- |
| id         | uuid (PK, auth.users.id) | 사용자 ID     |
| email      | text                     | 이메일        |
| full_name  | text                     | 사용자 이름   |
| avatar_url | text                     | 프로필 이미지 |
| created_at | timestamp                | 생성일        |

---

## 2.2 Journey

| 필드          | 타입          | 설명                   |
| ------------- | ------------- | ---------------------- |
| id            | uuid (PK)     | 여행 ID                |
| title         | text          | 여행 제목              |
| country_code  | text          | 국가 코드              |
| start_date    | date          | 여행 시작일            |
| end_date      | date          | 여행 종료일            |
| thumbnail_url | text          | 여행 썸네일            |
| invite_code   | text (unique) | 초대 코드 (6자리 숫자) |
| created_by    | uuid          | 생성자                 |
| created_at    | timestamp     | 생성일                 |

### 정책

- Journey 수정은 owner만 가능
- Journey 삭제는 owner만 가능
- 한 Journey의 최대 멤버 수는 8명 (owner 포함)

---

## 2.3 JourneyMember

| 필드       | 타입                       | 설명        |
| ---------- | -------------------------- | ----------- |
| journey_id | uuid                       | 여행 ID     |
| user_id    | uuid                       | 사용자 ID   |
| role       | text ('owner' \| 'member') | 권한        |
| joined_at  | timestamptz                | 참여한 시각 |

### 정책

- 한 Journey당 최대 8명까지 허용
- owner 포함 총 인원 8명

---

## 2.4 Memory

| 필드        | 타입      | Nullable | 설명                              |
| ----------- | --------- | -------- | --------------------------------- |
| id          | uuid      | no       | 기록 ID                           |
| journey_id  | uuid      | no       | 여행 ID                           |
| image_url   | text      | no       | 이미지 경로                       |
| description | text      | yes      | 기록 내용                         |
| latitude    | float     | yes      | 위도                              |
| longitude   | float     | yes      | 경도                              |
| place_id    | text      | yes      | 장소 고유 ID (Google Place ID 등) |
| mood        | enum      | no       | 감정                              |
| created_by  | uuid      | no       | 작성자                            |
| created_at  | timestamp | no       | 생성일                            |

### 정책

- Memory 수정은 작성자만 가능
- Memory 삭제는 작성자 또는 Journey owner 가능
- 위치 관련 필드(latitude, longitude, place_id)는 nullable

---

# 3. 기능 요구사항 (Functional Requirements)

---

# 3.1 인증 (Authentication)

## 기능

- Google OAuth 로그인
- 로그인 상태 유지
- 로그아웃

## 요구사항

- 로그인 성공 시 `/journeys` 이동
- 초대 링크 접근 시 로그인 유도 후 참여 처리

---

# 3.2 Journey 관리

---

## 3.2.1 Journey 생성

### 입력 항목

- 여행 제목
- 국가 선택
- 여행 기간
- 썸네일 이미지

### 동작

- invite_code 자동 생성 (6자리 숫자)
- 생성자는 owner로 자동 등록
- 생성 시점에 멤버 수 1명(owner)

---

## 3.2.2 Journey 목록 조회

- 내가 참여한 여행 목록 조회
- 최신순 정렬
- 썸네일 표시
- 참여 인원 표시

---

## 3.2.3 Journey 수정

- 제목 수정
- 기간 수정
- 썸네일 변경
- Owner만 가능

---

## 3.2.4 Journey 삭제

- Owner만 가능
- 관련 memory cascade 삭제

---

## 3.2.5 초대 기능

### 정책

- invite_code는 6자리 숫자
- 숫자만 허용 (0~9)
- unique 보장

### 기능

- 초대 코드 복사
- 공유하기 버튼 (Share API)
- 초대 링크 클릭 시 로그인 후 참여 처리
- 한 Journey에 8명 초과 시 참여 불가

---

# 3.3 Memory 관리

---

## 3.3.1 Memory 생성

### 입력 방식

- 사진 촬영
- 앨범에서 가져오기 (Expo ImagePicker)

### 입력 항목

- 사진 (필수)
- 텍스트 (선택)
- 위치 (선택)
- 감정 선택 (필수)

---

## 3.3.2 위치 저장 방식

Memory의 위치 정보는 두 가지 방식으로 저장될 수 있다.

### 1) 지도 검색 기반 저장

- 사용자가 지도 검색 UI에서 장소 선택
- 저장 항목:
  - latitude
  - longitude
  - place_id (Google Place ID 등)
- latitude, longitude, place_id는 모두 nullable
- place_id는 추후 장소 정보 확장을 위한 참조값

### 2) 위치 미사용

- 사용자가 위치를 선택하지 않으면
  - latitude = null
  - longitude = null
  - place_id = null

---

## 3.3.3 Memory 수정

- 텍스트 수정
- 감정 수정
- 위치 수정
- 이미지 교체
- 작성자만 가능

---

## 3.3.4 Memory 삭제

- 작성자 또는 Journey owner 가능

---

# 3.4 지도 기능

## 목적

- 감정 기반 위치 시각화

## 요구사항

- latitude, longitude가 존재하는 memory만 지도에 표시
- 감정별 마커 색상 구분
- 마커 클릭 시 memory 미리보기
- place_id는 내부 참조용으로 사용 (지도 렌더링 필수값 아님)

---

# 3.5 감정 시스템

```ts
enum Mood {
  HAPPY,
  EXCITED,
  CALM,
  SAD,
  SURPRISED,
}
```

## 요구사항

- memory 생성 시 감정 선택 필수
- 지도에 감정별 색상 반영

---

# 4. 자동화 및 DB 트리거 요구사항

---

# 4.1 인증 시 Profile 자동 생성

## 이벤트

- auth.users INSERT

## 동작

- public.profiles에 자동 row 생성
- id = auth.users.id
- email, full_name, avatar_url 복사

---

# 4.2 Journey 생성 시 Owner 자동 등록

## 이벤트

- public.journeys INSERT

## 동작

- public.journey_members 자동 INSERT
- journey_id = journeys.id
- user_id = journeys.created_by
- role = 'owner'

---

# 4.3 Journey 생성 시 Invite Code 자동 생성

## 규칙

- 6자리 숫자
- unique 보장
- 자동 생성 (default 또는 trigger)

---

# 4.4 초대 코드 참여 (Join RPC)

## 입력

- invite_code (6자리 숫자)

## 처리

1. invite_code로 journey 조회
2. 현재 멤버 수가 8명 이상이면 참여 불가
3. 이미 멤버면 무시
4. 아니면 journey_members INSERT (role='member')

## 출력

- journey_id 반환

---

# 5. 비기능 요구사항

---

## 5.1 보안

- Supabase RLS 적용
- is_journey_member 기반 접근 제어
- 멤버가 아닌 경우 접근 불가

---

## 5.2 UX 원칙

- 기록은 가볍고 빠르게
- 입력 필드 최소화
- 감성 중심 UI
- 위치 선택은 선택 사항 (nullable 설계)

---

## 5.3 디자인 방향

- 따뜻한 베이지/파스텔 톤
- 미니멀
- 폴라로이드 감성
- 감정 중심 시각화

---

# 6. 라우팅 구조

```
/login
/journeys
/journey/new
/journey/[id]
/journey/[id]/edit
/journey/[id]/memory/new
/journey/[id]/memory/[memoryId]/edit
```

---

# 7. MVP 범위

## 포함

- 로그인
- Journey 생성
- 6자리 숫자 초대 코드
- 최대 8명 멤버 제한
- 권한 기반 수정/삭제 정책
- 사진 업로드
- 지도 검색 기반 장소 저장
- latitude / longitude / place_id nullable 설계
- 감정 선택
- 지도 표시

## 제외 (2차)

- 댓글
- 좋아요
- 알림
- 통계
- 공개 여행 탐색

---
