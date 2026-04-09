# Bye-Company Vibe 프로젝트 종합 보고서

> 최초 작성: 2026-03-30 / 최종 업데이트: 2026-04-09

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **프로젝트명** | Bye-Company Vibe (`아임 파이어족`) |
| **목적** | 40대 맞벌이 딩크족을 위한 FIRE(조기 은퇴) D-Day 시뮬레이터 |
| **기술 스택** | Next.js 16.2.1 / React 19.2.4 / TypeScript / Tailwind CSS v4 / Framer Motion |
| **인증** | NextAuth v5 beta (카카오 + 구글 OAuth) |
| **저장소** | 브라우저 localStorage (SSR 안전 처리) |
| **배포** | Vercel (main 브랜치 자동 배포) |

---

## 2. 프로젝트 구조

```
bye-company-vibe/
├── next.config.ts                         # Next.js 설정 + 보안 헤더
├── src/
│   ├── app/
│   │   ├── page.tsx                       # 로그인/랜딩 페이지 (카카오/구글 OAuth)
│   │   ├── layout.tsx                     # 루트 레이아웃 (메타데이터, 웹폰트)
│   │   ├── providers.tsx                  # SessionProvider 래핑
│   │   ├── api/auth/[...nextauth]/
│   │   │   └── route.ts                   # NextAuth API 핸들러
│   │   ├── signup/
│   │   │   ├── page.tsx                   # /signup → / 리다이렉트
│   │   │   └── profile/page.tsx           # 닉네임 설정
│   │   ├── dashboard/
│   │   │   ├── page.tsx                   # 메인 대시보드 (D-Day, 차트, 설정 시트)
│   │   │   ├── layout.tsx                 # 대시보드 레이아웃
│   │   │   ├── setup/page.tsx             # 재무 프로필 6단계 위저드
│   │   │   └── analyzing/page.tsx         # 분석 로딩 화면
│   │   └── survival/
│   │       ├── page.tsx                   # 버티기 허브
│   │       ├── death-note/page.tsx        # 데스노트
│   │       ├── resignation/page.tsx       # 사직서 미리 쓰기
│   │       └── routine/page.tsx           # 은퇴 후 일과
│   ├── components/
│   │   ├── GradeCard.tsx                  # 등급 진단서 공유 카드
│   │   ├── BankruptcySlope.tsx            # 파산 슬로프 차트 (Recharts)
│   │   ├── GradeCard.tsx                  # S/A/B/C 등급 카드 + 공유
│   │   ├── RoutineWheel.tsx               # 원형 일과표
│   │   └── ThemeToggle.tsx                # 다크모드 토글
│   └── lib/
│       ├── types.ts                       # 타입 정의 (UserProfile 등)
│       ├── constants.ts                   # 기본값, 피드백 문구, 등급 메타
│       ├── calculator.ts                  # FIRE 계산 엔진
│       ├── storage.ts                     # localStorage CRUD
│       └── auth.ts                        # NextAuth 설정 (Google/Kakao)
```

---

## 3. 사용자 플로우

```
로그인 (/)
  └─ 신규 사용자 → 닉네임 설정 (/signup/profile)
       └─ 재무 프로필 입력 (/dashboard/setup) ── 6단계 위저드
            └─ 분석 로딩 (/dashboard/analyzing)
                 └─ 메인 대시보드 (/dashboard)
                      ├─ [은퇴계산기 탭]  D-Day 카운트다운 / 파산슬로프 / 결과공유
                      └─ [버티기 탭]      데스노트 / 사직서 / 은퇴 후 일과
```

---

## 4. 세션별 작업 이력

---

### 세션 1 (2026-03-30) — 핵심 기능 구축

#### 4-1. 온보딩 셋업 위저드 (`/dashboard/setup`)

| 내용 | 설명 |
|------|------|
| **1페이지 1질문** | 6개 필드를 한 화면에 하나씩 표시 |
| **커스텀 숫자 키패드** | OS 기본 키보드 대신 앱 전용 키패드 |
| **퀵버튼** | 각 필드에 자주 쓰는 값 빠른 선택 |
| **실시간 피드백** | 수익률/저축액 입력 시 경고·격려 문구 즉시 표시 |
| **방향 인식 슬라이드** | 이전/다음에 따라 슬라이드 방향 반전 |
| **프로그레스 바** | 상단 노란 진행 바로 현재 단계 시각화 |

**지원 필드:**
1. 탈출 자금 (즉시 동원 가능한 현금, 만원 단위)
2. 월 저축액
3. 연간 투자 수익률 (%)
4. 은퇴까지 목표 연수
5. 은퇴 후 월 생활비
6. 사후 대책 (자유 텍스트)

#### 4-2. 대시보드 (`/dashboard`)

| 기능 | 설명 |
|------|------|
| **D-Day 카드** | 일·시·분·초 실시간 카운트다운 |
| **마키 티커** | 남은 월요일 수, 자산 생존 기간, 은퇴 시점 예상 자산, 노예 지수 |
| **파산 슬로프** | Recharts 기반 자산 추이 차트 (은퇴 전후) |
| **결과 공유** | S/A/B/C 등급 진단서 카드 → PNG 저장 + Web Share API |
| **탭 구조** | 은퇴계산기 / 버티기 두 탭, iOS 26 글래스모피즘 탭바 |
| **다크모드** | ThemeToggle 전역 지원 |
| **로그아웃/탈퇴** | 드롭다운 시트, 탈퇴 시 localStorage 전체 초기화 |

#### 4-3. 버티기 킷

| 메뉴 | 설명 |
|------|------|
| **데스노트** | 이름+이유 입력, localStorage 저장, 궁서체 빨간 글씨 |
| **사직서 미리 쓰기** | 제목/내용 자유 작성, 저장 |
| **은퇴 후 일과** | 시간대별 계획 입력 + RoutineWheel 원형 시각화 |

#### 4-4. FIRE 계산 엔진 (`calculator.ts`)

| 함수 | 설명 |
|------|------|
| `calcDDay()` | 목표 연수 → 오늘 기준 D-Day |
| `calcMondaysLeft()` | 남은 월요일 횟수 |
| `calcSurvivalDays()` | 현재 자산으로 버틸 수 있는 일수 |
| `calcSurvivalYears()` | 은퇴 시점부터 자산 소진까지 연수 |
| `calcSlopeData()` | 연도별 자산 추이 배열 (파산 슬로프용) |
| `calcGrade()` | S/A/B/C 등급 판정 |
| `calcAssetsAtRetirement()` | 은퇴 시점 예상 자산 (복리 계산) |
| `formatRetirementDate()` | "YYYY년 MM월" 형식 변환 |
| `getReturnRateWarning()` | 수익률 경고 문구 |
| `getSavingsComment()` | 저축액 코멘트 문구 |

---

### 세션 2 (2026-04-09) — 보안 강화 + 모바일 UX 최적화

#### 4-5. 보안 헤더 설정 (`next.config.ts`) — **신규**

로그인/회원가입 기능 포함에 따른 HTTP 보안 헤더 전면 적용.

| 헤더 | 설정값 | 목적 |
|------|--------|------|
| `Content-Security-Policy` | 상세 정책 (하단 참조) | XSS·인젝션 방어 |
| `X-Frame-Options` | `DENY` | 클릭재킹 방지 |
| `X-Content-Type-Options` | `nosniff` | MIME 스니핑 방지 |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | HTTPS 강제 (2년) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | 외부 전송 URL 최소화 |
| `Permissions-Policy` | camera/mic/location/payment 차단 | 불필요 API 비활성화 |
| `X-DNS-Prefetch-Control` | `on` | DNS 프리페치 허용 (성능) |

**CSP 허용 범위:**
- 스크립트: `'self' 'unsafe-inline' 'unsafe-eval'` (Next.js 하이드레이션 필수)
- 스타일: `'self' 'unsafe-inline' cdn.jsdelivr.net` (Tailwind + Pretendard CDN)
- 폰트: `'self' cdn.jsdelivr.net data:`
- 이미지: `'self' data: blob: *.googleusercontent.com *.kakaocdn.net`
- 프레임: `accounts.google.com *.googleapis.com kauth.kakao.com *.kakao.com`
- 플러그인: `'none'` (Flash 등 완전 차단)

**취약점 검토 결과:**
- `.env.local` — `.gitignore`에 포함되어 git 노출 없음 ✅
- 자체 DB 없음, localStorage 전용 — SQL 인젝션 해당 없음 ✅
- OAuth 전용 로그인 — 비밀번호 해싱 불필요 ✅
- `AUTH_SECRET` 환경변수 — NextAuth v5 권장 이름으로 변경 권고 (현재 `NEXTAUTH_SECRET` 사용 중, 호환 동작)

---

#### 4-6. 설정 시트 모바일 최적화 (`dashboard/page.tsx` → `SettingsSheet`) — **개선**

**변경 전 문제:**
- 라벨(`w-28` 고정) + 입력이 한 줄에 배치 → 좁은 화면에서 입력 공간 부족
- Q1~Q6 배지가 코드에 정의됐으나 화면에 표시 안 됨
- 수익률 필드에 소수점 키보드(`decimal`) 미적용
- 입력값 전체 삭제 시 0으로 반영 안 되는 버그

**변경 내용:**

| 항목 | 이전 | 이후 |
|------|------|------|
| 레이아웃 | 라벨 + 입력 가로 한 줄 | 라벨 위 / 입력 아래 **세로 스택** |
| 라벨 너비 | `w-28` 고정 | 제한 없음 (전체 너비 활용) |
| Q배지 | 미표시 | Q1~Q6 실제 표시 |
| 입력 폰트 | `text-[20px]` | `text-[18px]` |
| 텍스트 정렬 | 모두 오른쪽 | 숫자 오른쪽, 텍스트(사후대책) 왼쪽 |
| 수익률 키보드 | `numeric` | `decimal` (소수점 입력 가능) |
| 빈값 처리 | 버그 (이전 값 유지) | 빈 칸 삭제 시 0으로 저장 |

---

#### 4-7. 결과 공유 카드 모바일 최적화 (`GradeCard.tsx`) — **개선**

**변경 전 문제:**
- `fixed inset-0 flex items-center justify-center` → 뷰포트 초과 시 스크롤 불가
- 카드 `aspectRatio: "4/5"` 고정 → 좁은 화면에서 카드 높이 줄어 하단 짤림
- `justify-between` + `h-full` → 중간 등급 텍스트가 크면 D-Day 섹션이 `overflow-hidden`에 잘림
- 구분선(`border-t`)이 부자연스럽게 표시

**단계별 수정:**

| 단계 | 수정 내용 |
|------|----------|
| 1차 | 모달을 `overflow-y-auto`로 변경, 카드 내부 패딩 `p-8 → p-6` |
| 2차 | `justify-between` → `mt-auto`로 D-Day 하단 고정 |
| 3차 | `aspectRatio` 완전 제거, 콘텐츠 기반 높이로 전환 (`gap-6` 레이아웃) |
| 4차 | **PC에서 `sm:aspect-[4/5]` 복원**, 모바일만 유동 비율 유지, 구분선 제거 |

**최종 상태:**

| 환경 | 카드 비율 | 내부 레이아웃 |
|------|-----------|--------------|
| 모바일 (`< 640px`) | 콘텐츠 높이 유동 | `gap-6` 자연 간격 |
| PC (`≥ 640px`) | `aspect-[4/5]` 고정 | `justify-between` 상중하 배치 |

---

#### 4-8. 데스노트 이모지 수정 (`survival/death-note/page.tsx`) — **수정**

- `NEGATIVE_EMOJIS` 배열에서 `🖤` (검은 하트) 제거
- 잔여 이모지: `💀 👿 😤 🤬 😈 🔪 ⚰️ 😡 👹` (9종)

---

#### 4-9. `node_modules` 재설치 — **환경 복구**

- 기존 `node_modules` 일부 누락으로 개발 서버 실행 불가 (`Cannot find module 'react'`)
- `rm -rf node_modules package-lock.json && npm install`로 완전 재설치
- Node.js v25.6.1 / npm 11.9.0 환경 기준

---

## 5. 주요 기능 현황

| 기능 | 상태 | 비고 |
|------|------|------|
| 카카오/구글 OAuth 로그인 | ✅ 정상 | NextAuth v5 beta.30 |
| 6단계 재무 프로필 위저드 | ✅ 정상 | 커스텀 키패드 + 퀵버튼 |
| D-Day 실시간 카운트다운 | ✅ 정상 | 1초 단위 갱신 |
| 마키 티커 | ✅ 정상 | 4개 지표 무한 루프 |
| 파산 슬로프 차트 | ✅ 정상 | Recharts |
| S/A/B/C 등급 진단 | ✅ 정상 | `calcGrade()` 기반 |
| 결과 공유 카드 | ✅ 정상 | PNG 저장 + Web Share API |
| 설정 시트 수치 재입력 | ✅ 정상 | 모바일 최적화 완료 |
| 데스노트 | ✅ 정상 | 궁서체 빨간 글씨, 9종 이모지 |
| 사직서 미리 쓰기 | ✅ 정상 | |
| 은퇴 후 일과 + 원형 차트 | ✅ 정상 | RoutineWheel |
| 다크모드 | ✅ 정상 | 전역 next-themes |
| HTTP 보안 헤더 | ✅ 신규 적용 | 7종 헤더 |

---

## 6. 의존 패키지

### Runtime

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `next` | 16.2.1 | React 프레임워크 (App Router) |
| `react` / `react-dom` | 19.2.4 | UI 라이브러리 |
| `next-auth` | 5.0.0-beta.30 | OAuth 인증 |
| `framer-motion` | 12.38.0 | 페이지 전환, 모달, 애니메이션 |
| `recharts` | 3.8.1 | 파산 슬로프 차트 |
| `html-to-image` | 1.11.13 | 공유 카드 PNG 생성 |
| `lucide-react` | 1.7.0 | 아이콘 |
| `next-themes` | 0.4.6 | 다크모드 |
| `clsx` | 2.1.1 | 조건부 className |
| `tailwind-merge` | 3.5.0 | Tailwind 클래스 병합 |

### Dev

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `typescript` | 5.x | 타입 체크 |
| `tailwindcss` | 4.x | CSS 프레임워크 |
| `@tailwindcss/postcss` | 4.x | PostCSS 연동 |
| `eslint` | 9.x | 린터 |
| `eslint-config-next` | 16.2.1 | Next.js ESLint 규칙 |

---

## 7. 환경 변수 (`.env.local`)

| 변수 | 설명 |
|------|------|
| `KAKAO_CLIENT_ID` | 카카오 REST API 키 |
| `KAKAO_CLIENT_SECRET` | 카카오 Client Secret |
| `GOOGLE_CLIENT_ID` | Google OAuth 클라이언트 ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 클라이언트 시크릿 |
| `NEXTAUTH_URL` | 서비스 URL (로컬: `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | NextAuth 세션 암호화 키 (v5 권장명: `AUTH_SECRET`) |

> `.env.local`은 `.gitignore`에 포함되어 있어 git에 커밋되지 않습니다.

---

## 8. 보안 검토 요약

| 항목 | 결과 |
|------|------|
| HTTP 보안 헤더 | ✅ 7종 적용 완료 |
| 환경변수 git 노출 | ✅ 안전 (`.env*` gitignore) |
| XSS | ✅ CSP + React 기본 이스케이프 |
| SQL 인젝션 | ✅ 해당 없음 (DB 없음) |
| CSRF | ✅ NextAuth 내장 처리 |
| 비밀번호 저장 | ✅ 해당 없음 (OAuth 전용) |
| 라우트 인증 보호 | ⚠️ 클라이언트 리다이렉트만 적용 (미들웨어 서버 보호 미적용) |

> 라우트 보호 미들웨어(`src/middleware.ts`)는 기존 클라이언트 리다이렉트 로직과의 충돌 우려로 적용 보류. 필요 시 `/dashboard/*` 한정 적용 가능.

---

## 9. 향후 개선 가능 사항

| 영역 | 제안 | 우선순위 |
|------|------|---------|
| **라우트 보호** | `src/middleware.ts`로 `/dashboard/*` 서버 인증 보호 | 높음 |
| **AUTH_SECRET** | `.env.local`의 `NEXTAUTH_SECRET` → `AUTH_SECRET`으로 변수명 변경 | 보통 |
| **백엔드 연동** | localStorage → DB(Supabase 등)로 영속화, 기기 간 동기화 | 높음 |
| **컴포넌트 분리** | `dashboard/page.tsx` 대형화 → 기능별 컴포넌트 파일 분리 | 보통 |
| **PWA** | `manifest.json` + Service Worker로 홈 화면 추가 | 낮음 |
| **푸시 알림** | D-Day 마일스톤(D-100, D-365 등) 알림 | 낮음 |
| **소셜 기능** | 친구와 은퇴 D-Day 비교, 랭킹 | 낮음 |
