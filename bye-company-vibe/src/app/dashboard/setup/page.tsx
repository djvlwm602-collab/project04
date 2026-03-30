/**
 * 역할: 최초 진입 시 재무 프로필 입력 온보딩 페이지 (설정 변경 시에도 재사용)
 * 핵심 기능: 모티베이션 인트로 → 필드 하나씩 단계별 입력 → 실시간 D-Day 미리보기
 * 의존: storage.ts, types.ts, constants.ts, calculator.ts, next-auth
 */
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Coins, TrendingUp, Wallet, PiggyBank, Target,
  CalendarDays, Sparkles, ArrowRight, ArrowLeft, Rocket,
} from "lucide-react";
import type { UserProfile } from "@/lib/types";
import { saveProfile, markSetupDone, loadProfile, isSetupDone } from "@/lib/storage";
import { calcMonthsFromProfile, formatProjectedDate } from "@/lib/calculator";

// --- 모티베이션 슬라이드 (Step 0) ---
const MOTIVATION_SLIDES = [
  {
    Icon: CalendarDays,
    title: "나의 자유까지 남은 시간",
    description: "입력한 재무 정보로\n은퇴 D-Day를 실시간 계산해 드려요",
    color: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  },
  {
    Icon: Sparkles,
    title: "퇴직금 시뮬레이션",
    description: "지출을 줄이면 은퇴가 얼마나 빨라지는지\n스와이프 한 번으로 확인하세요",
    color: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  },
  {
    Icon: Rocket,
    title: "스트레스 테스트",
    description: "소득 감소, 지출 증가 등\n다양한 시나리오를 미리 대비하세요",
    color: "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  },
];

// --- 입력 필드 설정 (한 필드 = 한 페이지) ---

interface QuickPreset {
  label: string;
  value: number;
}

interface FieldConfig {
  key: keyof UserProfile;
  label: string;
  subtitle: string;
  description: string;
  Icon: typeof Coins;
  unit: string;
  step: number;
  isPercent: boolean;
  presets: QuickPreset[];
}

const ALL_FIELDS: FieldConfig[] = [
  {
    key: "currentAssets",
    label: "현재 총 자산",
    subtitle: "부부 합산 순자산을 입력하세요",
    description: "예적금 + 투자금 + 부동산 등 순자산 합계",
    Icon: Coins,
    unit: "만원",
    step: 1000,
    isPercent: false,
    presets: [
      { label: "1억", value: 100000000 },
      { label: "3억", value: 300000000 },
      { label: "5억", value: 500000000 },
      { label: "10억", value: 1000000000 },
    ],
  },
  {
    key: "monthlyIncome",
    label: "월 합산 소득",
    subtitle: "부부 합산 세후 월급을 입력하세요",
    description: "세후 실수령액 기준",
    Icon: Wallet,
    unit: "만원",
    step: 50,
    isPercent: false,
    presets: [
      { label: "400만", value: 4000000 },
      { label: "600만", value: 6000000 },
      { label: "800만", value: 8000000 },
      { label: "1,000만", value: 10000000 },
    ],
  },
  {
    key: "monthlyExpense",
    label: "월 생활비",
    subtitle: "매달 나가는 생활비를 입력하세요",
    description: "고정비 + 변동비 합계 (저축 제외)",
    Icon: PiggyBank,
    unit: "만원",
    step: 50,
    isPercent: false,
    presets: [
      { label: "200만", value: 2000000 },
      { label: "350만", value: 3500000 },
      { label: "500만", value: 5000000 },
      { label: "700만", value: 7000000 },
    ],
  },
  {
    key: "targetExpense",
    label: "은퇴 후 월 생활비",
    subtitle: "은퇴 후 목표 생활비를 설정하세요",
    description: "은퇴 후 매달 필요한 예상 생활비",
    Icon: Target,
    unit: "만원",
    step: 50,
    isPercent: false,
    presets: [
      { label: "200만", value: 2000000 },
      { label: "350만", value: 3500000 },
      { label: "500만", value: 5000000 },
    ],
  },
  {
    key: "investReturnRate",
    label: "연 투자 수익률",
    subtitle: "장기 투자 예상 수익률을 설정하세요",
    description: "보수적으로 4~6%, 공격적이면 8~10%",
    Icon: TrendingUp,
    unit: "%",
    step: 0.5,
    isPercent: true,
    presets: [
      { label: "4%", value: 0.04 },
      { label: "6%", value: 0.06 },
      { label: "8%", value: 0.08 },
      { label: "10%", value: 0.10 },
    ],
  },
];

// Step 0 = 모티베이션, Step 1~5 = 각 필드
const FIRST_FIELD_STEP = 1;
const LAST_FIELD_STEP = ALL_FIELDS.length;
const TOTAL_STEPS = LAST_FIELD_STEP + 1; // 0: 모티베이션 + 5개 필드

// --- 유틸 ---

function toMan(won: number): number {
  return won / 10000;
}

function toWon(man: number): number {
  return man * 10000;
}

function formatInputValue(profile: UserProfile, key: keyof UserProfile, isPercent: boolean): string {
  const raw = profile[key];
  if (isPercent) {
    const percent = raw * 100;
    return String(percent % 1 === 0 ? percent : parseFloat(percent.toFixed(1)));
  }
  const man = toMan(raw);
  return String(man % 1 === 0 ? man : parseFloat(man.toFixed(1)));
}

export default function SetupPage() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  const isFirstSetup = !isSetupDone();

  // 설정 변경 모드에서는 모티베이션 스킵하고 첫 필드부터 시작
  const [step, setStep] = useState(isFirstSetup ? 0 : FIRST_FIELD_STEP);
  // 슬라이드 방향 추적 (뒤로 갈 때 애니메이션 반전)
  const [direction, setDirection] = useState(1);
  const [profile, setProfile] = useState<UserProfile>(() => loadProfile());

  const monthlySaving = profile.monthlyIncome - profile.monthlyExpense;
  const projectedMonths = calcMonthsFromProfile(profile);
  const projectedDate = formatProjectedDate(projectedMonths);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-kakao-yellow border-t-transparent" />
      </div>
    );
  }

  // 현재 필드 인덱스 (step 1 → index 0)
  const fieldIndex = step - FIRST_FIELD_STEP;
  const currentField = ALL_FIELDS[fieldIndex] ?? null;
  const isLastField = step === LAST_FIELD_STEP;

  // 입력값 변경 처리
  const handleChange = (key: keyof UserProfile, isPercent: boolean, value: string) => {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) return;
    const internalValue = isPercent ? parsed / 100 : toWon(parsed);
    setProfile((prev) => ({ ...prev, [key]: internalValue }));
  };

  // 퀵 프리셋 선택
  const handlePreset = (key: keyof UserProfile, value: number) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  // 제출
  const handleSubmit = () => {
    if (monthlySaving <= 0) return;
    saveProfile(profile);
    markSetupDone();
    router.push("/dashboard");
  };

  // 다음 단계
  const handleNext = () => {
    setDirection(1);
    if (step < LAST_FIELD_STEP) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  // 이전 단계
  const handleBack = () => {
    const minStep = isFirstSetup ? 0 : FIRST_FIELD_STEP;
    if (step > minStep) {
      setDirection(-1);
      setStep(step - 1);
    }
  };

  // 월 생활비 입력 단계(step 3)에서 저축액이 0 이하면 진행 불가
  const expenseFieldStep = FIRST_FIELD_STEP + ALL_FIELDS.findIndex(f => f.key === "monthlyExpense");
  const canProceed = step === expenseFieldStep ? monthlySaving > 0 : true;

  // 프로그레스 계산 (모티베이션은 0%, 마지막 필드는 100%)
  const minStep = isFirstSetup ? 0 : FIRST_FIELD_STEP;
  const maxStep = LAST_FIELD_STEP;
  const progress = ((step - minStep) / (maxStep - minStep)) * 100;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md">
        {/* 프로그레스 바 */}
        <div className="mb-8">
          <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-zinc-700 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-kakao-yellow"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
          {/* 현재 단계 표시 */}
          {step >= FIRST_FIELD_STEP && (
            <p className="mt-2 text-xs text-subtext text-right">
              {fieldIndex + 1} / {ALL_FIELDS.length}
            </p>
          )}
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          {/* ===== Step 0: 모티베이션 ===== */}
          {step === 0 && (
            <motion.div
              key="motivation"
              custom={direction}
              initial={{ opacity: 0, x: 60 * direction }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 * direction }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex flex-col items-center gap-6"
            >
              <div className="text-center">
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                  간단한 입력만으로
                </h1>
                <p className="mt-2 text-lg font-bold text-kakao-brown">
                  나만의 은퇴 시뮬레이터가 완성됩니다
                </p>
              </div>

              <div className="flex w-full flex-col gap-3">
                {MOTIVATION_SLIDES.map(({ Icon, title, description, color }, idx) => (
                  <motion.div
                    key={title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.15 + idx * 0.12 }}
                    className={`flex items-start gap-4 rounded-2xl p-5 ${color}`}
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/60 dark:bg-black/10">
                      <Icon size={22} />
                    </div>
                    <div>
                      <p className="text-[15px] font-extrabold">{title}</p>
                      <p className="mt-1 text-[13px] font-medium leading-relaxed whitespace-pre-line opacity-75">
                        {description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <p className="text-xs text-subtext">약 30초면 충분해요</p>

              <button
                onClick={handleNext}
                className="flex w-full items-center justify-center gap-2 rounded-[18px] bg-kakao-yellow py-4 text-[16px] font-bold text-kakao-brown transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
              >
                시작하기
                <ArrowRight size={18} />
              </button>
            </motion.div>
          )}

          {/* ===== Step 1~5: 필드 한 개씩 ===== */}
          {currentField && (
            <motion.div
              key={`field-${currentField.key}`}
              custom={direction}
              initial={{ opacity: 0, x: 60 * direction }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 * direction }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex flex-col gap-6"
            >
              {/* 헤더 */}
              <div className="text-center">
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                  {currentField.label}
                </h1>
                <p className="mt-2 text-sm text-subtext">
                  {currentField.subtitle}
                </p>
              </div>

              {/* 입력 카드 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 }}
                className="rounded-2xl bg-card p-6 shadow-[0_4px_16px_rgb(0,0,0,0.04)] dark:shadow-[0_4px_16px_rgb(0,0,0,0.15)]"
              >
                {/* 아이콘 + 설명 */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-kakao-yellow text-kakao-brown">
                    <currentField.Icon size={20} />
                  </div>
                  <p className="text-xs text-subtext">{currentField.description}</p>
                </div>

                {/* 숫자 입력 (큰 사이즈) */}
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    step={currentField.step}
                    min={0}
                    value={formatInputValue(profile, currentField.key, currentField.isPercent)}
                    onChange={(e) => handleChange(currentField.key, currentField.isPercent, e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-background px-4 py-3.5 text-right text-xl font-extrabold text-foreground outline-none focus:border-kakao-brown focus:ring-2 focus:ring-kakao-brown/30 dark:border-zinc-700 transition"
                  />
                  <span className="shrink-0 text-base font-bold text-subtext">
                    {currentField.unit}
                  </span>
                </div>

                {/* 퀵 프리셋 버튼 */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {currentField.presets.map(({ label, value }) => {
                    const isActive = profile[currentField.key] === value;
                    return (
                      <button
                        key={label}
                        onClick={() => handlePreset(currentField.key, value)}
                        className={`flex-1 min-w-[60px] rounded-xl px-3 py-2.5 text-sm font-bold transition-all ${
                          isActive
                            ? "bg-kakao-yellow text-kakao-brown shadow-sm scale-[1.02]"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </motion.div>

              {/* 월 생활비 입력 시 저축액 미리보기 */}
              {step === expenseFieldStep && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  className="rounded-2xl bg-card px-5 py-4 shadow-[0_4px_16px_rgb(0,0,0,0.04)] dark:shadow-[0_4px_16px_rgb(0,0,0,0.15)]"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-subtext">예상 월 저축액</p>
                    <p className={`text-lg font-extrabold ${monthlySaving > 0 ? "text-foreground" : "text-red-500"}`}>
                      {toMan(monthlySaving).toLocaleString()}만원
                    </p>
                  </div>
                  {monthlySaving <= 0 && (
                    <p className="mt-1.5 text-xs text-red-500">
                      월 저축액이 0 이하이면 다음 단계로 넘어갈 수 없어요.
                    </p>
                  )}
                </motion.div>
              )}

              {/* 마지막 필드: 실시간 D-Day 미리보기 */}
              {isLastField && monthlySaving > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.25, duration: 0.35 }}
                  className="rounded-2xl bg-kakao-yellow/15 border border-kakao-yellow/30 px-5 py-5 text-center"
                >
                  <p className="text-xs font-bold text-kakao-brown/70 mb-1">예상 은퇴 시점</p>
                  <p className="text-2xl font-extrabold text-kakao-brown">{projectedDate}</p>
                  <p className="text-sm font-bold text-kakao-brown/80 mt-1">
                    지금부터 약 <span className="text-kakao-brown">{projectedMonths}개월</span> 남았습니다
                  </p>
                </motion.div>
              )}

              {/* 하단 버튼 */}
              <div className="flex gap-3">
                <button
                  onClick={handleBack}
                  className="flex items-center justify-center gap-1 rounded-[18px] border border-gray-200 dark:border-zinc-700 px-5 py-4 text-[14px] font-bold text-subtext transition-all hover:bg-gray-50 dark:hover:bg-zinc-800 active:scale-95"
                >
                  <ArrowLeft size={16} />
                  이전
                </button>

                <button
                  onClick={handleNext}
                  disabled={!canProceed}
                  className="flex flex-1 items-center justify-center gap-2 rounded-[18px] bg-kakao-yellow py-4 text-[16px] font-bold text-kakao-brown transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 shadow-sm"
                >
                  {isLastField ? (
                    isFirstSetup ? "다음: 가입 완료" : "설정 저장하기"
                  ) : (
                    <>
                      다음
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
