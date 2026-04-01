# Bye-Company Vibe 프로젝트 종합 보고서

> 작성일: 2026-03-30

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **프로젝트명** | Bye-Company Vibe |
| **목적** | 40대 맞벌이 딩크 부부를 위한 FIRE(조기 은퇴) D-Day 시뮬레이터 |
| **기술 스택** | Next.js 16 / React 19 / TypeScript / Tailwind CSS v4 / Framer Motion |
| **인증** | NextAuth v5 (카카오 + 구글 OAuth) |
| **저장소** | 브라우저 localStorage (SSR 안전) |
| **총 코드량** | 약 2,500줄 (13개 파일) |

---

## 2. 프로젝트 구조

```
src/
├── app/
│   ├── page.tsx              (103줄)  로그인 페이지
│   ├── layout.tsx             (37줄)  루트 레이아웃
│   ├── providers.tsx          (12줄)  SessionProvider
│   ├── api/auth/[...nextauth]/route.ts  NextAuth API
│   ├── signup/
│   │   ├── page.tsx          (110줄)  회원가입 진입
│   │   └── profile/page.tsx  (161줄)  닉네임 설정
│   ├── dashboard/
│   │   ├── page.tsx          (884줄)  메인 대시보드
│   │   └── setup/page.tsx    (467줄)  재무 프로필 셋업 위저드
│   └── stress-test/page.tsx  (233줄)  스트레스 테스트
├── lib/
│   ├── types.ts       (40줄)  타입 정의
│   ├── constants.ts  (151줄)  기본값, 피드백 문구, 시나리오
│   ├── calculator.ts  (87줄)  FIRE 계산 엔진
│   ├── storage.ts    (117줄)  localStorage CRUD
│   └── auth.ts        (42줄)  NextAuth 설정
```

---

## 3. 사용자 플로우

```
로그인(/)
  → 닉네임 설정(/signup/profile)
    → 재무 셋업 위저드(/dashboard/setup)
      → 대시보드(/dashboard)
           ↕
        스트레스 테스트(/stress-test)
```

---

## 4. 이번 세션에서 수행한 작업

### 4-1. 온보딩 셋업 위저드 전면 개편 (`/dashboard/setup`)

| 피드백 | 적용 내용 |
|--------|----------|
| **온보딩 강화** | Step 0 모티베이션 화면 — "나의 자유까지 남은 시간", "퇴직금 시뮬레이션", "스트레스 테스트" 3가지 가치를 카드로 보여준 뒤 "약 30초면 충분해요" 안내 |
| **단계별 입력** | 5개 필드를 **한 페이지에 한 필드씩** 표시 — 프로그레스 바 + "2/5" 단계 표시, 좌우 슬라이드 애니메이션 |
| **퀵 프리셋** | 각 필드에 빠른 선택 버튼 (예: 총자산 "1억/3억/5억/10억", 수익률 "4%/6%/8%/10%") |
| **실시간 미리보기** | 월 생활비 단계에서 저축액 미리보기, 마지막 단계에서 D-Day 미리보기 |

### 4-2. 대시보드 비주얼 강화 (`/dashboard`)

| 피드백 | 적용 내용 |
|--------|----------|
| **Tide 앱 물결 게이지** | FIRE 달성률(현재 자산/목표 자금)에 따라 물결 수위가 차오르는 SVG 애니메이션 — 2겹 파도, 6초/4.5초 주기 출렁임 |
| **달성률 기반 색상 전환** | 0~30%: 깊은 파랑(바다) → 30~50%: 청록(순항) → 50~80%: 앰버(일출) → 80~100%: 로즈(선셋) |
| **FIRE 달성률 바** | 카드 상단에 "FIRE 38% 달성" 미니 프로그레스 |
| **실시간 카운트다운** | 매 1초 갱신 `000일 00시 00분 00초` 타이머 |
| **비주얼 모티브** | 비행기, 야자수, 일출, 우산 아이콘이 부유하는 framer-motion 애니메이션 |
| **공유 카드** | D-Day 카드 → 공유 버튼 → "회사 탈출까지 D-XXX" 인스타 스토리용 4:5 카드 (html-to-image로 PNG 저장/공유) |
| **위트 있는 비교 데이터** | 2x2 그리드: ☕남은 출근길 커피, 😩남은 월요일 아침, 🍿넷플릭스 환산, 💰총 저축액 |

### 4-3. 튜토리얼 삭제

| 변경 | 내용 |
|------|------|
| `/signup/welcome` 삭제 | 환영 슬라이드 3장짜리 페이지 제거 |
| 셋업 후 이동 경로 변경 | `/signup/welcome` → `/dashboard` 직행 |

---

## 5. 주요 기능 상태

| 기능 | 상태 | 설명 |
|------|------|------|
| 카카오/구글 OAuth | ✅ | NextAuth v5 기반 소셜 로그인 |
| 5단계 셋업 위저드 | ✅ | 모티베이션 → 필드별 1페이지씩 → D-Day 미리보기 |
| Tide 스타일 물결 게이지 | ✅ | FIRE 달성률 기반 수위 + 색상 전환 |
| 실시간 초 카운트다운 | ✅ | `useCountdown` 훅, 매초 갱신 |
| 지출 슬라이더 시뮬레이션 | ✅ | ±50만원/월, 실시간 피드백 문구 |
| 결제 충동 참기 | ✅ | 금액/카테고리 입력 → 앞당긴 일수 계산 |
| 위트 비교 데이터 | ✅ | 커피잔, 월요일, 넷플릭스, 저축액 |
| 공유 카드 | ✅ | 그라데이션 D-Day 카드 PNG 저장 + Web Share API |
| 스트레스 테스트 | ✅ | 6개 시나리오 복수 선택, 기본 vs 시나리오 비교 |
| 다크 모드 | ✅ | 전체 페이지 Tailwind dark: 지원 |

---

## 6. 의존 패키지

### Runtime

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `next` | 16.2.1 | React 프레임워크 (App Router) |
| `react` / `react-dom` | 19.2.4 | UI 라이브러리 |
| `next-auth` | 5.0.0-beta.30 | OAuth 인증 |
| `framer-motion` | 12.38.0 | 애니메이션 (물결, 슬라이드, 부유 아이콘) |
| `html-to-image` | 1.11.x | 공유 카드 PNG 이미지 생성 |
| `lucide-react` | 1.7.0 | 아이콘 라이브러리 |
| `clsx` | 2.1.1 | 조건부 className |
| `tailwind-merge` | 3.5.0 | Tailwind 클래스 병합 |

### Dev

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `typescript` | 5.x | 타입 체크 |
| `tailwindcss` | 4.x | CSS 프레임워크 |
| `eslint` | 9.x | 린터 |

---

## 7. 핵심 모듈 설명

### `calculator.ts` — FIRE 계산 엔진

- `calcTargetAmount()`: 목표 자금 = 은퇴 후 월 생활비 × 12 × 25 (4% 룰)
- `calculateMonthsToFIRE()`: 복리 시뮬레이션으로 FIRE 도달 개월 수 계산 (최대 600개월 캡)
- `calcMonthsFromProfile()`: 프로필 기반 한번에 계산
- `getSliderFeedback()`: 금액 구간별 피드백 문구 랜덤 선택
- `formatProjectedDate()`: "YYYY년 M월" 형식 변환

### `storage.ts` — localStorage 래퍼

- `UserProfile` CRUD, `ResistRecord` CRUD
- 온보딩 상태 플래그 (`setup-done`, `signup-done`)
- 닉네임 저장/로드
- `clearUserData()`: 로그아웃 시 전체 정리
- 모든 함수 SSR 안전 (`typeof window` 체크)

### `constants.ts` — 상수 관리

- 기본 프로필: 4억 자산, 800만 소득, 350만 생활비, 6% 수익률
- 저축 피드백 5단계 / 지출 피드백 4단계
- 참기 카테고리 7개
- 스트레스 시나리오 6개

---

## 8. 페이지별 상세

### `/dashboard` — 메인 대시보드 (884줄)

**핵심 컴포넌트:**
- `WaveGauge`: Tide 앱 영감 물결 SVG 애니메이션
- `useCountdown`: 실시간 초 단위 카운트다운 훅
- `ShareCardModal`: 인스타 스토리용 공유 카드 (PNG 저장/공유)
- `ResistForm`: 결제 충동 참기 바텀 시트 폼
- `getWittyComparisons`: 위트 있는 비교 데이터 생성
- `getTideColors`: FIRE 달성률 기반 색상 팔레트

**UI 구성:**
1. D-Day 카드 (물결 게이지 + 카운트다운 + 공유 버튼)
2. 위트 비교 데이터 (2x2 그리드)
3. 지출 스와이프 슬라이더 (±50만/월 + 피드백)
4. 참기 버튼 + 통계 카드

### `/dashboard/setup` — 셋업 위저드 (467줄)

**UI 구성:**
- Step 0: 모티베이션 (3가지 기능 소개 카드)
- Step 1~5: 필드별 한 페이지 (아이콘 + 큰 입력 + 퀵 프리셋 버튼)
- 프로그레스 바 + "n/5" 단계 표시
- 방향 인식 슬라이드 애니메이션 (앞으로/뒤로)
- 월 저축액 미리보기 (Step 3), D-Day 미리보기 (Step 5)

### `/stress-test` — 스트레스 테스트 (233줄)

**6개 시나리오:**
1. 소득 30% 감소
2. 투자 수익률 하락 (6% → 3%)
3. 생활비 50만원 증가
4. 목표 생활비 상향
5. 보너스 2000만원
6. 복합 위기 (소득↓ + 지출↑ + 수익률↓)

---

## 9. Git 상태

```
브랜치: main (origin/main과 동기화)
미커밋 변경:
  - modified: src/app/dashboard/page.tsx (물결 게이지, 카운트다운, 비교 데이터, 공유 카드)
  - modified: src/app/dashboard/setup/page.tsx (멀티스텝 위저드, 프리셋, 모티베이션)
  - modified: package.json (html-to-image 추가)
  - deleted:  src/app/signup/welcome/page.tsx (튜토리얼 삭제)
```

---

## 10. 향후 개선 가능 사항

| 영역 | 제안 |
|------|------|
| **백엔드 연동** | localStorage → DB (Supabase 등)로 데이터 영속화 |
| **컴포넌트 분리** | dashboard/page.tsx (884줄) → 컴포넌트 파일 분리 |
| **Lottie 애니메이션** | SVG 물결 → Lottie 파일로 더 정교한 애니메이션 |
| **푸시 알림** | D-Day 마일스톤 알림 (D-100, D-365 등) |
| **소셜 기능** | 친구와 은퇴 D-Day 비교, 랭킹 |
| **차트 시각화** | 자산 성장 곡선, 월별 저축 추이 그래프 |
