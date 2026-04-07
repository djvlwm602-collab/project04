# 은퇴 계산기 전면 개편 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 FIRE 대시보드를 "은퇴 서바이벌 계산기"로 전면 개편 — 6문 6답 → 파산 슬로프 대시보드 → 등급 진단서 → 오피스 서바이벌 킷 순서로 구성

**Architecture:** 데이터 레이어(types/calculator/storage) 교체 후 페이지 순서대로 재구축. 신규 필드(liquidAssets, monthlySavings, retirementYears 등)로 UserProfile 교체. 파산 슬로프는 recharts LineChart 사용.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS, Framer Motion, next-auth v5, recharts, html-to-image

---

## 파일 구조 (전체)

### 수정
- `src/lib/types.ts` — UserProfile 교체, 서바이벌 킷 타입 추가
- `src/lib/constants.ts` — DEFAULT_PROFILE 교체, 등급 임계값 추가
- `src/lib/calculator.ts` — 전면 재작성 (복리 계산 → 적립/인출 2단계)
- `src/lib/storage.ts` — 새 프로필 키 + 서바이벌 킷 CRUD 추가
- `src/app/page.tsx` — 랜딩 페이지 감성 리디자인
- `src/app/dashboard/setup/page.tsx` — 6문 6답 T형 말투로 교체
- `src/app/dashboard/page.tsx` — 대시보드 전면 재설계

### 신규
- `src/components/BankruptcySlope.tsx` — 파산 슬로프 라인 차트
- `src/components/GradeCard.tsx` — S/A/B/C 등급 진단서 + 공유
- `src/app/dashboard/analyzing/page.tsx` — Step 4 분석 로딩 화면
- `src/app/survival/page.tsx` — 오피스 서바이벌 킷 허브
- `src/app/survival/death-note/page.tsx` — 데스노트 기능
- `src/app/survival/resignation/page.tsx` — 사직서 미리 쓰기
- `src/app/survival/routine/page.tsx` — 은퇴 후 일과 + 원형 시각화
- `src/components/RoutineWheel.tsx` — 원형 일과표 SVG 컴포넌트

---

## Task 1: 데이터 타입 교체 (types.ts)

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Step 1: UserProfile 타입 교체**

```typescript
// src/lib/types.ts 전체 교체

/**
 * 역할: 프로젝트 전역에서 사용하는 타입 정의
 * 핵심 기능: UserProfile (6문 6답), 서바이벌 킷 타입
 * 의존: 없음
 */

// 6문 6답으로 수집하는 재무 프로필
export interface UserProfile {
  liquidAssets: number;       // Q1 즉시 동원 가능한 현금 (원)
  monthlySavings: number;     // Q2 월 순저축액 (원)
  investReturnRate: number;   // Q3 연 투자 수익률 (0.06 = 6%)
  retirementYears: number;    // Q4 은퇴까지 남은 연수
  monthlyExpense: number;     // Q5 은퇴 후 월 생활비 (원)
  retirementPlan: string;     // Q6 퇴사 후 계획 (주관식)
}

export type RetirementGrade = "S" | "A" | "B" | "C";

// 파산 슬로프 차트용 데이터 포인트
export interface AssetDataPoint {
  label: string;    // "현재", "3년 후", "은퇴", "+10년" 등
  assets: number;   // 해당 시점 자산 (원)
  phase: "accumulation" | "drawdown"; // 적립기 / 인출기
}

// 데스노트 항목
export interface DeathNoteEntry {
  id: string;
  name: string;       // 이름/별명
  reason: string;     // 이유
  createdAt: string;  // ISO 날짜
}

// 사직서
export interface ResignationLetter {
  recipient: string;    // 수신인 (예: "OOO 대표이사 귀중")
  content: string;      // 본문
  updatedAt: string;    // 마지막 수정 ISO 날짜
}

// 은퇴 후 일과 항목
export interface RoutineItem {
  id: string;
  startHour: number;    // 0~23
  durationHours: number; // 1~24
  activity: string;      // 활동명
  color: string;         // hex 색상
}

export interface UserNickname {
  nickname: string;
  profileImage?: string;
}
```

- [ ] **Step 2: 커밋**

```bash
cd bye-company-vibe
git add src/lib/types.ts
git commit -m "refactor: UserProfile 6문6답 모델로 교체, 서바이벌 킷 타입 추가"
```

---

## Task 2: 상수 및 기본값 교체 (constants.ts)

**Files:**
- Modify: `src/lib/constants.ts`

- [ ] **Step 1: constants.ts 전체 교체**

```typescript
// src/lib/constants.ts 전체 교체

/**
 * 역할: 기본값, 등급 임계값, T형 경고 문구 상수 관리
 * 핵심 기능: DEFAULT_PROFILE, GRADE_THRESHOLDS, T_WARNINGS
 * 의존: types.ts
 */

import type { UserProfile, RetirementGrade } from "./types";

export const DEFAULT_PROFILE: UserProfile = {
  liquidAssets: 50000000,      // 5,000만원
  monthlySavings: 1000000,     // 100만원
  investReturnRate: 0.06,      // 6%
  retirementYears: 10,         // 10년
  monthlyExpense: 2000000,     // 200만원
  retirementPlan: "",
};

// 은퇴 자금이 몇 년을 버티는지에 따른 등급
export const GRADE_THRESHOLDS: Record<RetirementGrade, number> = {
  S: 35,   // 35년 이상 버팀 → "지금 당장 사표"
  A: 20,   // 20~35년 → "조만간 짐 싸도 됩니다"
  B: 10,   // 10~20년 → "굶고 사세요"
  C: 0,    // 10년 미만 → "죽기 전날까지 출근"
};

export const GRADE_META: Record<RetirementGrade, {
  label: string;
  caption: string;
  color: string;
  bg: string;
}> = {
  S: {
    label: "지금 당장 사표 던지세요",
    caption: "지옥 탈출 성공. 난 먼저 간다, 니들은 알아서 버텨라. ㅃㅇ",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  A: {
    label: "조만간 짐 싸셔도 됩니다",
    caption: "내 해방일은 20XX년. 이 회사 사람들 얼굴 볼 날도 얼마 안 남았다.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  B: {
    label: "은퇴는 되는데 굶고 사세요",
    caption: "탈출은 하는데... 은퇴 후에 물만 마셔야 함. 이게 맞냐?",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  C: {
    label: "죽기 전날까지 출근하세요",
    caption: "내 은퇴일: 계산 불가. 난 그냥 회사의 부품이었음",
    color: "text-red-600",
    bg: "bg-red-50",
  },
};

// Q3 수익률 실시간 T형 경고 문구
export const RETURN_RATE_WARNINGS: Array<{ threshold: number; message: string }> = [
  { threshold: 0.3, message: "마법사인가요? 워렌 버핏도 연 20%입니다." },
  { threshold: 0.2, message: "코인 트레이더십니까? 계좌가 증명하는 숫자를 쓰세요." },
  { threshold: 0.15, message: "희망 회로 작동 중. 현실적으로 조정하세요." },
  { threshold: 0.1, message: "공격적이네요. S&P500 장기 평균은 10%입니다." },
];

// Q2 저축 대비 실시간 T형 코멘트
export const SAVINGS_COMMENTS: Array<{ threshold: number; message: string }> = [
  { threshold: 3000000, message: "월 300만 이상? 진짜입니까. 우상향 확정." },
  { threshold: 1000000, message: "월 100만 이상. 평균은 넘겼습니다." },
  { threshold: 300000, message: "월 30만... 이 속도면 은퇴가 묘지에서 가능합니다." },
  { threshold: 0, message: "0원? 지금 당장 고정비를 점검하세요." },
];

// 분석 로딩 화면 텍스트 시퀀스
export const ANALYZING_TEXTS = [
  "3만 가지 파산 시나리오 분석 중...",
  "월급날과 카드값 비교 분석 중...",
  "부장님 얼굴 볼 날 수 카운팅 중...",
  "현실 직시 데이터 컴파일 중...",
  "퇴사 가능일 시뮬레이션 완료.",
];
```

- [ ] **Step 2: 커밋**

```bash
git add src/lib/constants.ts
git commit -m "refactor: 상수 전면 교체 — 등급 임계값, T형 경고 문구 추가"
```

---

## Task 3: 계산 로직 재작성 (calculator.ts)

**Files:**
- Modify: `src/lib/calculator.ts`

- [ ] **Step 1: calculator.ts 전체 재작성**

```typescript
// src/lib/calculator.ts 전체 재작성

/**
 * 역할: 은퇴 계산 로직 — 적립기(복리) + 인출기(소진) 2단계
 * 핵심 기능: 적립 자산 계산, 파산 시점 계산, 등급 판정, 슬로프 데이터 생성
 * 의존: types.ts, constants.ts
 */

import type { UserProfile, RetirementGrade, AssetDataPoint } from "./types";
import { GRADE_THRESHOLDS, RETURN_RATE_WARNINGS, SAVINGS_COMMENTS } from "./constants";

// ── 적립기: 은퇴 시점의 자산 계산 ─────────────────────────
// 현재 자산 + 매월 저축 + 복리 수익률로 retirementYears년 후 자산 계산
export function calcAssetsAtRetirement(profile: UserProfile): number {
  const monthlyRate = profile.investReturnRate / 12;
  const months = profile.retirementYears * 12;
  let assets = profile.liquidAssets;

  for (let i = 0; i < months; i++) {
    assets = assets * (1 + monthlyRate) + profile.monthlySavings;
  }
  return assets;
}

// ── 인출기: 은퇴 자금이 몇 년을 버티는지 계산 ────────────────
// 은퇴 자금에서 매월 생활비를 빼되 잔여 자산은 계속 복리 운용
// 최대 100년으로 상한 처리
export function calcSurvivalYears(profile: UserProfile): number {
  const retirementAssets = calcAssetsAtRetirement(profile);
  const monthlyRate = profile.investReturnRate / 12;
  let assets = retirementAssets;
  let months = 0;

  while (assets > 0 && months < 1200) {
    assets = assets * (1 + monthlyRate) - profile.monthlyExpense;
    months++;
  }
  return Math.floor(months / 12);
}

// ── 등급 판정 ──────────────────────────────────────────────
export function calcGrade(profile: UserProfile): RetirementGrade {
  const years = calcSurvivalYears(profile);
  if (years >= GRADE_THRESHOLDS.S) return "S";
  if (years >= GRADE_THRESHOLDS.A) return "A";
  if (years >= GRADE_THRESHOLDS.B) return "B";
  return "C";
}

// ── D-Day (일 단위) ────────────────────────────────────────
export function calcDDay(profile: UserProfile): number {
  return Math.round(profile.retirementYears * 365);
}

// ── 남은 월요일 수 ────────────────────────────────────────
export function calcMondaysLeft(profile: UserProfile): number {
  return Math.round(profile.retirementYears * 52);
}

// ── 현재 자산으로 버틸 수 있는 일 수 ──────────────────────
export function calcSurvivalDays(profile: UserProfile): number {
  if (profile.monthlyExpense <= 0) return 0;
  const dailyExpense = profile.monthlyExpense / 30;
  return Math.floor(profile.liquidAssets / dailyExpense);
}

// ── 파산 슬로프 차트 데이터 생성 ──────────────────────────
// 적립기: 0 ~ retirementYears (연 단위 포인트)
// 인출기: 이후 파산 시점까지 (연 단위 포인트, 최대 50년)
export function calcSlopeData(profile: UserProfile): AssetDataPoint[] {
  const points: AssetDataPoint[] = [];
  const monthlyRate = profile.investReturnRate / 12;

  // 적립기
  let assets = profile.liquidAssets;
  points.push({ label: "현재", assets, phase: "accumulation" });

  for (let year = 1; year <= profile.retirementYears; year++) {
    for (let m = 0; m < 12; m++) {
      assets = assets * (1 + monthlyRate) + profile.monthlySavings;
    }
    points.push({
      label: year === profile.retirementYears ? "은퇴" : `${year}년`,
      assets: Math.round(assets),
      phase: "accumulation",
    });
  }

  // 인출기 (최대 50년)
  for (let year = 1; year <= 50; year++) {
    for (let m = 0; m < 12; m++) {
      assets = assets * (1 + monthlyRate) - profile.monthlyExpense;
      if (assets <= 0) {
        points.push({
          label: `은퇴+${year}년`,
          assets: 0,
          phase: "drawdown",
        });
        return points;
      }
    }
    points.push({
      label: `은퇴+${year}년`,
      assets: Math.round(assets),
      phase: "drawdown",
    });
  }

  return points;
}

// ── 은퇴 예정일 포맷 ────────────────────────────────────────
export function formatRetirementDate(profile: UserProfile): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + profile.retirementYears);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
}

// ── Q3 수익률 실시간 경고 문구 ─────────────────────────────
export function getReturnRateWarning(rate: number): string | null {
  const match = RETURN_RATE_WARNINGS.find((w) => rate >= w.threshold);
  return match?.message ?? null;
}

// ── Q2 저축액 실시간 코멘트 ────────────────────────────────
export function getSavingsComment(amount: number): string | null {
  const match = SAVINGS_COMMENTS.find((c) => amount >= c.threshold);
  return match?.message ?? null;
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/lib/calculator.ts
git commit -m "refactor: 계산 로직 2단계(적립/인출)로 재작성, 등급·슬로프 함수 추가"
```

---

## Task 4: 스토리지 업데이트 (storage.ts)

**Files:**
- Modify: `src/lib/storage.ts`

- [ ] **Step 1: storage.ts 전체 교체**

```typescript
// src/lib/storage.ts 전체 교체

/**
 * 역할: localStorage 읽기/쓰기 래퍼 (SSR 안전)
 * 핵심 기능: UserProfile CRUD, 온보딩 상태, 서바이벌 킷 CRUD
 * 의존: types.ts, constants.ts
 */

import type {
  UserProfile, UserNickname,
  DeathNoteEntry, ResignationLetter, RoutineItem
} from "./types";
import { DEFAULT_PROFILE } from "./constants";

const PROFILE_KEY       = "bce-profile-v2";       // v2: 새 데이터 모델
const SETUP_DONE_KEY    = "bce-setup-done";
const NICKNAME_KEY      = "bce-nickname";
const SIGNUP_DONE_KEY   = "bce-signup-done";
const DEATH_NOTE_KEY    = "bce-death-note";
const RESIGNATION_KEY   = "bce-resignation";
const ROUTINE_KEY       = "bce-routine";

// ── UserProfile ────────────────────────────────────────────

export function loadProfile(): UserProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(profile: UserProfile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

// ── 온보딩 완료 여부 ────────────────────────────────────────

export function isSetupDone(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SETUP_DONE_KEY) === "true";
}

export function markSetupDone(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETUP_DONE_KEY, "true");
}

export function isSignupDone(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SIGNUP_DONE_KEY) === "true";
}

export function markSignupDone(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SIGNUP_DONE_KEY, "true");
}

// ── 닉네임/프로필 ────────────────────────────────────────────

export function loadNickname(): UserNickname | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(NICKNAME_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveNickname(data: UserNickname): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(NICKNAME_KEY, JSON.stringify(data));
}

// ── 데스노트 ────────────────────────────────────────────────

export function loadDeathNote(): DeathNoteEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DEATH_NOTE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addDeathNoteEntry(entry: DeathNoteEntry): void {
  if (typeof window === "undefined") return;
  const entries = loadDeathNote();
  entries.unshift(entry);
  localStorage.setItem(DEATH_NOTE_KEY, JSON.stringify(entries));
}

export function deleteDeathNoteEntry(id: string): void {
  if (typeof window === "undefined") return;
  const entries = loadDeathNote().filter((e) => e.id !== id);
  localStorage.setItem(DEATH_NOTE_KEY, JSON.stringify(entries));
}

// ── 사직서 ────────────────────────────────────────────────

export function loadResignation(): ResignationLetter | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(RESIGNATION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveResignation(letter: ResignationLetter): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(RESIGNATION_KEY, JSON.stringify(letter));
}

// ── 은퇴 후 일과 ──────────────────────────────────────────

export function loadRoutine(): RoutineItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ROUTINE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRoutine(items: RoutineItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ROUTINE_KEY, JSON.stringify(items));
}

// ── 로그아웃 시 초기화 ───────────────────────────────────────
// 프로필/설정 완료 여부는 유지 — 재로그인 시 대시보드로 바로 이동

export function clearUserData(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(NICKNAME_KEY);
  localStorage.removeItem(SIGNUP_DONE_KEY);
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/lib/storage.ts
git commit -m "refactor: 스토리지 v2 키로 교체, 서바이벌 킷 CRUD 추가"
```

---

## Task 5: 랜딩 페이지 감성 리디자인 (page.tsx)

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: 랜딩 페이지 전체 교체**

```tsx
// src/app/page.tsx 전체 교체

/**
 * 역할: 서비스 진입점 — 감성 랜딩 + 소셜 로그인
 * 핵심 기능: 강렬한 타이포, 카카오/구글 로그인, 인증 상태 리다이렉트
 * 의존: next-auth, lib/storage
 */
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { isSetupDone, isSignupDone } from "@/lib/storage";
import Link from "next/link";

export default function LandingPage() {
  const router = useRouter();
  const { status } = useSession();
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      if (isSetupDone()) router.replace("/dashboard");
      else if (isSignupDone()) router.replace("/dashboard/setup");
      else router.replace("/signup/profile");
    }
  }, [status, router]);

  const handleLogin = (provider: "kakao" | "google") => {
    setLoadingProvider(provider);
    const callbackUrl = isSetupDone()
      ? "/dashboard"
      : isSignupDone()
        ? "/dashboard/setup"
        : "/signup/profile";
    signIn(provider, { callbackUrl });
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#FEE500] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0a0a0a] p-6">
      {/* 배경 그라데이션 효과 */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FEE500]/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative flex w-full max-w-md flex-col items-center gap-10"
      >
        {/* 메인 카피 */}
        <div className="flex flex-col items-center gap-4 text-center">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-[13px] font-bold uppercase tracking-[0.2em] text-[#FEE500]/60"
          >
            은퇴 서바이벌 계산기
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            className="text-[38px] font-black leading-tight tracking-tight text-white"
          >
            오늘도<br />
            <span className="text-[#FEE500]">견디는</span><br />
            당신에게
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="text-[15px] font-medium leading-relaxed text-white/40"
          >
            ㅅㅂ.. 언제 탈출할 수 있을까?<br />
            당신의 비밀 탈출 시나리오를 계산합니다.
          </motion.p>
        </div>

        {/* 로그인 버튼 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.5 }}
          className="flex w-full flex-col gap-3"
        >
          <button
            onClick={() => handleLogin("kakao")}
            disabled={loadingProvider !== null}
            className="flex w-full items-center justify-center gap-2.5 rounded-[18px] bg-[#FEE500] py-4 text-[16px] font-bold text-[#3C1E1E] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60"
          >
            {loadingProvider === "kakao" ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0 fill-current">
                <path d="M12 3c-5.52 0-10 3.51-10 7.85 0 2.8 1.83 5.25 4.6 6.55-.42 1.6-1.34 3.12-1.38 3.19-.04.07-.07.16-.01.23.05.08.14.13.24.13.12 0 .21-.03.28-.06 2.05-1.03 4.1-2.22 4.19-2.27.67.14 1.37.21 2.08.21 5.52 0 10-3.51 10-7.85S17.52 3 12 3z" />
              </svg>
            )}
            카카오로 시작하기
          </button>

          <button
            onClick={() => handleLogin("google")}
            disabled={loadingProvider !== null}
            className="flex w-full items-center justify-center gap-2.5 rounded-[18px] bg-white/10 py-4 text-[16px] font-bold text-white backdrop-blur-sm transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60"
          >
            {loadingProvider === "google" ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            Google로 시작하기
          </button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.5 }}
          className="text-[12px] text-white/30 text-center"
        >
          아직 계정이 없으신가요?{" "}
          <Link href="/signup" className="text-[#FEE500]/60 underline underline-offset-2 hover:text-[#FEE500]">
            회원가입
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/app/page.tsx
git commit -m "design: 랜딩 페이지 다크 감성으로 리디자인"
```

---

## Task 6: 6문 6답 설문 재구성 (dashboard/setup/page.tsx)

**Files:**
- Modify: `src/app/dashboard/setup/page.tsx`

- [ ] **Step 1: setup/page.tsx 전체 교체**

```tsx
// src/app/dashboard/setup/page.tsx 전체 교체

/**
 * 역할: 현실 자각 6문 6답 — T형 말투 인터랙티브 설문
 * 핵심 기능: 1페이지 1질문, 실시간 경고/코멘트, 완료 후 analyzing으로 이동
 * 의존: lib/types, lib/storage, lib/calculator, next-auth
 */
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import type { UserProfile } from "@/lib/types";
import { saveProfile, loadProfile } from "@/lib/storage";
import { getReturnRateWarning, getSavingsComment } from "@/lib/calculator";
import { DEFAULT_PROFILE } from "@/lib/constants";
import { ThemeToggle } from "@/components/ThemeToggle";

// ── 질문 설정 ────────────────────────────────────────────────

interface Question {
  key: keyof UserProfile;
  order: string;          // "Q1"
  title: string;          // 질문 제목
  helperText: string;     // 헬퍼 문구
  unit: string;           // 표시 단위
  inputType: "number" | "text";
  isPercent?: boolean;    // true면 내부값을 %로 변환해서 표시
  placeholder?: string;
}

const QUESTIONS: Question[] = [
  {
    key: "liquidAssets",
    order: "Q1",
    title: "탈출 자금",
    helperText: "대출·부동산 제외, 내일 당장 인출 가능한 액수만.",
    unit: "원",
    inputType: "number",
    placeholder: "50000000",
  },
  {
    key: "monthlySavings",
    order: "Q2",
    title: "연료 보급",
    helperText: "시발비용·고정비 다 빼고, 오직 은퇴용으로 킵하는 돈.",
    unit: "원",
    inputType: "number",
    placeholder: "1000000",
  },
  {
    key: "investReturnRate",
    order: "Q3",
    title: "운용 능력",
    helperText: "희망 회로 말고, 당신의 계좌가 증명하는 '진짜' 실력.",
    unit: "%",
    inputType: "number",
    isPercent: true,
    placeholder: "6",
  },
  {
    key: "retirementYears",
    order: "Q4",
    title: "종료 시점",
    helperText: "남들 다 하는 60세 정년 말고, 스스로 선언하는 카운트다운.",
    unit: "년",
    inputType: "number",
    placeholder: "10",
  },
  {
    key: "monthlyExpense",
    order: "Q5",
    title: "유지 비용",
    helperText: "숨만 쉬어도 나가는 돈. 물가 상승률 무시하지 마세요.",
    unit: "원",
    inputType: "number",
    placeholder: "2000000",
  },
  {
    key: "retirementPlan",
    order: "Q6",
    title: "사후 대책",
    helperText: "노는 거 말고, 잉여 시간을 채울 진짜 계획 한 줄.",
    unit: "",
    inputType: "text",
    placeholder: "예) 카페 창업, 유튜브, 농사",
  },
];

// ── 유틸 ─────────────────────────────────────────────────────

function getDisplayValue(profile: UserProfile, q: Question): string {
  const raw = profile[q.key];
  if (q.inputType === "text") return String(raw);
  if (q.isPercent) {
    const pct = (raw as number) * 100;
    return pct === 0 ? "" : String(pct % 1 === 0 ? pct : parseFloat(pct.toFixed(1)));
  }
  return (raw as number) === 0 ? "" : String(raw as number);
}

function parseInput(q: Question, raw: string): number | string {
  if (q.inputType === "text") return raw;
  const parsed = parseFloat(raw);
  if (isNaN(parsed)) return q.isPercent ? 0 : 0;
  return q.isPercent ? parsed / 100 : parsed;
}

// ── 메인 컴포넌트 ────────────────────────────────────────────

export default function SetupPage() {
  const router = useRouter();
  const { status } = useSession();

  const [step, setStep] = useState(0); // 0~5
  const [direction, setDirection] = useState(1);
  const [profile, setProfile] = useState<UserProfile>(() => loadProfile());
  const [inputValue, setInputValue] = useState("");

  // 인증 체크
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  // step 변경 시 현재 질문의 값을 input에 채움
  useEffect(() => {
    const q = QUESTIONS[step];
    setInputValue(getDisplayValue(profile, q));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const q = QUESTIONS[step];
  const isLast = step === QUESTIONS.length - 1;

  // 실시간 T형 메시지
  const liveMessage = (() => {
    if (q.key === "investReturnRate") {
      const rate = parseFloat(inputValue) / 100;
      return getReturnRateWarning(isNaN(rate) ? 0 : rate);
    }
    if (q.key === "monthlySavings") {
      const amount = parseFloat(inputValue);
      return getSavingsComment(isNaN(amount) ? 0 : amount);
    }
    return null;
  })();

  const handleChange = (val: string) => {
    setInputValue(val);
    const parsed = parseInput(q, val);
    setProfile((prev) => ({ ...prev, [q.key]: parsed }));
  };

  const handleNext = () => {
    if (isLast) {
      saveProfile(profile);
      router.push("/dashboard/analyzing");
    } else {
      setDirection(1);
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  };

  const canProceed = q.inputType === "text"
    ? (profile[q.key] as string).trim().length > 0
    : (profile[q.key] as number) > 0;

  const progress = ((step + 1) / QUESTIONS.length) * 100;

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#FEE500] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-6 bg-background">
      {/* 프로그레스 바 */}
      <div className="absolute top-0 left-0 w-full z-10 px-6 pt-6">
        <div className="mx-auto w-full max-w-md">
          <div className="h-1 w-full rounded-full bg-gray-200 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-[#FEE500]"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[11px] font-bold text-subtext">{q.order}</span>
            <span className="text-[11px] font-bold text-subtext">{step + 1} / {QUESTIONS.length}</span>
          </div>
        </div>
      </div>

      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md pt-16">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: 60 * direction }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 * direction }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="flex flex-col gap-6"
          >
            {/* 질문 헤더 */}
            <div className="flex flex-col gap-2">
              <p className="text-[12px] font-bold tracking-widest text-subtext uppercase">{q.order}</p>
              <h1 className="text-[28px] font-black tracking-tight text-foreground">{q.title}</h1>
              <p className="text-[14px] text-subtext leading-relaxed">{q.helperText}</p>
            </div>

            {/* 입력 영역 */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 rounded-2xl border-2 border-gray-200 bg-background px-5 py-4 focus-within:border-[#FEE500] transition-colors">
                {q.inputType === "number" ? (
                  <input
                    type="number"
                    value={inputValue}
                    onChange={(e) => handleChange(e.target.value)}
                    placeholder={q.placeholder}
                    min={0}
                    className="flex-1 bg-transparent text-[22px] font-black text-foreground outline-none tabular-nums"
                    autoFocus
                  />
                ) : (
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => handleChange(e.target.value)}
                    placeholder={q.placeholder}
                    className="flex-1 bg-transparent text-[18px] font-bold text-foreground outline-none"
                    autoFocus
                  />
                )}
                {q.unit && (
                  <span className="shrink-0 text-[15px] font-bold text-subtext">{q.unit}</span>
                )}
              </div>

              {/* 실시간 T형 경고/코멘트 */}
              <AnimatePresence>
                {liveMessage && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-[13px] font-bold text-amber-600 bg-amber-50 rounded-xl px-4 py-2.5"
                  >
                    {liveMessage}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3 mt-2">
              {step > 0 && (
                <button
                  onClick={handleBack}
                  className="flex items-center justify-center gap-1 rounded-[18px] border border-gray-200 px-5 py-4 text-[14px] font-bold text-subtext hover:bg-gray-50 active:scale-95 transition-all"
                >
                  <ArrowLeft size={16} />
                  이전
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={!canProceed}
                className="flex flex-1 items-center justify-center gap-2 rounded-[18px] bg-[#FEE500] py-4 text-[16px] font-bold text-[#3C1E1E] hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all"
              >
                {isLast ? "결과 분석하기" : (
                  <>다음 <ArrowRight size={18} /></>
                )}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/app/dashboard/setup/page.tsx
git commit -m "feat: 6문 6답 T형 설문 구현 — 실시간 경고, 슬라이드 애니메이션"
```

---

## Task 7: 분석 로딩 화면 신규 생성

**Files:**
- Create: `src/app/dashboard/analyzing/page.tsx`

- [ ] **Step 1: analyzing/page.tsx 생성**

```tsx
// src/app/dashboard/analyzing/page.tsx 신규 생성

/**
 * 역할: Step 4 분석 로딩 화면 — 텍스트 시퀀스 + 완료 후 대시보드 이동
 * 핵심 기능: ANALYZING_TEXTS 순환 표시, 3초 후 자동 이동
 * 의존: lib/constants, next-auth
 */
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ANALYZING_TEXTS } from "@/lib/constants";
import { markSetupDone } from "@/lib/storage";

export default function AnalyzingPage() {
  const router = useRouter();
  const { status } = useSession();
  const [textIndex, setTextIndex] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  // 텍스트 순환 — ANALYZING_TEXTS 길이에 맞춰 균등 분배
  useEffect(() => {
    const totalDuration = 3500; // ms
    const interval = totalDuration / ANALYZING_TEXTS.length;

    const timer = setInterval(() => {
      setTextIndex((prev) => {
        if (prev >= ANALYZING_TEXTS.length - 1) {
          clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, interval);

    // 로딩 완료 후 대시보드로 이동
    const redirect = setTimeout(() => {
      markSetupDone();
      router.replace("/dashboard?confetti=1");
    }, totalDuration + 500);

    return () => {
      clearInterval(timer);
      clearTimeout(redirect);
    };
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 bg-[#0a0a0a] p-6">
      {/* 스피너 */}
      <div className="relative">
        <div className="h-20 w-20 animate-spin rounded-full border-4 border-white/10 border-t-[#FEE500]" />
        <div className="absolute inset-0 flex items-center justify-center text-2xl">🧮</div>
      </div>

      {/* 텍스트 시퀀스 */}
      <div className="h-12 flex items-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={textIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="text-center text-[16px] font-bold text-white/70"
          >
            {ANALYZING_TEXTS[textIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* 진행 바 */}
      <div className="w-64 h-1 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-[#FEE500]"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 3.5, ease: "linear" }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/app/dashboard/analyzing/page.tsx
git commit -m "feat: 분석 로딩 화면 추가 — 텍스트 시퀀스 + 자동 리다이렉트"
```

---

## Task 8: 파산 슬로프 차트 컴포넌트

**Files:**
- Create: `src/components/BankruptcySlope.tsx`

- [ ] **Step 1: recharts 설치**

```bash
cd bye-company-vibe
npm install recharts
```

- [ ] **Step 2: BankruptcySlope.tsx 생성**

```tsx
// src/components/BankruptcySlope.tsx 신규 생성

/**
 * 역할: 파산 슬로프 라인 차트 — 적립기(상승) + 인출기(하강)
 * 핵심 기능: recharts LineChart, 파산 시점 빨간 점, 단계별 색상 구분
 * 의존: recharts, lib/types
 */
"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, Dot
} from "recharts";
import type { AssetDataPoint } from "@/lib/types";

interface Props {
  data: AssetDataPoint[];
  retirementLabel: string; // "은퇴" 시점 label
}

function formatAssets(value: number): string {
  if (value >= 100000000) return `${(value / 100000000).toFixed(1)}억`;
  if (value >= 10000) return `${Math.round(value / 10000)}만`;
  return "0";
}

// 파산 시점(assets === 0)인 포인트에 빨간 점 렌더링
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function BankruptcyDot(props: any) {
  const { cx, cy, payload } = props;
  if (payload.assets !== 0) return null;
  return <circle cx={cx} cy={cy} r={6} fill="#ef4444" stroke="#fff" strokeWidth={2} />;
}

export function BankruptcySlope({ data, retirementLabel }: Props) {
  const retirementIndex = data.findIndex((d) => d.label === retirementLabel);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "#9ca3af" }}
          interval="preserveStartEnd"
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatAssets}
          tick={{ fontSize: 10, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
          width={40}
        />
        <Tooltip
          formatter={(value: number) => [formatAssets(value), "자산"]}
          labelStyle={{ fontSize: 12, fontWeight: "bold" }}
          contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
        />
        {/* 은퇴 시점 구분선 */}
        {retirementIndex >= 0 && (
          <ReferenceLine
            x={retirementLabel}
            stroke="#FEE500"
            strokeDasharray="4 4"
            label={{ value: "은퇴", position: "top", fontSize: 11, fill: "#92400e" }}
          />
        )}
        <Line
          type="monotone"
          dataKey="assets"
          stroke="#22c55e"
          strokeWidth={2.5}
          dot={<BankruptcyDot />}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 3: 커밋**

```bash
git add src/components/BankruptcySlope.tsx package.json package-lock.json
git commit -m "feat: 파산 슬로프 recharts 차트 컴포넌트 추가"
```

---

## Task 9: 대시보드 전면 재설계 (dashboard/page.tsx)

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: dashboard/page.tsx 전체 교체**

```tsx
// src/app/dashboard/page.tsx 전체 교체

/**
 * 역할: 팩트 폭격 대시보드 — D-Day, 파산 슬로프, 등급 진단, 서바이벌 킷
 * 핵심 기능: 실시간 카운트다운, 슬로프 차트, 등급 카드, 서바이벌 킷 진입
 * 의존: lib/calculator, lib/storage, lib/constants, BankruptcySlope, GradeCard
 */
"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Settings, LogOut, Share2, Skull } from "lucide-react";
import type { UserProfile } from "@/lib/types";
import {
  calcDDay, calcMondaysLeft, calcSurvivalDays,
  calcSlopeData, calcGrade, formatRetirementDate,
  calcAssetsAtRetirement,
} from "@/lib/calculator";
import { loadProfile, isSetupDone, clearUserData, saveProfile } from "@/lib/storage";
import { GRADE_META } from "@/lib/constants";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BankruptcySlope } from "@/components/BankruptcySlope";
import { GradeCard } from "@/components/GradeCard";

// ── 실시간 카운트다운 훅 ────────────────────────────────────

function useCountdown(years: number) {
  const targetDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + years);
    return d.getTime();
  }, [years]);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const diff = Math.max(0, targetDate - now);
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

// ── 꽃가루 컴포넌트 ─────────────────────────────────────────

const CONFETTI_COLORS = ["#ef4444","#3b82f6","#22c55e","#FEE500","#8b5cf6","#f97316"];
const CONFETTI_PIECES = Array.from({ length: 80 }, (_, i) => ({
  id: i,
  left: Math.random() * 100,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  duration: 2.5 + Math.random() * 2.5,
  delay: Math.random() * 2,
}));

const ConfettiExplosion = () => (
  <>
    <style>{`
      @keyframes fall {
        0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
        100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
      }
    `}</style>
    <div className="fixed inset-0 z-[70] pointer-events-none">
      {CONFETTI_PIECES.map((p) => (
        <div
          key={p.id}
          className="absolute w-2 h-4"
          style={{
            left: `${p.left}%`,
            top: "-5%",
            backgroundColor: p.color,
            animation: `fall ${p.duration}s ${p.delay}s linear forwards`,
          }}
        />
      ))}
    </div>
  </>
);

// ── 설정 시트 컴포넌트 ──────────────────────────────────────

function SettingsSheet({
  profile,
  onClose,
  onSave,
}: {
  profile: UserProfile;
  onClose: () => void;
  onSave: (p: UserProfile) => void;
}) {
  const [draft, setDraft] = useState<UserProfile>({ ...profile });

  const fields: Array<{
    key: keyof UserProfile;
    label: string;
    unit: string;
    isPercent?: boolean;
    isText?: boolean;
  }> = [
    { key: "liquidAssets", label: "탈출 자금", unit: "원" },
    { key: "monthlySavings", label: "월 저축", unit: "원" },
    { key: "investReturnRate", label: "수익률", unit: "%", isPercent: true },
    { key: "retirementYears", label: "은퇴까지", unit: "년" },
    { key: "monthlyExpense", label: "은퇴 후 생활비", unit: "원" },
    { key: "retirementPlan", label: "사후 대책", unit: "", isText: true },
  ];

  const displayVal = (key: keyof UserProfile, isPercent?: boolean, isText?: boolean): string => {
    const v = draft[key];
    if (isText) return v as string;
    if (isPercent) {
      const pct = (v as number) * 100;
      return String(pct % 1 === 0 ? pct : parseFloat(pct.toFixed(1)));
    }
    return String(v as number);
  };

  const handleChange = (key: keyof UserProfile, val: string, isPercent?: boolean, isText?: boolean) => {
    if (isText) { setDraft((p) => ({ ...p, [key]: val })); return; }
    const parsed = parseFloat(val);
    if (isNaN(parsed)) return;
    const internal = isPercent ? parsed / 100 : parsed;
    setDraft((p) => ({ ...p, [key]: internal }));
  };

  const handleSave = () => {
    saveProfile(draft);
    onSave(draft);
    onClose();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
      />
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-lg rounded-t-[28px] bg-background shadow-2xl"
        style={{ maxHeight: "90vh" }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-gray-300" />
        </div>
        <div className="flex items-center justify-between px-6 pt-2 pb-4 border-b border-gray-100">
          <h2 className="text-[18px] font-extrabold text-foreground">수치 재입력</h2>
        </div>
        <div className="overflow-y-auto px-6 pb-8" style={{ maxHeight: "calc(90vh - 160px)" }}>
          <div className="flex flex-col gap-4 pt-4">
            {fields.map(({ key, label, unit, isPercent, isText }) => (
              <div key={key} className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-foreground">{label}</label>
                <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus-within:border-[#FEE500] transition-all">
                  <input
                    type={isText ? "text" : "number"}
                    value={displayVal(key, isPercent, isText)}
                    onChange={(e) => handleChange(key, e.target.value, isPercent, isText)}
                    className="flex-1 bg-transparent text-[16px] font-bold text-foreground outline-none"
                  />
                  {unit && <span className="text-[13px] font-bold text-subtext">{unit}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="px-6 pb-8 pt-2">
          <button
            onClick={handleSave}
            className="w-full rounded-[18px] bg-[#FEE500] py-4 text-[16px] font-bold text-[#3C1E1E] hover:scale-[1.02] active:scale-95 transition-all shadow-sm"
          >
            저장하기
          </button>
        </div>
      </motion.div>
    </>
  );
}

// ── 대시보드 메인 ───────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showGradeCard, setShowGradeCard] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!isSetupDone()) { router.replace("/dashboard/setup"); return; }
    setProfile(loadProfile());
  }, [status, router]);

  // confetti=1 파라미터 감지
  useEffect(() => {
    if (!profile) return;
    if (searchParams.get("confetti") !== "1") return;
    router.replace("/dashboard");
    const t1 = setTimeout(() => setShowConfetti(true), 100);
    const t2 = setTimeout(() => setShowConfetti(false), 5000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [profile, searchParams, router]);

  const dDay = profile ? calcDDay(profile) : 0;
  const mondays = profile ? calcMondaysLeft(profile) : 0;
  const survivalDays = profile ? calcSurvivalDays(profile) : 0;
  const grade = profile ? calcGrade(profile) : "C";
  const gradeMeta = GRADE_META[grade];
  const retirementDate = profile ? formatRetirementDate(profile) : "";
  const slopeData = useMemo(() => profile ? calcSlopeData(profile) : [], [profile]);
  const retirementAssets = profile ? Math.round(calcAssetsAtRetirement(profile) / 100000000 * 10) / 10 : 0;
  const countdown = useCountdown(profile?.retirementYears ?? 0);

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#FEE500] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F5F7] font-sans text-foreground">
      {showConfetti && <ConfettiExplosion />}

      {/* 헤더 */}
      <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm">
        <h1 className="text-lg font-extrabold tracking-tight">은퇴 계산기</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setShowSettings(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-subtext hover:bg-gray-100 transition-colors"
          >
            <Settings size={20} />
          </button>
          <button
            onClick={() => { clearUserData(); signOut({ callbackUrl: "/" }); }}
            className="flex h-9 w-9 items-center justify-center rounded-full text-subtext hover:bg-gray-100 transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center p-5 sm:p-8 gap-4">
        <div className="w-full max-w-md space-y-4">

          {/* ── D-Day 메인 카드 ────────────────────────────── */}
          <div className="rounded-[24px] bg-white px-6 py-8 shadow-[0_2px_20px_rgb(0,0,0,0.06)] flex flex-col items-center gap-4">
            {/* 카운트다운 */}
            <div className="flex items-center gap-1.5">
              {[
                { v: countdown.days, l: "일" },
                { v: countdown.hours, l: "시" },
                { v: countdown.minutes, l: "분" },
                { v: countdown.seconds, l: "초" },
              ].map(({ v, l }) => (
                <div key={l} className="flex items-baseline gap-0.5">
                  <span className="inline-block min-w-[2.2ch] rounded-lg bg-gray-100 px-2 py-1.5 text-center text-[18px] font-black tabular-nums text-gray-700">
                    {String(v).padStart(2, "0")}
                  </span>
                  <span className="text-[11px] font-bold text-gray-400">{l}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col items-center gap-1 text-center">
              <p className="text-[13px] font-bold text-gray-400">자유까지</p>
              <h2 className="text-[48px] font-black leading-none tracking-tight text-gray-900">
                D-{dDay.toLocaleString()}
              </h2>
              <p className="text-[18px] font-extrabold text-gray-600">{retirementDate}</p>
            </div>

            {/* 등급 뱃지 */}
            <button
              onClick={() => setShowGradeCard(true)}
              className={`flex items-center gap-2 rounded-full px-5 py-2 ${gradeMeta.bg} transition-all hover:scale-[1.02] active:scale-95`}
            >
              <span className={`text-[22px] font-black ${gradeMeta.color}`}>{grade}등급</span>
              <span className={`text-[12px] font-bold ${gradeMeta.color} opacity-70`}>{gradeMeta.label}</span>
              <Share2 size={14} className={gradeMeta.color} />
            </button>
          </div>

          {/* ── 팩트 카드 3종 ───────────────────────────────── */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgb(0,0,0,0.05)] text-center">
              <p className="text-[11px] font-bold text-gray-400 mb-1">남은 월요일</p>
              <p className="text-[20px] font-black text-gray-800">{mondays.toLocaleString()}</p>
              <p className="text-[10px] text-gray-400">번</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgb(0,0,0,0.05)] text-center">
              <p className="text-[11px] font-bold text-gray-400 mb-1">지금 자산으로</p>
              <p className="text-[20px] font-black text-gray-800">{survivalDays.toLocaleString()}</p>
              <p className="text-[10px] text-gray-400">일 버팀</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgb(0,0,0,0.05)] text-center">
              <p className="text-[11px] font-bold text-gray-400 mb-1">은퇴 시 자산</p>
              <p className="text-[20px] font-black text-gray-800">{retirementAssets}</p>
              <p className="text-[10px] text-gray-400">억원</p>
            </div>
          </div>

          {/* ── 파산 슬로프 ─────────────────────────────────── */}
          <div className="rounded-[24px] bg-white px-5 py-5 shadow-[0_2px_20px_rgb(0,0,0,0.06)]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[15px] font-extrabold text-gray-800">파산 슬로프</h3>
              <span className="text-[11px] font-bold text-red-400 bg-red-50 rounded-full px-2.5 py-1">
                🔴 파산 시점
              </span>
            </div>
            <BankruptcySlope data={slopeData} retirementLabel="은퇴" />
          </div>

          {/* ── 오피스 서바이벌 킷 ───────────────────────────── */}
          <button
            onClick={() => router.push("/survival")}
            className="flex w-full items-center justify-between rounded-2xl bg-white px-5 py-4 shadow-[0_2px_12px_rgb(0,0,0,0.05)] hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
                <Skull size={18} className="text-red-500" />
              </div>
              <div className="text-left">
                <p className="text-[15px] font-bold text-foreground">오피스 서바이벌 킷</p>
                <p className="text-[12px] text-gray-400">데스노트 · 사직서 · 은퇴 후 일과</p>
              </div>
            </div>
            <span className="text-[13px] font-bold text-gray-300">›</span>
          </button>

        </div>
      </main>

      {/* 등급 진단서 모달 */}
      <AnimatePresence>
        {showGradeCard && profile && (
          <GradeCard
            grade={grade}
            profile={profile}
            nickname={session?.user?.name ?? ""}
            retirementDate={retirementDate}
            onClose={() => setShowGradeCard(false)}
          />
        )}
      </AnimatePresence>

      {/* 설정 시트 */}
      <AnimatePresence>
        {showSettings && profile && (
          <SettingsSheet
            profile={profile}
            onClose={() => setShowSettings(false)}
            onSave={(updated) => {
              setProfile(updated);
              setShowConfetti(true);
              setTimeout(() => setShowConfetti(false), 5000);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: 대시보드 전면 재설계 — D-Day, 슬로프, 팩트 카드 3종, 등급 뱃지"
```

---

## Task 10: 등급 진단서 컴포넌트 (GradeCard.tsx)

**Files:**
- Create: `src/components/GradeCard.tsx`

- [ ] **Step 1: GradeCard.tsx 생성**

```tsx
// src/components/GradeCard.tsx 신규 생성

/**
 * 역할: S/A/B/C 등급 진단서 모달 — 공유용 카드 생성 + 이미지 저장/공유
 * 핵심 기능: html-to-image로 카드 이미지 생성, Web Share API 연동
 * 의존: lib/types, lib/constants, html-to-image
 */
"use client";

import { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Download, Share2, X } from "lucide-react";
import type { UserProfile, RetirementGrade } from "@/lib/types";
import { GRADE_META } from "@/lib/constants";
import { calcDDay, calcSurvivalYears } from "@/lib/calculator";

interface Props {
  grade: RetirementGrade;
  profile: UserProfile;
  nickname: string;
  retirementDate: string;
  onClose: () => void;
}

const GRADE_BG: Record<RetirementGrade, string> = {
  S: "from-emerald-400 via-teal-500 to-cyan-500",
  A: "from-blue-400 via-indigo-500 to-violet-500",
  B: "from-amber-400 via-orange-500 to-red-400",
  C: "from-slate-500 via-gray-600 to-zinc-700",
};

export function GradeCard({ grade, profile, nickname, retirementDate, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const meta = GRADE_META[grade];
  const dDay = calcDDay(profile);
  const survivalYears = calcSurvivalYears(profile);

  const handleSave = useCallback(async () => {
    if (!cardRef.current || saving) return;
    setSaving(true);
    try {
      const { toPng } = await import("html-to-image");
      const url = await toPng(cardRef.current, { pixelRatio: 3, cacheBust: true });
      const a = document.createElement("a");
      a.download = `retirement-grade-${grade}.png`;
      a.href = url;
      a.click();
    } finally {
      setSaving(false);
    }
  }, [saving, grade]);

  const handleShare = useCallback(async () => {
    if (!cardRef.current || saving) return;
    setSaving(true);
    try {
      const { toBlob } = await import("html-to-image");
      const blob = await toBlob(cardRef.current, { pixelRatio: 3, cacheBust: true });
      if (!blob) return;
      if (navigator.share) {
        await navigator.share({
          title: `은퇴 등급: ${grade}`,
          files: [new File([blob], `grade-${grade}.png`, { type: "image/png" })],
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.download = `grade-${grade}.png`;
        a.href = url;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      if (e instanceof Error && e.name !== "AbortError") console.error(e);
    } finally {
      setSaving(false);
    }
  }, [saving, grade]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-6"
      >
        <div className="flex w-full max-w-sm flex-col items-center gap-4">
          {/* 닫기 버튼 */}
          <button onClick={onClose} className="self-end text-white/60 hover:text-white transition-colors">
            <X size={24} />
          </button>

          {/* 진단서 카드 */}
          <div
            ref={cardRef}
            className={`relative w-full overflow-hidden rounded-3xl bg-gradient-to-br ${GRADE_BG[grade]} p-8 shadow-2xl`}
            style={{ aspectRatio: "4 / 5" }}
          >
            {/* 배경 장식 */}
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10" />
            <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/10" />

            <div className="relative z-10 flex h-full flex-col justify-between text-white">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-widest opacity-70">은퇴 진단서</p>
                <p className="mt-1 text-[13px] font-bold opacity-60">{nickname || "익명의 직장인"}</p>
              </div>

              <div className="flex flex-col gap-2">
                <div className="text-[80px] font-black leading-none tracking-tight drop-shadow-lg">
                  {grade}
                </div>
                <p className="text-[16px] font-extrabold">{meta.label}</p>
                <p className="mt-2 text-[13px] font-medium leading-relaxed opacity-80">
                  {meta.caption}
                </p>
              </div>

              <div className="flex justify-between">
                <div>
                  <p className="text-[11px] opacity-60">D-Day</p>
                  <p className="text-[18px] font-extrabold">D-{dDay.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] opacity-60">은퇴 후 {survivalYears}년 생존</p>
                  <p className="text-[13px] font-bold opacity-80">{retirementDate} 예정</p>
                </div>
              </div>
            </div>
          </div>

          {/* 공유/저장 버튼 */}
          <div className="flex w-full gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-[15px] font-bold text-gray-800 shadow-lg hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all"
            >
              <Download size={18} /> 저장
            </button>
            <button
              onClick={handleShare}
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-[15px] font-bold text-gray-800 shadow-lg hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all"
            >
              <Share2 size={18} /> 공유
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/components/GradeCard.tsx
git commit -m "feat: S/A/B/C 등급 진단서 컴포넌트 — 이미지 저장 및 공유"
```

---

## Task 11: 오피스 서바이벌 킷 허브

**Files:**
- Create: `src/app/survival/page.tsx`

- [ ] **Step 1: survival/page.tsx 생성**

```tsx
// src/app/survival/page.tsx 신규 생성

/**
 * 역할: 오피스 서바이벌 킷 허브 — 3가지 기능 진입점
 * 핵심 기능: 데스노트, 사직서, 은퇴 후 일과 진입
 * 의존: next-auth, next/navigation
 */
"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, BookOpen, FileText, Sun } from "lucide-react";

const KITS = [
  {
    href: "/survival/death-note",
    icon: BookOpen,
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
    title: "데스노트",
    desc: "꼴 보기 싫은 상사/동료를 빨간 글씨로 기록",
  },
  {
    href: "/survival/resignation",
    icon: FileText,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-500",
    title: "사직서 미리 쓰기",
    desc: "가슴속 품고 다니는 사직서, 솔직하게 작성",
  },
  {
    href: "/survival/routine",
    icon: Sun,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-500",
    title: "은퇴 후 일과",
    desc: "시간 단위로 작성 + 원형 일과표 시각화",
  },
];

export default function SurvivalPage() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F5F7]">
      <header className="flex h-16 items-center gap-3 border-b border-gray-200 bg-white px-6 shadow-sm">
        <button onClick={() => router.back()} className="text-subtext hover:text-foreground transition-colors">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-extrabold">오피스 서바이벌 킷</h1>
      </header>

      <main className="flex flex-1 flex-col items-center p-5">
        <div className="w-full max-w-md flex flex-col gap-3 mt-2">
          <p className="text-[13px] font-bold text-subtext text-center py-2">
            퇴사 전까지 버티기 위한 비밀 무기들
          </p>
          {KITS.map((kit, i) => (
            <motion.button
              key={kit.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => router.push(kit.href)}
              className="flex w-full items-center gap-4 rounded-2xl bg-white px-5 py-5 shadow-[0_2px_12px_rgb(0,0,0,0.05)] hover:bg-gray-50 active:scale-[0.98] transition-all text-left"
            >
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${kit.iconBg}`}>
                <kit.icon size={22} className={kit.iconColor} />
              </div>
              <div>
                <p className="text-[16px] font-extrabold text-foreground">{kit.title}</p>
                <p className="text-[12px] text-subtext mt-0.5">{kit.desc}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/app/survival/page.tsx
git commit -m "feat: 오피스 서바이벌 킷 허브 페이지 추가"
```

---

## Task 12: 데스노트

**Files:**
- Create: `src/app/survival/death-note/page.tsx`

- [ ] **Step 1: death-note/page.tsx 생성**

```tsx
// src/app/survival/death-note/page.tsx 신규 생성

/**
 * 역할: 데스노트 — 꼴 보기 싫은 인물 빨간 글씨로 기록
 * 핵심 기능: 이름+이유 입력, localStorage 저장, 목록 표시/삭제
 * 의존: lib/storage, lib/types, next-auth
 */
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import type { DeathNoteEntry } from "@/lib/types";
import { loadDeathNote, addDeathNoteEntry, deleteDeathNoteEntry } from "@/lib/storage";

export default function DeathNotePage() {
  const router = useRouter();
  const { status } = useSession();
  const [entries, setEntries] = useState<DeathNoteEntry[]>([]);
  const [name, setName] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  useEffect(() => {
    setEntries(loadDeathNote());
  }, []);

  const handleAdd = () => {
    const trimName = name.trim();
    const trimReason = reason.trim();
    if (!trimName || !trimReason) return;

    const entry: DeathNoteEntry = {
      id: Date.now().toString(),
      name: trimName,
      reason: trimReason,
      createdAt: new Date().toISOString(),
    };
    addDeathNoteEntry(entry);
    setEntries(loadDeathNote());
    setName("");
    setReason("");
  };

  const handleDelete = (id: string) => {
    deleteDeathNoteEntry(id);
    setEntries(loadDeathNote());
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a]">
      <header className="flex h-16 items-center gap-3 border-b border-white/10 px-6">
        <button onClick={() => router.back()} className="text-white/50 hover:text-white transition-colors">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-extrabold text-white">📓 데스노트</h1>
      </header>

      <main className="flex flex-1 flex-col items-center p-5">
        <div className="w-full max-w-md flex flex-col gap-5">
          {/* 입력 폼 */}
          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 p-5">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름 또는 별명"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[16px] font-bold text-red-400 placeholder:text-white/20 outline-none focus:border-red-500/50"
            />
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="이유 (한 줄로)"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[14px] text-white/70 placeholder:text-white/20 outline-none focus:border-red-500/50"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <button
              onClick={handleAdd}
              disabled={!name.trim() || !reason.trim()}
              className="flex items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-[14px] font-bold text-white disabled:opacity-40 hover:bg-red-500 active:scale-95 transition-all"
            >
              <Plus size={16} />
              기록하기
            </button>
          </div>

          {/* 목록 */}
          <div className="flex flex-col gap-2">
            <AnimatePresence>
              {entries.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4"
                >
                  <div>
                    <p className="text-[16px] font-black text-red-400">{entry.name}</p>
                    <p className="text-[13px] text-white/50 mt-0.5">{entry.reason}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="text-white/20 hover:text-red-400 transition-colors mt-0.5"
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            {entries.length === 0 && (
              <p className="text-center text-[13px] text-white/30 py-8">
                아직 아무도 없네요. 정말요?
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/app/survival/death-note/page.tsx
git commit -m "feat: 데스노트 기능 — 빨간 글씨 기록 + localStorage 저장"
```

---

## Task 13: 사직서 미리 쓰기

**Files:**
- Create: `src/app/survival/resignation/page.tsx`

- [ ] **Step 1: resignation/page.tsx 생성**

```tsx
// src/app/survival/resignation/page.tsx 신규 생성

/**
 * 역할: 사직서 미리 쓰기 — 수신인 + 본문 자유 작성, localStorage 자동 저장
 * 핵심 기능: 실시간 저장, 마지막 수정일 표시
 * 의존: lib/storage, lib/types
 */
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Save } from "lucide-react";
import type { ResignationLetter } from "@/lib/types";
import { loadResignation, saveResignation } from "@/lib/storage";

export default function ResignationPage() {
  const router = useRouter();
  const { status } = useSession();
  const [letter, setLetter] = useState<ResignationLetter>({
    recipient: "",
    content: "",
    updatedAt: "",
  });
  const [saved, setSaved] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  useEffect(() => {
    const loaded = loadResignation();
    if (loaded) setLetter(loaded);
  }, []);

  // 입력 후 1초 디바운스 자동 저장
  const handleChange = (field: keyof ResignationLetter, value: string) => {
    const updated = { ...letter, [field]: value, updatedAt: new Date().toISOString() };
    setLetter(updated);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveResignation(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 1000);
  };

  const lastSaved = letter.updatedAt
    ? new Date(letter.updatedAt).toLocaleString("ko-KR", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-[#fafaf8]">
      <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-subtext hover:text-foreground transition-colors">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-lg font-extrabold">📄 사직서</h1>
        </div>
        <div className="flex items-center gap-2">
          {saved && <Save size={16} className="text-green-500" />}
          {lastSaved && (
            <span className="text-[11px] text-subtext">{lastSaved} 저장됨</span>
          )}
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center p-5">
        <div className="w-full max-w-md flex flex-col gap-4">
          <div className="rounded-2xl bg-white border border-gray-200 p-6 shadow-sm flex flex-col gap-4">
            <div className="text-center border-b border-gray-100 pb-4">
              <h2 className="text-[20px] font-black text-gray-800">사 직 서</h2>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-subtext">수신인</label>
              <input
                type="text"
                value={letter.recipient}
                onChange={(e) => handleChange("recipient", e.target.value)}
                placeholder="예) OOO 대표이사 귀중"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-[14px] text-gray-700 outline-none focus:border-gray-400 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-subtext">본문</label>
              <textarea
                value={letter.content}
                onChange={(e) => handleChange("content", e.target.value)}
                placeholder="진심을 담아 솔직하게 쓰세요. 어차피 아무도 안 봅니다."
                rows={10}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-[14px] text-gray-700 outline-none focus:border-gray-400 transition-colors resize-none leading-relaxed"
              />
            </div>

            <p className="text-[11px] text-subtext text-center">
              입력 후 자동 저장됩니다. 진짜 제출하지 마세요. 🙏
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/app/survival/resignation/page.tsx
git commit -m "feat: 사직서 미리 쓰기 — 자동 저장, 수신인/본문 입력"
```

---

## Task 14: 은퇴 후 일과 + 원형 시각화

**Files:**
- Create: `src/components/RoutineWheel.tsx`
- Create: `src/app/survival/routine/page.tsx`

- [ ] **Step 1: RoutineWheel.tsx 생성**

```tsx
// src/components/RoutineWheel.tsx 신규 생성

/**
 * 역할: 24시간 원형 일과표 SVG 컴포넌트
 * 핵심 기능: 각 RoutineItem을 부채꼴로 렌더링, 중앙에 총 시간 표시
 * 의존: lib/types
 */
"use client";

import type { RoutineItem } from "@/lib/types";

interface Props {
  items: RoutineItem[];
  size?: number;
}

const TOTAL_HOURS = 24;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startHour: number, durationHours: number): string {
  const startAngle = (startHour / TOTAL_HOURS) * 360;
  const endAngle = ((startHour + durationHours) / TOTAL_HOURS) * 360;
  const largeArc = durationHours / TOTAL_HOURS > 0.5 ? 1 : 0;
  const s = polarToCartesian(cx, cy, r, startAngle);
  const e = polarToCartesian(cx, cy, r, endAngle);
  return `M${cx},${cy} L${s.x},${s.y} A${r},${r} 0 ${largeArc},1 ${e.x},${e.y} Z`;
}

export function RoutineWheel({ items, size = 280 }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 10;
  const totalHours = items.reduce((sum, i) => sum + i.durationHours, 0);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* 빈 배경 원 */}
      <circle cx={cx} cy={cy} r={r} fill="#f3f4f6" />

      {/* 각 항목 부채꼴 */}
      {items.map((item) => (
        <path
          key={item.id}
          d={arcPath(cx, cy, r, item.startHour, item.durationHours)}
          fill={item.color}
          stroke="#fff"
          strokeWidth={2}
        />
      ))}

      {/* 중앙 원 (도넛 효과) */}
      <circle cx={cx} cy={cy} r={r * 0.45} fill="#fff" />

      {/* 중앙 텍스트 */}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize={14} fontWeight="800" fill="#374151">
        {totalHours}h
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize={10} fill="#9ca3af">
        / 24시간
      </text>
    </svg>
  );
}
```

- [ ] **Step 2: routine/page.tsx 생성**

```tsx
// src/app/survival/routine/page.tsx 신규 생성

/**
 * 역할: 은퇴 후 일과 작성 + 원형 시각화
 * 핵심 기능: 시작 시각/길이/활동 입력, RoutineWheel SVG, localStorage 저장
 * 의존: lib/storage, lib/types, RoutineWheel
 */
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import type { RoutineItem } from "@/lib/types";
import { loadRoutine, saveRoutine } from "@/lib/storage";
import { RoutineWheel } from "@/components/RoutineWheel";

const PRESET_COLORS = [
  "#FEE500", "#22c55e", "#3b82f6", "#f97316",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f43f5e",
];

export default function RoutinePage() {
  const router = useRouter();
  const { status } = useSession();
  const [items, setItems] = useState<RoutineItem[]>([]);
  const [form, setForm] = useState({
    startHour: 6,
    durationHours: 1,
    activity: "",
    color: PRESET_COLORS[0],
  });

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  useEffect(() => {
    setItems(loadRoutine());
  }, []);

  const totalHours = items.reduce((sum, i) => sum + i.durationHours, 0);
  const remainingHours = 24 - totalHours;

  const handleAdd = () => {
    if (!form.activity.trim()) return;
    if (form.durationHours < 1 || form.durationHours > remainingHours) return;

    const newItem: RoutineItem = {
      id: Date.now().toString(),
      startHour: form.startHour,
      durationHours: form.durationHours,
      activity: form.activity.trim(),
      color: form.color,
    };
    const updated = [...items, newItem].sort((a, b) => a.startHour - b.startHour);
    setItems(updated);
    saveRoutine(updated);
    setForm((f) => ({ ...f, activity: "", startHour: Math.min(23, f.startHour + f.durationHours) }));
  };

  const handleDelete = (id: string) => {
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    saveRoutine(updated);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F5F7]">
      <header className="flex h-16 items-center gap-3 border-b border-gray-200 bg-white px-6 shadow-sm">
        <button onClick={() => router.back()} className="text-subtext hover:text-foreground transition-colors">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-extrabold">☀️ 은퇴 후 일과</h1>
      </header>

      <main className="flex flex-1 flex-col items-center p-5 gap-5">
        <div className="w-full max-w-md flex flex-col gap-5">
          {/* 원형 일과표 */}
          <div className="flex flex-col items-center gap-2 rounded-[24px] bg-white p-6 shadow-[0_2px_20px_rgb(0,0,0,0.06)]">
            <RoutineWheel items={items} size={240} />
            <p className="text-[12px] text-subtext font-medium">
              {totalHours}시간 작성됨 · {remainingHours}시간 남음
            </p>
          </div>

          {/* 입력 폼 */}
          <div className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgb(0,0,0,0.05)] flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-subtext">시작 시각</label>
                <select
                  value={form.startHour}
                  onChange={(e) => setForm((f) => ({ ...f, startHour: Number(e.target.value) }))}
                  className="rounded-xl border border-gray-200 px-3 py-2.5 text-[14px] font-bold text-foreground outline-none"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{String(i).padStart(2, "0")}:00</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-subtext">길이 (시간)</label>
                <input
                  type="number"
                  min={1}
                  max={remainingHours}
                  value={form.durationHours}
                  onChange={(e) => setForm((f) => ({ ...f, durationHours: Number(e.target.value) }))}
                  className="rounded-xl border border-gray-200 px-3 py-2.5 text-[14px] font-bold text-foreground outline-none"
                />
              </div>
            </div>

            <input
              type="text"
              value={form.activity}
              onChange={(e) => setForm((f) => ({ ...f, activity: e.target.value }))}
              placeholder="활동명 (예: 러닝, 독서, 낮잠)"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-[14px] text-foreground outline-none focus:border-[#FEE500] transition-colors"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />

            {/* 색상 선택 */}
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setForm((f) => ({ ...f, color: c }))}
                  className="h-7 w-7 rounded-full transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    outline: form.color === c ? `3px solid ${c}` : "none",
                    outlineOffset: "2px",
                  }}
                />
              ))}
            </div>

            <button
              onClick={handleAdd}
              disabled={!form.activity.trim() || remainingHours <= 0}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#FEE500] py-3 text-[14px] font-bold text-[#3C1E1E] disabled:opacity-40 hover:scale-[1.02] active:scale-95 transition-all"
            >
              <Plus size={16} />
              추가하기
            </button>
          </div>

          {/* 일과 목록 */}
          <div className="flex flex-col gap-2">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center justify-between rounded-2xl bg-white px-5 py-3.5 shadow-[0_1px_8px_rgb(0,0,0,0.04)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <div>
                      <p className="text-[14px] font-bold text-foreground">{item.activity}</p>
                      <p className="text-[11px] text-subtext">
                        {String(item.startHour).padStart(2, "0")}:00 · {item.durationHours}시간
                      </p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(item.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 3: 커밋**

```bash
git add src/components/RoutineWheel.tsx src/app/survival/routine/page.tsx
git commit -m "feat: 은퇴 후 일과 — 원형 SVG 시각화 + 시간 입력"
```

---

## 자기 검토 (Self-Review)

### 스펙 커버리지
| PRD 요구사항 | 구현 태스크 |
|-------------|-----------|
| 소셜 로그인 | 기존 유지 (Task 5 랜딩만 리디자인) |
| 6문 6답 T형 설문 | Task 6 |
| 분석 로딩 화면 | Task 7 |
| D-Day 카운트다운 | Task 9 |
| 파산 슬로프 그래프 | Task 8, 9 |
| 월요일 카운터 | Task 9 (팩트 카드) |
| 현실 치환 (N일 버팀) | Task 9 (팩트 카드) |
| S/A/B/C 등급 진단서 | Task 10 |
| 공유 기능 | Task 10 |
| 데스노트 | Task 12 |
| 사직서 미리 쓰기 | Task 13 |
| 은퇴 후 일과 + 원형 시각화 | Task 14 |

### 누락 없음 확인 완료

### 타입 일관성
- `UserProfile` 필드: `liquidAssets`, `monthlySavings`, `investReturnRate`, `retirementYears`, `monthlyExpense`, `retirementPlan` — Task 1~14 전체 일관
- `RetirementGrade`: `"S" | "A" | "B" | "C"` — Task 1, 2, 9, 10 일관
- `AssetDataPoint`: `label`, `assets`, `phase` — Task 1, 3, 8 일관
- `DeathNoteEntry`, `ResignationLetter`, `RoutineItem` — Task 1, 4, 12, 13, 14 일관
