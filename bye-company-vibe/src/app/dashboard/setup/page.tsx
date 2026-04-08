/**
 * 역할: 현실 자각 6문 6답 — 커스텀 키패드 + 퀵버튼 인터랙티브 설문
 * 핵심 기능: 1페이지 1질문, 커스텀 숫자 키패드, 퀵 증감 버튼, 완료 후 analyzing 이동
 * 의존: lib/types, lib/storage, lib/calculator, next-auth
 */
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Delete } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import type { UserProfile } from "@/lib/types";
import { saveProfile, loadProfile } from "@/lib/storage";
import { getReturnRateWarning, getSavingsComment } from "@/lib/calculator";

// ── 질문 설정 ────────────────────────────────────────────────

interface QuickBtn {
  label: string;
  value: number; // 원 또는 퍼센트 포인트 또는 년 단위 가산값
}

interface Question {
  key: keyof UserProfile;
  title: string;
  question: string;
  helperText: string;
  unit: "won" | "percent" | "year" | "text";
  quickBtns?: QuickBtn[];
  placeholder?: string;
}

const QUESTIONS: Question[] = [
  {
    key: "liquidAssets",
    title: "탈출 자금",
    question: "현재 즉시 동원 가능한 현금은?",
    helperText: "대출·부동산 제외, 내일 당장 인출 가능한 액수만.",
    unit: "won",
    quickBtns: [
      { label: "1,000만", value: 1000 },
      { label: "3,000만", value: 3000 },
      { label: "5,000만", value: 5000 },
      { label: "1억", value: 10000 },
      { label: "3억", value: 30000 },
    ],
  },
  {
    key: "monthlySavings",
    title: "연료 보급",
    question: "매달 '순수하게' 저축하는 금액은?",
    helperText: "시발비용·고정비 다 빼고, 오직 은퇴용으로 킵하는 돈.",
    unit: "won",
    quickBtns: [
      { label: "30만", value: 30 },
      { label: "50만", value: 50 },
      { label: "100만", value: 100 },
      { label: "200만", value: 200 },
      { label: "300만", value: 300 },
    ],
  },
  {
    key: "investReturnRate",
    title: "운용 능력",
    question: "당신의 연간 예상 수익률은?",
    helperText: "희망 회로 말고, 당신의 계좌가 증명하는 '진짜' 실력.",
    unit: "percent",
    quickBtns: [
      { label: "3%", value: 3 },
      { label: "5%", value: 5 },
      { label: "7%", value: 7 },
      { label: "10%", value: 10 },
    ],
  },
  {
    key: "retirementYears",
    title: "종료 시점",
    question: "몇 년 후에 이 지옥을 탈출할 겁니까?",
    helperText: "남들 다 하는 60세 정년 말고, 스스로 선언하는 카운트다운.",
    unit: "year",
    quickBtns: [
      { label: "5년", value: 5 },
      { label: "10년", value: 10 },
      { label: "15년", value: 15 },
      { label: "20년", value: 20 },
    ],
  },
  {
    key: "monthlyExpense",
    title: "유지 비용",
    question: "은퇴 후 최소 월 생활비는?",
    helperText: "숨만 쉬어도 나가는 돈. 물가 상승률 무시하지 마세요.",
    unit: "won",
    quickBtns: [
      { label: "150만", value: 150 },
      { label: "200만", value: 200 },
      { label: "300만", value: 300 },
      { label: "500만", value: 500 },
    ],
  },
  {
    key: "retirementPlan",
    title: "사후 대책",
    question: "퇴사 후 당신의 가치는 무엇입니까?",
    helperText: "노는 거 말고, 잉여 시간을 채울 진짜 계획 한 줄.",
    unit: "text",
    placeholder: "예) 카페 창업, 유튜브, 농사",
  },
];

// ── 유틸 ─────────────────────────────────────────────────────

function formatComma(n: number): string {
  return n.toLocaleString("ko-KR");
}

// 원 금액을 억/만원 레이블로 변환
function toMoneyLabel(won: number): string {
  if (won === 0) return "0원";
  const eok = Math.floor(won / 100000000);
  const man = Math.floor((won % 100000000) / 10000);
  const parts: string[] = [];
  if (eok > 0) parts.push(`${eok}억`);
  if (man > 0) parts.push(`${formatComma(man)}만원`);
  if (parts.length === 0) parts.push(`${formatComma(won)}원`);
  return parts.join(" ");
}

// rawInput(숫자 문자열) → profile 저장값
// won 필드: rawInput은 만원 단위 → 원으로 변환해 저장
function rawToProfile(raw: string, unit: Question["unit"]): number | string {
  if (unit === "text") return raw;
  const n = parseInt(raw) || 0;
  if (unit === "percent") return n / 100;
  if (unit === "won") return n * 10000; // 만원 → 원
  return n; // year
}

// profile 저장값 → rawInput 초기화
function profileToRaw(profile: UserProfile, q: Question): string {
  if (q.unit === "text") return String(profile[q.key] ?? "");
  if (q.unit === "percent") {
    const pct = ((profile[q.key] as number) ?? 0) * 100;
    return pct === 0 ? "0" : String(Math.round(pct));
  }
  if (q.unit === "won") {
    // 원 → 만원
    const n = ((profile[q.key] as number) ?? 0) / 10000;
    return String(Math.round(n));
  }
  return String((profile[q.key] as number) ?? 0);
}

// 큰 숫자 표시용 포맷 (만원·년·% 모두 rawInput 그대로 쉼표 포맷)
function formatDisplay(raw: string): string {
  const n = parseInt(raw) || 0;
  return formatComma(n);
}

// 단위 레이블 (숫자 제외, 큰 숫자 옆에 붙으므로 단위 기호만)
function unitLabel(unit: Question["unit"]): string {
  if (unit === "percent") return "%";
  if (unit === "year") return "년";
  if (unit === "won") return "만원";
  return "";
}

// ── 메인 컴포넌트 ────────────────────────────────────────────

export default function SetupPage() {
  const router = useRouter();
  const { status } = useSession();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [profile, setProfile] = useState<UserProfile>(() => loadProfile());
  const [rawInput, setRawInput] = useState("0");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  // 스텝 변경 시 rawInput 초기화
  useEffect(() => {
    const q = QUESTIONS[step];
    setRawInput(profileToRaw(profile, q));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const q = QUESTIONS[step];
  const isLast = step === QUESTIONS.length - 1;
  const progress = ((step + 1) / QUESTIONS.length) * 100;

  // profile 업데이트 공통
  const commitRaw = (raw: string) => {
    const val = rawToProfile(raw, q.unit);
    setProfile((prev) => ({ ...prev, [q.key]: val }));
  };

  // 키패드 숫자 입력
  const handleDigit = (d: string) => {
    setRawInput((prev) => {
      const next = prev === "0" ? d : prev + d;
      if (next.length > 12) return prev;
      commitRaw(next);
      return next;
    });
  };

  // 백스페이스
  const handleBackspace = () => {
    setRawInput((prev) => {
      const next = prev.length <= 1 ? "0" : prev.slice(0, -1);
      commitRaw(next);
      return next;
    });
  };

  // 전체 삭제
  const handleClear = () => {
    setRawInput("0");
    commitRaw("0");
  };

  // 퀵버튼 — 해당 값으로 설정
  const handleQuick = (value: number) => {
    const next = String(value);
    setRawInput(next);
    commitRaw(next);
  };

  // 텍스트 입력 변경
  const handleTextChange = (val: string) => {
    setRawInput(val);
    setProfile((prev) => ({ ...prev, [q.key]: val }));
  };

  const liveMessage = (() => {
    if (q.key === "investReturnRate") return getReturnRateWarning(profile.investReturnRate ?? 0);
    if (q.key === "monthlySavings") return getSavingsComment(profile.monthlySavings ?? 0);
    return null;
  })();

  const canProceed = q.unit === "text"
    ? rawInput.trim().length > 0
    : (parseInt(rawInput) || 0) > 0;

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

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#FEE500] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">

      {/* 프로그레스 바 */}
      <div className="w-full px-6 pt-6 pb-2">
        <div className="mx-auto w-full max-w-md">
          <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-[#FEE500]"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      </div>

      {/* 질문 헤더 + 숫자 표시 */}
      <div className="flex-1 flex flex-col px-6 max-w-md mx-auto w-full">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: 40 * direction }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 * direction }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex flex-col flex-1"
          >
            {/* 질문 텍스트 */}
            <div className="pt-6 pb-2 flex flex-col gap-1">
              <p className="text-[13px] font-bold text-subtext uppercase tracking-widest">{q.title}</p>
              <h1 className="text-[24px] font-bold tracking-tight text-foreground leading-tight">{q.question}</h1>
              <p className="text-[14px] text-subtext leading-relaxed">{q.helperText}</p>
            </div>

            {/* 숫자 표시 영역 — flex-1로 질문과 키패드 사이 중앙 배치 */}
            {q.unit !== "text" && (
              <div className="flex-1 flex flex-col items-center justify-center gap-1">
                <div className="flex items-baseline gap-2">
                  <p className="text-[56px] font-semibold text-foreground tracking-tight leading-none">
                    {formatDisplay(rawInput)}
                  </p>
                  <p className="text-[22px] font-medium text-foreground">
                    {unitLabel(q.unit)}
                  </p>
                </div>
                <AnimatePresence>
                  {liveMessage && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="text-[13px] font-bold text-amber-600 mt-1"
                    >
                      {liveMessage}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* 텍스트 질문 입력 */}
            {q.unit === "text" && (
              <div className="flex-1 flex flex-col gap-3 pt-4">
                <input
                  type="text"
                  value={rawInput === "0" ? "" : rawInput}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder={q.placeholder}
                  className="w-full rounded-2xl border-2 border-gray-200 bg-white px-5 py-4 text-[18px] font-bold text-foreground outline-none focus:border-[#FEE500] transition-colors"
                  autoFocus
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 하단 키패드 영역 */}
      {q.unit !== "text" && (
        <div className="w-full max-w-md mx-auto px-4 pb-4 flex flex-col gap-2">

          {/* 퀵버튼 */}
          {q.quickBtns && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {q.quickBtns.map((btn) => (
                <button
                  key={btn.label}
                  onClick={() => handleQuick(btn.value)}
                  className="shrink-0 rounded-xl border border-[#FEE500] bg-[#FEE500]/10 px-3.5 py-1.5 text-[13px] font-bold text-[#3C1E1E] active:scale-95 transition-all"
                >
                  {btn.label}
                </button>
              ))}
            </div>
          )}

          {/* 커스텀 키패드 */}
          <div className="grid grid-cols-3 gap-1.5">
            {["1","2","3","4","5","6","7","8","9"].map((d) => (
              <button
                key={d}
                onClick={() => handleDigit(d)}
                className="flex items-center justify-center rounded-xl bg-gray-100 py-3 text-[20px] font-semibold text-foreground active:bg-gray-200 active:scale-95 transition-all"
              >
                {d}
              </button>
            ))}
            {/* C */}
            <button
              onClick={handleClear}
              className="flex items-center justify-center rounded-xl bg-red-100 py-3 text-[20px] font-semibold text-red-500 active:bg-red-200 active:scale-95 transition-all"
            >
              C
            </button>
            {/* 0 */}
            <button
              onClick={() => handleDigit("0")}
              className="flex items-center justify-center rounded-xl bg-gray-100 py-3 text-[20px] font-semibold text-foreground active:bg-gray-200 active:scale-95 transition-all"
            >
              0
            </button>
            {/* 백스페이스 */}
            <button
              onClick={handleBackspace}
              className="flex items-center justify-center rounded-xl bg-gray-100 py-3 active:bg-gray-200 active:scale-95 transition-all"
            >
              <Delete size={20} className="text-foreground" />
            </button>
          </div>

          {/* 이전 / 다음 버튼 */}
          <div className="flex gap-3 mt-1">
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
        </div>
      )}

      {/* 텍스트 질문 하단 버튼 */}
      {q.unit === "text" && (
        <div className="w-full max-w-md mx-auto px-4 pb-8 flex gap-3">
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
      )}
    </div>
  );
}
