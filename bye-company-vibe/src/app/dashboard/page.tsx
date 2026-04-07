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
  const [showCelebration, setShowCelebration] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

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
