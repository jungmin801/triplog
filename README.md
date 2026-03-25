# Triplog

Triplog는 여행을 가볍게 기록하고, 함께한 사람들과 추억을 공유할 수 있도록 만든 모바일 여행 기록 앱입니다. 폴라로이드 감성의 카드 UI를 중심으로 여행 생성, 초대 코드 참여, 사진 기반 기억 기록, 감정 태깅까지 한 흐름으로 묶었습니다.

## 프로젝트 한 줄 소개

- Google 로그인으로 바로 시작하는 여행 기록 앱
- 여행 단위로 멤버를 초대하고 함께 추억을 쌓는 구조
- 사진, 텍스트, 날짜, 위치, 감정을 함께 저장하는 기록 경험

## 주요 기능

- `Google OAuth` 기반 로그인
- 여행 생성, 수정, 삭제
- 6자리 초대 코드로 여행 참여
- 여행별 썸네일 업로드 및 멤버/기억 개수 확인
- 사진 업로드 기반 `Memory` 생성 및 수정
- 감정 선택(`happy`, `excited`, `calm`, `sad`, `surprised`)
- 이미지 EXIF GPS 또는 수동 장소 검색으로 위치 저장
- 프로필 화면에서 참여한 여행 수, 남긴 기억 수 확인

## 사용 기술

### App

- `Expo` + `React Native`
- `Expo Router` 기반 파일 라우팅
- `TypeScript`
- `NativeWind` + Tailwind 스타일링

### State / Form

- `@tanstack/react-query`로 서버 상태 관리
- `react-hook-form` + `zod`로 입력 폼과 검증 처리

### Backend / Infra

- `Supabase Auth`로 Google 로그인
- `Supabase Database`로 여행, 멤버, 기억 데이터 관리
- `Supabase Storage`로 썸네일/이미지 업로드
- `Row Level Security(RLS)` 기반 접근 제어
- 트리거/RPC로 초대 코드 생성, owner 등록, 참여 처리 자동화

### Device / External API

- `expo-image-picker`로 사진 선택
- `react-native-maps`로 지도 확장 준비
- `Google Places API` / `Geocoding API`로 장소 검색 및 역지오코딩

## 이 프로젝트가 다루는 도메인

- `Journey`: 여행 단위의 상위 엔티티
- `JourneyMember`: 여행 참여자와 owner/member 권한
- `Memory`: 사진, 설명, 감정, 위치, 날짜를 담는 기록
- `Profile`: 로그인 사용자 프로필

현재 코드 기준으로 여정당 최대 8명, 기억은 최대 50개까지 저장하도록 설계되어 있습니다.

## 앞으로 업데이트하고 싶은 기능

- 지도 기반 여행 동선 보기
- 기억 위치를 마커로 표시하는 `Map View`
- 감정별 기록을 지도 위에서 시각화하는 기능
- 날짜순으로 여행을 따라가는 타임라인 화면 고도화
- 초대 링크 진입 후 자동 참여 같은 공유 흐름 개선

## 실행 방법

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 만들고 아래 값을 채워 주세요.

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=your_google_places_api_key
```

### 3. 앱 실행

```bash
npm run start
```

필요하면 아래 명령으로 플랫폼별 실행도 가능합니다.

```bash
npm run ios
npm run android
npm run web
```

## 프로젝트 구조

```text
app/         Expo Router 라우트
components/  공통 UI 컴포넌트
screen/      여정/기억 폼 화면
lib/         Supabase 쿼리, 업로드, 위치 유틸
hooks/       사용자/레이아웃 관련 훅
constants/   감정, 국가, 컬러 상수
provider/    인증 컨텍스트
assets/      폰트와 이미지 에셋
```

## 백엔드 문서

- [requirements.md](./requirements.md): 서비스 요구사항
- [ERD.md](./ERD.md): 테이블 구조와 관계
- [RLS.md](./RLS.md): 접근 제어 정책 설계
- [TRIGGERS_AND_FUNCTIONS.md](./TRIGGERS_AND_FUNCTIONS.md): 트리거와 RPC 설계
