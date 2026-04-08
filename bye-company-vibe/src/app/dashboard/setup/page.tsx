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
import { ThemeToggle } from "@/components/ThemeToggle";

// ── 질문 설정 ────────────────────────────────────────────────

interface Question {
  key: keyof UserProfile;
  order: string;
  title: string;
  question: string;
  helperText: string;
  unit: string;
  inputType: "number" | "text";
  isPercent?: boolean;
  placeholder?: string;
}

const QUESTIONS: Question[] = [
  {
    key: "liquidAssets",
    order: "Q1",
    title: "탈출 자금",
    question: "현재 즉시 동원 가능한 현금은?",
    helperText: "대출·부동산 제외, 내일 당장 인출 가능한 액수만.",
    unit: "만원",
    inputType: "number",
    placeholder: "5000",
  },
  {
    key: "monthlySavings",
    order: "Q2",
    title: "연료 보급",
    question: "매달 '순수하게' 저축하는 금액은?",
    helperText: "시발비용·고정비 다 빼고, 오직 은퇴용으로 킵하는 돈.",
    unit: "만원",
    inputType: "number",
    placeholder: "100",
  },
  {
    key: "investReturnRate",
    order: "Q3",
    title: "운용 능력",
    question: "당신의 연간 예상 수익률은?",
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
    question: "몇 살에 이 지옥을 탈출할 겁니까?",
    helperText: "남들 다 하는 60세 정년 말고, 스스로 선언하는 카운트다운.",
    unit: "년",
    inputType: "number",
    placeholder: "10",
  },
  {
    key: "monthlyExpense",
    order: "Q5",
    title: "유지 비용",
    question: "은퇴 후 최소 월 생활비는?",
    helperText: "숨만 쉬어도 나가는 돈. 물가 상승률 무시하지 마세요.",
    unit: "만원",
    inputType: "number",
    placeholder: "200",
  },
  {
    key: "retirementPlan",
    order: "Q6",
    title: "사후 대책",
    question: "퇴사 후 당신의 가치는 무엇입니까?",
    helperText: "노는 거 말고, 잉여 시간을 채울 진짜 계획 한 줄.",
    unit: "",
    inputType: "text",
    placeholder: "예) 카페 창업, 유튜브, 농사",
  },
];

// ── 유틸 ─────────────────────────────────────────────────────

// 숫자에 천 단위 쉼표 포맷 (퍼센트·텍스트 제외)
function formatComma(val: number): string {
  return val.toLocaleString("ko-KR");
}

function getDisplayValue(profile: UserProfile, q: Question): string {
  const raw = profile[q.key];
  if (q.inputType === "text") return String(raw);
  if (q.isPercent) {
    const pct = (raw as number) * 100;
    return pct === 0 ? "" : String(pct % 1 === 0 ? pct : parseFloat(pct.toFixed(1)));
  }
  const num = raw as number;
  if (num === 0) return "";
  // 만원 단위: 내부 저장값(원) ÷ 10,000 후 표시
  return q.unit === "만원" ? formatComma(num / 10000) : formatComma(num);
}

function parseInput(q: Question, raw: string): number | string {
  if (q.inputType === "text") return raw;
  // 쉼표 제거 후 파싱
  const stripped = raw.replace(/,/g, "");
  const parsed = parseFloat(stripped);
  if (isNaN(parsed)) return 0;
  if (q.isPercent) return parsed / 100;
  // 만원 단위: 입력값 × 10,000으로 원 단위 내부 저장
  if (q.unit === "만원") return parsed * 10000;
  return parsed;
}

// ── 메인 컴포넌트 ────────────────────────────────────────────

export default function SetupPage() {
  const router = useRouter();
  const { status } = useSession();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [profile, setProfile] = useState<UserProfile>(() => loadProfile());
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  useEffect(() => {
    const q = QUESTIONS[step];
    setInputValue(getDisplayValue(profile, q));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const q = QUESTIONS[step];
  const isLast = step === QUESTIONS.length - 1;

  const liveMessage = (() => {
    // profile에 저장된 실수값 기준으로 메시지 계산 (inputValue에 쉼표가 있어 직접 파싱 불가)
    if (q.key === "investReturnRate") {
      return getReturnRateWarning(profile.investReturnRate ?? 0);
    }
    if (q.key === "monthlySavings") {
      return getSavingsComment(profile.monthlySavings ?? 0);
    }
    return null;
  })();

  const handleChange = (val: string) => {
    const parsed = parseInput(q, val);
    setProfile((prev) => ({ ...prev, [q.key]: parsed }));
    // 숫자 입력은 쉼표 포맷으로 표시, 퍼센트·텍스트는 그대로
    if (q.inputType === "number" && !q.isPercent) {
      const num = typeof parsed === "number" ? parsed : 0;
      if (num === 0) {
        setInputValue("");
      } else if (q.unit === "만원") {
        // 내부값(원)을 다시 만원으로 나눠서 표시
        setInputValue(formatComma(num / 10000));
      } else {
        setInputValue(formatComma(num));
      }
    } else {
      setInputValue(val);
    }
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
              <p className="text-[14px] font-bold tracking-widest text-subtext uppercase">
                {q.order}&nbsp;&nbsp;{q.title}
              </p>
              <h1 className="text-[28px] font-black tracking-tight text-foreground leading-tight">{q.question}</h1>
              <p className="text-[16px] font-medium text-subtext leading-relaxed">{q.helperText}</p>
            </div>

            {/* 입력 영역 */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 rounded-2xl border-2 border-gray-200 bg-background px-5 py-4 focus-within:border-[#FEE500] transition-colors">
                {q.inputType === "number" ? (
                  <input
                    type="text"
                    inputMode="numeric"
                    value={inputValue}
                    onChange={(e) => handleChange(e.target.value)}
                    placeholder={q.placeholder}
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
                    className="text-[13px] font-bold text-amber-600"
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
