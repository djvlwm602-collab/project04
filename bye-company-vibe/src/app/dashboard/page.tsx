/**
 * 역할: FIRE 대시보드 메인 화면 — D-Day 카드 중심 + 부가 기능 버튼
 * 핵심 기능: 프로필 로드, 은퇴 개월 수 계산, 슬라이더 피드백, 참기 기록, 공유 카드 생성
 * 의존: lib/types, lib/constants, lib/calculator, lib/storage, next-auth, html-to-image
 */

"use client";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Wallet, Rocket, AlertTriangle, Settings, Zap, X, LogOut,
  Share2, Download, ChevronRight,
} from "lucide-react";
import type { UserProfile, ResistRecord } from "@/lib/types";
import { SLIDER_MIN, SLIDER_MAX, SLIDER_STEP, RESIST_CATEGORIES } from "@/lib/constants";
import { calcMonthsFromProfile, getSliderFeedback, formatProjectedDate, calcMonthlySaving, calcTargetAmount } from "@/lib/calculator";
import { saveResistRecord, getResistStats, loadProfile, isSetupDone, clearUserData } from "@/lib/storage";

// ──────────────────────────────────────────────
// 실시간 카운트다운 훅 — 초 단위로 남은 시간 계산
// ──────────────────────────────────────────────
function useCountdown(months: number) {
  const targetDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    return d.getTime();
  }, [months]);

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const diff = Math.max(0, targetDate - now);
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, totalSeconds };
}

// ──────────────────────────────────────────────
// 공유 카드용 그라데이션 배경 — D-Day 구간별 색상
// ──────────────────────────────────────────────
function getShareCardGradient(months: number): string {
  if (months <= 36) return "from-orange-400 via-pink-500 to-rose-500";
  if (months <= 72) return "from-amber-400 via-orange-500 to-red-400";
  if (months <= 120) return "from-cyan-400 via-blue-500 to-indigo-500";
  return "from-slate-500 via-gray-600 to-zinc-700";
}

function getShareCardEmoji(months: number): string {
  if (months <= 36) return "🏖️";
  if (months <= 72) return "✈️";
  if (months <= 120) return "🚀";
  return "💪";
}

// ──────────────────────────────────────────────
// 참기 입력 폼 컴포넌트
// ──────────────────────────────────────────────
function ResistForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (amount: number, category: string) => void;
  onCancel: () => void;
}) {
  const [amount, setAmount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const handleSubmit = () => {
    if (amount <= 0 || !selectedCategory) return;
    onSubmit(amount, selectedCategory);
  };

  return (
    <div className="flex flex-col gap-5 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] font-extrabold text-foreground">결제 충동 참기! 🎯</h2>
        <button
          onClick={onCancel}
          className="flex h-8 w-8 items-center justify-center rounded-full text-subtext transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800"
          aria-label="닫기"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[13px] font-bold text-subtext">참은 금액 (원)</label>
        <input
          type="number"
          min={0}
          step={1000}
          value={amount === 0 ? "" : amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          placeholder="예) 15000"
          className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-[16px] font-bold text-foreground outline-none transition-colors focus:border-kakao-yellow focus:ring-2 focus:ring-kakao-yellow/20 dark:border-zinc-700 dark:bg-zinc-800"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[13px] font-bold text-subtext">카테고리</label>
        <div className="flex flex-wrap gap-2">
          {RESIST_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-4 py-1.5 text-[13px] font-bold transition-colors ${
                selectedCategory === cat
                  ? "bg-kakao-yellow text-kakao-brown shadow-sm"
                  : "bg-gray-100 text-subtext hover:bg-gray-200 dark:bg-zinc-800 dark:text-subtext dark:hover:bg-zinc-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 rounded-2xl border border-gray-200 py-3.5 text-[15px] font-bold text-subtext transition-colors hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          취소
        </button>
        <button
          onClick={handleSubmit}
          disabled={amount <= 0 || !selectedCategory}
          className="flex-1 rounded-2xl bg-kakao-dark py-3.5 text-[15px] font-bold text-white transition-colors disabled:opacity-40"
        >
          가상 적립!
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// 공유 카드 모달 — 인스타 스토리 공유용 카드
// ──────────────────────────────────────────────
function ShareCardModal({
  months,
  date,
  monthlySavingMan,
  nickname,
  onClose,
}: {
  months: number;
  date: string;
  monthlySavingMan: number;
  nickname: string;
  onClose: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);

  const dDay = months * 30;
  const gradient = getShareCardGradient(months);
  const emoji = getShareCardEmoji(months);

  // 이미지 저장 — html-to-image 동적 import로 SSR 안전하게 처리
  const handleSave = useCallback(async () => {
    if (!cardRef.current || saving) return;
    setSaving(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 3,
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = `bye-company-d${dDay}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("이미지 저장 실패:", err);
    } finally {
      setSaving(false);
    }
  }, [saving, dDay]);

  // Web Share API 지원 시 공유, 아니면 이미지 저장 fallback
  const handleShare = useCallback(async () => {
    if (!cardRef.current || saving) return;
    setSaving(true);
    try {
      const { toBlob } = await import("html-to-image");
      const blob = await toBlob(cardRef.current, {
        pixelRatio: 3,
        cacheBust: true,
      });
      if (!blob) throw new Error("이미지 생성 실패");

      if (navigator.share) {
        const file = new File([blob], `bye-company-d${dDay}.png`, { type: "image/png" });
        await navigator.share({
          title: `탈출까지 D-${dDay}`,
          files: [file],
        });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `bye-company-d${dDay}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("공유 실패:", err);
      }
    } finally {
      setSaving(false);
    }
  }, [saving, dDay]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-6"
      >
        <div className="flex w-full max-w-sm flex-col items-center gap-5">
          <div
            ref={cardRef}
            className={`relative w-full overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-8 shadow-2xl`}
            style={{ aspectRatio: "4 / 5" }}
          >
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10" />
            <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/10" />
            <div className="absolute top-1/2 right-1/4 h-20 w-20 rounded-full bg-white/5" />

            <div className="relative z-10 flex h-full flex-col items-center justify-between text-white">
              <div className="flex items-center gap-2 self-start">
                <Rocket size={16} className="opacity-80" />
                <span className="text-[13px] font-bold opacity-80">아임 파이어족</span>
              </div>

              <div className="flex flex-col items-center gap-3 text-center">
                <span className="text-5xl">{emoji}</span>
                <p className="text-[15px] font-bold opacity-80">회사 탈출까지</p>
                <h2 className="text-6xl font-black tracking-tight drop-shadow-lg">
                  D-{dDay}
                </h2>
                <div className="mt-2 rounded-full bg-white/20 px-5 py-2 backdrop-blur-sm">
                  <p className="text-[15px] font-bold">
                    {date} 자유 예정
                  </p>
                </div>
              </div>

              <div className="flex w-full items-end justify-between">
                <div>
                  <p className="text-[12px] font-medium opacity-60">월 저축</p>
                  <p className="text-[16px] font-extrabold">{monthlySavingMan}만원</p>
                </div>
                <div className="text-right">
                  <p className="text-[12px] font-medium opacity-60">{nickname}</p>
                  <p className="text-[11px] font-medium opacity-40">bye-company.vibe</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex w-full gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-[15px] font-bold text-gray-800 shadow-lg transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              <Download size={18} />
              저장
            </button>
            <button
              onClick={handleShare}
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-[15px] font-bold text-gray-800 shadow-lg transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              <Share2 size={18} />
              공유
            </button>
          </div>

          <button
            onClick={onClose}
            className="text-[14px] font-bold text-white/70 transition-colors hover:text-white"
          >
            닫기
          </button>
        </div>
      </motion.div>
    </>
  );
}

// ──────────────────────────────────────────────
// 지출 슬라이더 바텀시트
// ──────────────────────────────────────────────
function SliderSheet({
  profile,
  onClose,
}: {
  profile: UserProfile;
  onClose: () => void;
}) {
  const [sliderValue, setSliderValue] = useState(0);

  const baseMonths = useMemo(() => calcMonthsFromProfile(profile, 0), [profile]);
  const adjustedMonths = useMemo(() => calcMonthsFromProfile(profile, sliderValue), [profile, sliderValue]);
  const monthDiff = baseMonths - adjustedMonths;

  const feedbackText = useMemo(() => getSliderFeedback(sliderValue, monthDiff), [sliderValue, monthDiff]);

  return (
    <div className="flex flex-col gap-5 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] font-extrabold text-foreground">지출 스와이프 액션</h2>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full text-subtext transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800"
          aria-label="닫기"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <div className="mb-2 flex justify-between text-[13px] font-bold text-subtext">
          <span className="text-red-500">지출 펑펑 (-50만)</span>
          <span className="text-blue-500">영끌 저축 (+50만)</span>
        </div>

        <input
          type="range"
          min={SLIDER_MIN}
          max={SLIDER_MAX}
          step={SLIDER_STEP}
          value={sliderValue}
          onChange={(e) => setSliderValue(Number(e.target.value))}
          className="h-2.5 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-kakao-dark dark:bg-zinc-700"
        />
        <div className="mt-4 text-center text-[17px] font-extrabold">
          조정 금액: {sliderValue > 0 ? "+" : ""}{(sliderValue / 10000).toLocaleString()}만 원 / 월
        </div>
      </div>

      <div
        className={`rounded-2xl p-5 text-[14.5px] font-bold leading-relaxed transition-colors ${
          sliderValue > 0
            ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
            : sliderValue < 0
            ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300"
            : "bg-gray-100 text-subtext dark:bg-zinc-800"
        }`}
      >
        {feedbackText}
      </div>

      {monthDiff !== 0 && (
        <div className="text-center text-[15px] font-bold text-subtext">
          {monthDiff > 0 ? (
            <span className="text-blue-500">{monthDiff}개월 단축!</span>
          ) : (
            <span className="text-red-500">+{Math.abs(monthDiff)}개월 늘어남</span>
          )}
          {" → "}
          <span className="text-foreground">{formatProjectedDate(adjustedMonths)}</span>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// 대시보드 메인 페이지
// ──────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showResistModal, setShowResistModal] = useState(false);
  const [showSliderSheet, setShowSliderSheet] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const [resistStats, setResistStats] = useState({ totalAmount: 0, totalDays: 0, count: 0 });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!isSetupDone()) {
      router.replace("/dashboard/setup");
      return;
    }
    setProfile(loadProfile());
  }, [status, router]);

  useEffect(() => {
    setResistStats(getResistStats());
  }, []);

  const monthsLeft = useMemo(() => {
    if (!profile) return 0;
    return calcMonthsFromProfile(profile, 0);
  }, [profile]);

  const formattedDate = formatProjectedDate(monthsLeft);

  const monthlySavingMan = profile
    ? Math.round(calcMonthlySaving(profile) / 10000)
    : 0;

  // 실시간 카운트다운
  const countdown = useCountdown(monthsLeft);

  // FIRE 달성률 (현재 자산 / 목표 자금)
  const fireProgress = useMemo(() => {
    if (!profile) return 0;
    const target = calcTargetAmount(profile.targetExpense);
    if (target <= 0) return 0;
    return Math.min(1, profile.currentAssets / target);
  }, [profile]);

  const handleResist = (amount: number, category: string) => {
    if (!profile) return;
    const baseMonths = calcMonthsFromProfile(profile);
    const extraMonths = calcMonthsFromProfile(profile, amount);
    const savedDays = Math.round((baseMonths - extraMonths) * 30);

    const record: ResistRecord = {
      id: Date.now().toString(),
      amount,
      category,
      savedDays: Math.max(savedDays, 1),
      createdAt: new Date().toISOString(),
    };

    saveResistRecord(record);
    setResistStats(getResistStats());
    setShowResistModal(false);
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 2500);
  };

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-kakao-yellow border-t-transparent" />
      </div>
    );
  }

  const dDay = monthsLeft * 30;
  const progressPercent = Math.round(fireProgress * 100);

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F5F7] font-sans text-foreground dark:bg-zinc-950">
      {/* 상단 헤더 */}
      <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm dark:border-zinc-800 dark:bg-card">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-extrabold tracking-tight">아임 파이어족</h1>
          {session?.user?.name && (
            <span className="text-[12px] text-subtext font-medium hidden sm:inline">
              {session.user.name}님
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/stress-test")}
            className="flex h-9 w-9 items-center justify-center rounded-full text-subtext transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800"
            aria-label="스트레스 테스트"
          >
            <Zap size={20} />
          </button>
          <button
            onClick={() => router.push("/dashboard/setup")}
            className="flex h-9 w-9 items-center justify-center rounded-full text-subtext transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800"
            aria-label="설정"
          >
            <Settings size={20} />
          </button>
          <button
            onClick={() => {
              clearUserData();
              signOut({ callbackUrl: "/" });
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full text-subtext transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800"
            aria-label="로그아웃"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center p-6 sm:p-10">
        <div className="w-full max-w-md space-y-5">

          {/* ========== D-Day 메인 카드 — 세로형, 단색 배경, 깔끔하게 ========== */}
          <div className="flex flex-col items-center rounded-[28px] bg-white px-8 py-10 shadow-[0_2px_20px_rgb(0,0,0,0.06)] dark:bg-zinc-900 dark:shadow-[0_2px_20px_rgb(0,0,0,0.2)]">

            {/* 실시간 카운트다운 타이머 — 상단 */}
            <div className="flex items-center gap-1.5">
              {[
                { value: countdown.days, label: "일" },
                { value: countdown.hours, label: "시" },
                { value: countdown.minutes, label: "분" },
                { value: countdown.seconds, label: "초" },
              ].map(({ value, label }) => (
                <div key={label} className="flex items-baseline gap-0.5">
                  <span className="inline-block min-w-[2.2ch] rounded-lg bg-gray-100 px-2 py-1.5 text-center text-[18px] font-black tabular-nums text-gray-700 dark:bg-zinc-800 dark:text-zinc-200">
                    {String(value).padStart(2, "0")}
                  </span>
                  <span className="text-[11px] font-bold text-gray-400">{label}</span>
                </div>
              ))}
            </div>

            {/* D-Day + 은퇴가능일 — 가운데, 큼직하게 */}
            <div className="mt-8 flex flex-col items-center gap-2">
              <p className="text-[14px] font-bold text-gray-400">예상 은퇴 가능일</p>
              <h2 className="text-[42px] font-black tracking-tight text-gray-900 dark:text-white leading-none">
                D-{dDay.toLocaleString()}
              </h2>
              <p className="mt-1 text-[20px] font-extrabold text-gray-700 dark:text-zinc-300">
                {formattedDate}
              </p>
            </div>

            {/* 프로그레스바 — 하단 */}
            <div className="mt-10 w-full">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-bold text-gray-400">FIRE 달성률</span>
                <span className="text-[13px] font-extrabold text-gray-600 dark:text-zinc-300">{progressPercent}%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full bg-kakao-dark transition-all duration-700 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* 월 저축 기준 — 맨 아래 작게 */}
            <p className="mt-4 text-[12px] font-medium text-gray-400">
              월 {monthlySavingMan.toLocaleString()}만원 저축 기준
            </p>

            {/* 공유 버튼 */}
            <button
              onClick={() => setShowShareCard(true)}
              className="mt-5 flex items-center gap-1.5 rounded-full bg-gray-100 px-4 py-2 text-[13px] font-bold text-gray-500 transition-colors hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            >
              <Share2 size={14} />
              공유하기
            </button>
          </div>

          {/* ========== 부가 기능 버튼 영역 — 작은 버튼으로 정리 ========== */}
          <div className="flex flex-col gap-2.5">

            {/* 지출 시뮬레이션 버튼 */}
            <button
              onClick={() => setShowSliderSheet(true)}
              className="flex w-full items-center justify-between rounded-2xl bg-white px-5 py-4 shadow-[0_1px_8px_rgb(0,0,0,0.04)] transition-colors hover:bg-gray-50 active:bg-gray-100 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30">
                  <Wallet size={18} className="text-blue-500" />
                </div>
                <div className="text-left">
                  <p className="text-[15px] font-bold text-foreground">지출 시뮬레이션</p>
                  <p className="text-[12px] text-gray-400">지출 변화에 따른 은퇴일 변동 확인</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </button>

            {/* 충동 참기 버튼 */}
            <button
              onClick={() => setShowResistModal(true)}
              className="flex w-full items-center justify-between rounded-2xl bg-white px-5 py-4 shadow-[0_1px_8px_rgb(0,0,0,0.04)] transition-colors hover:bg-gray-50 active:bg-gray-100 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-900/30">
                  <AlertTriangle size={18} className="text-amber-500" />
                </div>
                <div className="text-left">
                  <p className="text-[15px] font-bold text-foreground">결제 충동 참기</p>
                  <p className="text-[12px] text-gray-400">
                    {resistStats.count > 0
                      ? `${resistStats.count}회 참음 · ${Math.round(resistStats.totalAmount / 10000)}만원 절약`
                      : "가상 적립으로 은퇴일 앞당기기"}
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </button>

            {/* 스트레스 테스트 버튼 */}
            <button
              onClick={() => router.push("/stress-test")}
              className="flex w-full items-center justify-between rounded-2xl bg-white px-5 py-4 shadow-[0_1px_8px_rgb(0,0,0,0.04)] transition-colors hover:bg-gray-50 active:bg-gray-100 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-50 dark:bg-purple-900/30">
                  <Zap size={18} className="text-purple-500" />
                </div>
                <div className="text-left">
                  <p className="text-[15px] font-bold text-foreground">스트레스 테스트</p>
                  <p className="text-[12px] text-gray-400">시나리오별 은퇴일 변화 시뮬레이션</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </button>
          </div>

        </div>
      </main>

      {/* 참기 모달 */}
      <AnimatePresence>
        {showResistModal && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResistModal(false)}
              className="fixed inset-0 z-40 bg-black/40"
            />
            <motion.div
              key="sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-white pb-safe dark:bg-card"
            >
              <ResistForm onSubmit={handleResist} onCancel={() => setShowResistModal(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 지출 슬라이더 바텀시트 */}
      <AnimatePresence>
        {showSliderSheet && profile && (
          <>
            <motion.div
              key="slider-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSliderSheet(false)}
              className="fixed inset-0 z-40 bg-black/40"
            />
            <motion.div
              key="slider-sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-white pb-safe dark:bg-card"
            >
              <SliderSheet profile={profile} onClose={() => setShowSliderSheet(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 공유 카드 모달 */}
      <AnimatePresence>
        {showShareCard && (
          <ShareCardModal
            months={monthsLeft}
            date={formattedDate}
            monthlySavingMan={monthlySavingMan}
            nickname={session?.user?.name ?? ""}
            onClose={() => setShowShareCard(false)}
          />
        )}
      </AnimatePresence>

      {/* 참기 성공 축하 */}
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
            <div className="relative flex flex-col items-center gap-3 rounded-[32px] bg-white px-12 py-10 shadow-2xl dark:bg-card">
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
