/**
 * 역할: 팩트 폭격 대시보드 — D-Day, 파산 슬로프, 등급 진단, 서바이벌 킷
 * 핵심 기능: 실시간 카운트다운, 슬로프 차트, 등급 카드, 서바이벌 킷 진입
 * 의존: lib/calculator, lib/storage, lib/constants, BankruptcySlope, GradeCard
 */
"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Settings, LogOut, Share2, Skull, Smile, Frown, BookOpen, FileText, Sun } from "lucide-react";
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

// ── 버티기 킷 목록 ───────────────────────────────────────────

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
    order: string;
    label: string;
    unit: string;
    isPercent?: boolean;
    isText?: boolean;
    isManwon?: boolean;
  }> = [
    { key: "liquidAssets", order: "Q1", label: "탈출 자금", unit: "만원", isManwon: true },
    { key: "monthlySavings", order: "Q2", label: "월 저축", unit: "만원", isManwon: true },
    { key: "investReturnRate", order: "Q3", label: "수익률", unit: "%", isPercent: true },
    { key: "retirementYears", order: "Q4", label: "은퇴까지", unit: "년" },
    { key: "monthlyExpense", order: "Q5", label: "은퇴 후 생활비", unit: "만원", isManwon: true },
    { key: "retirementPlan", order: "Q6", label: "사후 대책", unit: "", isText: true },
  ];

  // 천 단위 쉼표 포맷
  const formatComma = (n: number) => n.toLocaleString("ko-KR");

  const displayVal = (key: keyof UserProfile, isPercent?: boolean, isText?: boolean, isManwon?: boolean): string => {
    const v = draft[key];
    if (isText) return v as string;
    if (isPercent) {
      const pct = (v as number) * 100;
      return String(pct % 1 === 0 ? pct : parseFloat(pct.toFixed(1)));
    }
    const num = v as number;
    if (num === 0) return "";
    // 만원 단위: 내부값(원) ÷ 10,000 후 쉼표 포맷
    if (isManwon) return formatComma(num / 10000);
    return formatComma(num);
  };

  const handleChange = (key: keyof UserProfile, val: string, isPercent?: boolean, isText?: boolean, isManwon?: boolean) => {
    if (isText) { setDraft((p) => ({ ...p, [key]: val })); return; }
    // 쉼표 제거 후 파싱
    const stripped = val.replace(/,/g, "");
    const parsed = parseFloat(stripped);
    if (isNaN(parsed)) return;
    // 만원 단위: 입력값 × 10,000으로 원 단위 저장
    const internal = isPercent ? parsed / 100 : isManwon ? parsed * 10000 : parsed;
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
            {fields.map(({ key, order, label, unit, isPercent, isText, isManwon }) => (
              <div key={key} className="flex items-center gap-3">
                <label className="w-28 shrink-0">
                  <span className="text-[17px] font-bold text-foreground">{label}</span>
                </label>
                <div className="flex flex-1 items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 focus-within:border-[#FEE500] transition-all">
                  <input
                    type="text"
                    inputMode={isText ? "text" : "numeric"}
                    value={displayVal(key, isPercent, isText, isManwon)}
                    onChange={(e) => handleChange(key, e.target.value, isPercent, isText, isManwon)}
                    className="flex-1 bg-transparent text-[20px] font-bold text-foreground outline-none text-right"
                  />
                  {unit && <span className="text-[16px] font-bold text-subtext shrink-0">{unit}</span>}
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

// ── 마키 ticker 컴포넌트 ────────────────────────────────────────────

const SLAVE_INDEX: Record<string, string> = {
  S: "해방 임박",
  A: "낮음",
  B: "보통",
  C: "높음",
  D: "매우 높음",
};

function MarqueeTicker({
  mondays, survivalDays, retirementAssets, grade,
}: {
  mondays: number;
  survivalDays: number;
  retirementAssets: number;
  grade: string;
}) {
  const items = [
    { emoji: "📅", label: "남은 월요일", value: `${mondays.toLocaleString()}회` },
    { emoji: "💀", label: "현재 자산 생존 가능 기간", value: `${survivalDays.toLocaleString()}일` },
    { emoji: "💰", label: "은퇴 시점 예상 자산", value: `${retirementAssets}억원` },
    { emoji: "⛓️", label: "현재 노예 지수", value: SLAVE_INDEX[grade] ?? "높음" },
  ];

  // 끊김 없는 루프를 위해 3벌 복사
  const repeated = [...items, ...items, ...items];

  return (
    <>
      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        .ticker-track { animation: ticker 22s linear infinite; }
      `}</style>
      <div className="w-full overflow-hidden rounded-xl bg-white shadow-[0_2px_16px_rgb(0,0,0,0.08)] py-5">
          <div className="ticker-track flex w-max">
            {repeated.map((item, i) => (
              <span key={i} className="flex items-center whitespace-nowrap px-4 text-[13px]">
                <span className="mr-1.5">{item.emoji}</span>
                <span className="font-bold text-black">{item.label}</span>
                <span className="mx-1.5 text-gray-300">·</span>
                <span className="font-bold text-[#d97706]">{item.value}</span>
                <span className="ml-6" />
              </span>
            ))}
          </div>
        </div>
    </>
  );
}

// ── 대시보드 메인 콘텐츠 ───────────────────────────────────────────

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showGradeCard, setShowGradeCard] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [activeTab, setActiveTab] = useState<"plan" | "survive">("plan");
  const [showLogoutSheet, setShowLogoutSheet] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!isSetupDone()) { router.replace("/dashboard/setup"); return; }
    setProfile(loadProfile());
  }, [status, router]);

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
      <header className="flex h-16 items-center justify-between px-6">
        <h1 className="flex items-center gap-1.5 text-lg font-extrabold tracking-tight">
          {activeTab === "plan" ? <Smile size={18} /> : <Frown size={18} />}
          {activeTab === "plan" ? "은퇴계산기" : "버티기"}
        </h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setShowSettings(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-subtext hover:bg-gray-200 transition-colors"
          >
            <Settings size={20} />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowLogoutSheet((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-subtext hover:bg-gray-200 transition-colors"
            >
              <LogOut size={20} />
            </button>
            <AnimatePresence>
              {showLogoutSheet && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -6 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 top-11 z-50 w-40 rounded-2xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 overflow-hidden"
                >
                  <button
                    onClick={() => { setShowLogoutSheet(false); signOut({ callbackUrl: "/" }); }}
                    className="w-full px-4 py-3.5 text-left text-[14px] font-bold text-foreground hover:bg-gray-50 transition-colors"
                  >
                    로그아웃
                  </button>
                  <div className="h-px bg-gray-100" />
                  <button
                    onClick={() => { setShowLogoutSheet(false); clearUserData(); signOut({ callbackUrl: "/" }); }}
                    className="w-full px-4 py-3.5 text-left text-[14px] font-bold text-red-500 hover:bg-red-50 transition-colors"
                  >
                    회원탈퇴
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center p-5 sm:p-8 gap-4 pb-28">
        {/* ── 은퇴 계획 탭 ──────────────────────────────────── */}
        {activeTab === "plan" && <div className="w-full max-w-md space-y-4">

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
                  <span className="inline-block min-w-[2.2ch] rounded-lg bg-gray-100 px-2 py-1.5 text-center text-[16px] font-bold tabular-nums text-gray-500">
                    {String(v).padStart(2, "0")}
                  </span>
                  <span className="text-[11px] font-bold text-gray-500">{l}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col items-center gap-1 text-center mt-4">
              <p className="text-[17px] font-bold text-gray-700">자유까지</p>
              <h2 className="text-[48px] font-bold leading-none tracking-tight text-gray-900">
                D-{dDay.toLocaleString()}
              </h2>
            </div>

            {/* 결과 공유 버튼 */}
            <button
              onClick={() => setShowGradeCard(true)}
              className="flex w-full items-center justify-center rounded-2xl bg-[#FEE500] py-4 text-[15px] font-bold text-[#3C1E1E] hover:scale-[1.01] active:scale-95 transition-all mt-4"
            >
              결과 공유하기
            </button>
          </div>

          {/* ── 마키 ticker ─────────────────────────────────── */}
          <MarqueeTicker
            mondays={mondays}
            survivalDays={survivalDays}
            retirementAssets={retirementAssets}
            grade={grade}
          />

          {/* ── 파산 슬로프 ─────────────────────────────────── */}
          <div className="rounded-[24px] bg-white px-5 py-5 shadow-[0_2px_20px_rgb(0,0,0,0.06)]">
            <div className="mb-3">
              <h3 className="text-[15px] font-extrabold text-gray-800">파산 슬로프</h3>
            </div>
            <BankruptcySlope data={slopeData} retirementLabel="은퇴" />
          </div>

        </div>}

        {/* ── 버티기 탭 ─────────────────────────────────────── */}
        {activeTab === "survive" && (
          <div className="w-full max-w-md flex flex-col gap-3 mt-2">
            {KITS.map((kit) => (
              <button
                key={kit.href}
                onClick={() => router.push(kit.href)}
                className="flex w-full items-center gap-4 rounded-2xl bg-white px-5 py-5 shadow-[0_2px_12px_rgb(0,0,0,0.05)] hover:bg-gray-50 active:scale-[0.98] transition-colors text-left"
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${kit.iconBg}`}>
                  <kit.icon size={22} className={kit.iconColor} />
                </div>
                <div>
                  <p className="text-[16px] font-extrabold text-foreground">{kit.title}</p>
                  <p className="text-[12px] text-subtext mt-0.5">{kit.desc}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* ── 하단 탭 바 — iOS 26 글래스모피즘 ──────────────── */}
      <div className="fixed bottom-6 left-0 right-0 z-30 flex justify-center pointer-events-none">
        <div className="flex gap-1 rounded-full bg-white/65 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.12)] px-0.5 py-0.5 pointer-events-auto">
          <button
            onClick={() => setActiveTab("plan")}
            className={`flex w-[120px] items-center justify-center gap-2 rounded-full py-3.5 text-[14px] font-semibold transition-colors duration-200 ${
              activeTab === "plan"
                ? "bg-gray-100 text-foreground"
                : "text-subtext hover:text-foreground"
            }`}
          >
            <Smile size={17} />
            은퇴계산기
          </button>
          <button
            onClick={() => setActiveTab("survive")}
            className={`flex w-[120px] items-center justify-center gap-2 rounded-full py-3.5 text-[14px] font-semibold transition-colors duration-200 ${
              activeTab === "survive"
                ? "bg-gray-100 text-foreground"
                : "text-subtext hover:text-foreground"
            }`}
          >
            <Frown size={17} />
            버티기
          </button>
        </div>
      </div>

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

      {/* 드롭다운 외부 클릭 닫기 */}
      {showLogoutSheet && (
        <div className="fixed inset-0 z-40" onClick={() => setShowLogoutSheet(false)} />
      )}

      {/* 축하 애니메이션 */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            key="celebration"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="pointer-events-none fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4"
          >
            <div className="absolute inset-0 bg-black/20" />
            <div className="relative flex flex-col items-center gap-3 rounded-[32px] bg-white px-12 py-10 shadow-2xl">
              <span className="text-6xl">🎉</span>
              <p className="text-[24px] font-black text-foreground">대단해요!</p>
              <p className="text-[15px] font-bold text-subtext">참기 기록이 저장됐습니다</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Export용 페이지 컴포넌트 ───────────────────────────────────────────

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background"><div className="h-10 w-10 animate-spin rounded-full border-4 border-[#FEE500] border-t-transparent" /></div>}>
      <DashboardContent />
    </Suspense>
  );
}
