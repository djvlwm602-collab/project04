/**
 * 역할: FIRE 대시보드 메인 화면 — D-Day 카드, 지출 슬라이더, 참기 버튼, 공유 카드
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
  Share2, Download, Palmtree, Plane, Sunrise, UmbrellaOff,
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
// 위트 있는 비교 데이터 생성 — 남은 개월 수 기반
// ──────────────────────────────────────────────
function getWittyComparisons(months: number, monthlySavingMan: number) {
  const days = months * 30;
  const workingDays = Math.round(days * 5 / 7); // 주5일 기준

  return [
    {
      emoji: "☕",
      label: "남은 출근길 커피",
      value: workingDays.toLocaleString(),
      unit: "잔",
      sub: "매일 1잔 기준",
    },
    {
      emoji: "😩",
      label: "남은 월요일 아침",
      value: (months * 4).toLocaleString(),
      unit: "번",
      sub: "벌써 우울해지는 숫자",
    },
    {
      emoji: "🍿",
      label: "넷플릭스로 환산하면",
      value: Math.round(days * 24 / 2).toLocaleString(),
      unit: "편",
      sub: "2시간짜리 영화 기준",
    },
    {
      emoji: "💰",
      label: "그동안 모을 저축액",
      value: (monthlySavingMan * months).toLocaleString(),
      unit: "만원",
      sub: "현재 페이스 유지 시",
    },
  ];
}

// ──────────────────────────────────────────────
// Tide 스타일 — FIRE 달성률 기반 색상 팔레트
// 멀면 깊은 바다(차가운 색), 가까우면 선셋(따뜻한 색)
// ──────────────────────────────────────────────
function getTideColors(progress: number) {
  if (progress >= 0.8) return { bg: "from-orange-400 via-rose-400 to-pink-500", wave1: "#fb923c", wave2: "#f472b6", text: "text-white" };
  if (progress >= 0.5) return { bg: "from-amber-400 via-yellow-400 to-orange-400", wave1: "#fbbf24", wave2: "#fb923c", text: "text-amber-950" };
  if (progress >= 0.3) return { bg: "from-teal-500 via-cyan-500 to-blue-500", wave1: "#14b8a6", wave2: "#06b6d4", text: "text-white" };
  return { bg: "from-blue-600 via-indigo-600 to-violet-700", wave1: "#3b82f6", wave2: "#6366f1", text: "text-white" };
}

// ──────────────────────────────────────────────
// 물결 애니메이션 SVG 컴포넌트 — Tide 앱 영감
// progress(0~1)에 따라 물결 높이가 올라감
// ──────────────────────────────────────────────
function WaveGauge({ progress, wave1Color, wave2Color }: {
  progress: number;
  wave1Color: string;
  wave2Color: string;
}) {
  // 물결 높이: progress 0% → 카드 맨 아래, 100% → 카드 거의 꽉 참
  // 최소 5%, 최대 85%로 제한 (텍스트 가독성 유지)
  const fillPercent = Math.min(85, Math.max(5, progress * 85));
  const waveTop = 100 - fillPercent;

  return (
    <div className="absolute inset-0 overflow-hidden rounded-[32px]">
      {/* 물결 1 — 느린 파도 */}
      <motion.div
        className="absolute w-[200%] left-[-50%]"
        style={{ top: `${waveTop}%`, height: `${fillPercent + 10}%` }}
        initial={{ top: "100%" }}
        animate={{ top: `${waveTop}%` }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      >
        <svg
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          className="w-full h-8 sm:h-10"
          style={{ marginBottom: -1 }}
        >
          <motion.path
            d="M0,160 C360,240 720,80 1080,160 C1260,200 1350,140 1440,160 L1440,320 L0,320 Z"
            fill={wave1Color}
            fillOpacity={0.35}
            animate={{ d: [
              "M0,160 C360,240 720,80 1080,160 C1260,200 1350,140 1440,160 L1440,320 L0,320 Z",
              "M0,180 C360,100 720,260 1080,140 C1260,100 1350,200 1440,180 L1440,320 L0,320 Z",
              "M0,160 C360,240 720,80 1080,160 C1260,200 1350,140 1440,160 L1440,320 L0,320 Z",
            ]}}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
        </svg>
        <div className="w-full h-full" style={{ backgroundColor: wave1Color, opacity: 0.3 }} />
      </motion.div>

      {/* 물결 2 — 빠른 파도 (레이어링) */}
      <motion.div
        className="absolute w-[200%] left-[-30%]"
        style={{ top: `${waveTop + 3}%`, height: `${fillPercent + 10}%` }}
        initial={{ top: "100%" }}
        animate={{ top: `${waveTop + 3}%` }}
        transition={{ duration: 1.8, ease: "easeOut", delay: 0.2 }}
      >
        <svg
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          className="w-full h-6 sm:h-8"
          style={{ marginBottom: -1 }}
        >
          <motion.path
            d="M0,200 C240,120 480,280 720,160 C960,40 1200,240 1440,200 L1440,320 L0,320 Z"
            fill={wave2Color}
            fillOpacity={0.25}
            animate={{ d: [
              "M0,200 C240,120 480,280 720,160 C960,40 1200,240 1440,200 L1440,320 L0,320 Z",
              "M0,140 C240,260 480,100 720,220 C960,280 1200,100 1440,140 L1440,320 L0,320 Z",
              "M0,200 C240,120 480,280 720,160 C960,40 1200,240 1440,200 L1440,320 L0,320 Z",
            ]}}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </svg>
        <div className="w-full h-full" style={{ backgroundColor: wave2Color, opacity: 0.2 }} />
      </motion.div>
    </div>
  );
}

// ──────────────────────────────────────────────
// D-Day 카드에 떠다니는 장식 아이콘 — '탈출/해방' 테마
// ──────────────────────────────────────────────
const FLOATING_ICONS = [
  { Icon: Plane, size: 28, x: "8%", y: "12%", delay: 0, duration: 4.5 },
  { Icon: Palmtree, size: 24, x: "82%", y: "18%", delay: 0.8, duration: 5.2 },
  { Icon: Sunrise, size: 22, x: "15%", y: "75%", delay: 1.5, duration: 4.8 },
  { Icon: UmbrellaOff, size: 20, x: "78%", y: "72%", delay: 0.4, duration: 5.0 },
];

// ──────────────────────────────────────────────
// 공유 카드용 그라데이션 배경 — D-Day 구간별 색상
// ──────────────────────────────────────────────
function getShareCardGradient(months: number): string {
  // 가까울수록 따뜻한 색, 멀수록 차가운 색
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

  const dDay = months * 30; // 대략적인 일수
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
        // Web Share 미지원 시 다운로드
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `bye-company-d${dDay}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      // 사용자가 공유 취소한 경우 무시
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("공유 실패:", err);
      }
    } finally {
      setSaving(false);
    }
  }, [saving, dDay]);

  return (
    <>
      {/* 오버레이 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
      />

      {/* 모달 본체 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-6"
      >
        <div className="flex w-full max-w-sm flex-col items-center gap-5">
          {/* 공유용 카드 (캡처 대상) */}
          <div
            ref={cardRef}
            className={`relative w-full overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-8 shadow-2xl`}
            style={{ aspectRatio: "4 / 5" }}
          >
            {/* 장식 원형 — 배경 무드 */}
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10" />
            <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/10" />
            <div className="absolute top-1/2 right-1/4 h-20 w-20 rounded-full bg-white/5" />

            {/* 콘텐츠 */}
            <div className="relative z-10 flex h-full flex-col items-center justify-between text-white">
              {/* 상단: 앱 이름 */}
              <div className="flex items-center gap-2 self-start">
                <Rocket size={16} className="opacity-80" />
                <span className="text-[13px] font-bold opacity-80">Bye-Company Vibe</span>
              </div>

              {/* 중앙: D-Day 메인 */}
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

              {/* 하단: 닉네임 + 저축 정보 */}
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

          {/* 하단 버튼들 */}
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
// 대시보드 메인 페이지
// ──────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sliderValue, setSliderValue] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [showResistModal, setShowResistModal] = useState(false);
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
    return calcMonthsFromProfile(profile, sliderValue);
  }, [profile, sliderValue]);

  const baseMonthsLeft = useMemo(() => {
    if (!profile) return 0;
    return calcMonthsFromProfile(profile, 0);
  }, [profile]);

  const monthDiff = baseMonthsLeft - monthsLeft;

  useEffect(() => {
    setFeedbackText(getSliderFeedback(sliderValue, monthDiff));
  }, [sliderValue, monthDiff]);

  const formattedDate = formatProjectedDate(monthsLeft);

  const monthlySavingMan = profile
    ? Math.round(calcMonthlySaving(profile) / 10000)
    : 0;

  // 실시간 카운트다운
  const countdown = useCountdown(monthsLeft);

  // FIRE 달성률 (현재 자산 / 목표 자금) — 물결 게이지 높이에 사용
  const fireProgress = useMemo(() => {
    if (!profile) return 0;
    const target = calcTargetAmount(profile.targetExpense);
    if (target <= 0) return 0;
    return Math.min(1, profile.currentAssets / target);
  }, [profile]);

  // Tide 스타일 색상 (달성률 기반)
  const tideColors = useMemo(() => getTideColors(fireProgress), [fireProgress]);

  // 위트 있는 비교 데이터
  const comparisons = useMemo(
    () => getWittyComparisons(monthsLeft, monthlySavingMan),
    [monthsLeft, monthlySavingMan]
  );

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderValue(Number(e.target.value));
  };

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

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground transition-colors duration-300">
      {/* 상단 헤더 */}
      <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm dark:border-zinc-800 dark:bg-card">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-extrabold tracking-tight">Bye-Company Vibe</h1>
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
        <div className="w-full max-w-md space-y-6">

          {/* D-Day 메인 카드 — Tide 앱 영감 물결 게이지 + 색상 전환 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative flex flex-col items-center justify-center overflow-hidden rounded-[32px] bg-gradient-to-b ${tideColors.bg} p-10 ${tideColors.text} shadow-xl`}
            style={{ minHeight: 320 }}
          >
            {/* Tide 스타일 물결 게이지 — FIRE 달성률에 따라 수위 변화 */}
            <WaveGauge
              progress={fireProgress}
              wave1Color={tideColors.wave1}
              wave2Color={tideColors.wave2}
            />

            {/* 부유하는 장식 아이콘 — 탈출/휴양 테마 */}
            {FLOATING_ICONS.map(({ Icon, size, x, y, delay, duration }, idx) => (
              <motion.div
                key={idx}
                className="absolute opacity-[0.15]"
                style={{ left: x, top: y }}
                animate={{
                  y: [0, -12, 0, 8, 0],
                  rotate: [0, 5, -3, 5, 0],
                }}
                transition={{
                  duration,
                  delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Icon size={size} />
              </motion.div>
            ))}

            {/* 장식용 배경 원형 */}
            <div className="absolute -top-8 -right-8 h-36 w-36 rounded-full bg-white/10" />
            <div className="absolute -bottom-6 -left-6 h-28 w-28 rounded-full bg-white/8" />

            {/* FIRE 달성률 표시 */}
            <div className="z-10 mb-4 flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 backdrop-blur-sm">
              <div className="h-2 w-16 overflow-hidden rounded-full bg-white/20">
                <motion.div
                  className="h-full rounded-full bg-white/80"
                  initial={{ width: 0 }}
                  animate={{ width: `${fireProgress * 100}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              </div>
              <span className="text-[12px] font-bold opacity-80">
                FIRE {Math.round(fireProgress * 100)}% 달성
              </span>
            </div>

            <p className="z-10 mb-1 text-[15px] font-bold opacity-80">예상 은퇴(사직) 가능일</p>
            <h2 className="z-10 my-2 text-4xl font-black tracking-tighter drop-shadow-sm">
              {formattedDate}
            </h2>

            {/* 실시간 카운트다운 — 초 단위로 줄어드는 생동감 */}
            <div className="z-10 mt-3 flex items-center gap-1.5">
              {[
                { value: countdown.days, label: "일" },
                { value: countdown.hours, label: "시" },
                { value: countdown.minutes, label: "분" },
                { value: countdown.seconds, label: "초" },
              ].map(({ value, label }) => (
                <div key={label} className="flex items-baseline gap-0.5">
                  <span className="inline-block min-w-[2ch] rounded-lg bg-white/20 px-2 py-1 text-center text-[18px] font-black tabular-nums backdrop-blur-sm">
                    {String(value).padStart(2, "0")}
                  </span>
                  <span className="text-[11px] font-bold opacity-60">{label}</span>
                </div>
              ))}
            </div>

            <p className="z-10 mt-3 text-[13px] font-medium opacity-60">
              월 저축 {monthlySavingMan}만 원 기준
            </p>

            {/* 공유하기 버튼 */}
            <button
              onClick={() => setShowShareCard(true)}
              className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-all hover:bg-white/35 hover:scale-110 active:scale-95"
              aria-label="공유"
            >
              <Share2 size={16} />
            </button>
          </motion.div>

          {/* 위트 있는 비교 데이터 카드 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="rounded-[24px] bg-card p-6 shadow-[0_4px_20px_rgb(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.15)]"
          >
            <p className="mb-4 text-[13px] font-bold text-subtext">자유까지 이만큼 남았어요</p>
            <div className="grid grid-cols-2 gap-3">
              {comparisons.map(({ emoji, label, value, unit, sub }) => (
                <div
                  key={label}
                  className="flex flex-col gap-1 rounded-2xl bg-gray-50 p-4 dark:bg-zinc-800/60"
                >
                  <span className="text-xl">{emoji}</span>
                  <p className="text-[12px] font-bold text-subtext">{label}</p>
                  <p className="text-[20px] font-black text-foreground leading-tight">
                    {value}<span className="text-[13px] font-bold text-subtext ml-0.5">{unit}</span>
                  </p>
                  <p className="text-[11px] text-subtext opacity-70">{sub}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* 지출 증감 인터랙티브 슬라이더 카드 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-[32px] bg-card p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]"
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-[18px] font-extrabold">지출 스와이프 액션</h3>
              <Wallet className="text-subtext" size={24} />
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
                onChange={handleSliderChange}
                className="h-2.5 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-kakao-dark dark:bg-zinc-700"
              />
              <div className="mt-4 text-center text-[17px] font-extrabold">
                조정 금액: {sliderValue > 0 ? "+" : ""}{(sliderValue / 10000).toLocaleString()}만 원 / 월
              </div>
            </div>

            <div
              className={`mt-6 rounded-2xl p-5 text-[14.5px] font-bold leading-relaxed transition-colors ${
                sliderValue > 0
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                  : sliderValue < 0
                  ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                  : "bg-gray-100 text-subtext dark:bg-zinc-800"
              }`}
            >
              {feedbackText}
            </div>
          </motion.div>

          {/* 참기 액션 버튼 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <button
              onClick={() => setShowResistModal(true)}
              className="group flex w-full items-center justify-center gap-2 rounded-[22px] bg-kakao-dark py-5 text-[17px] font-bold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-95"
            >
              <AlertTriangle size={22} className="text-kakao-yellow" />
              지금 결제 충동 참기! (가상적립)
            </button>
          </motion.div>

          {/* 누적 참기 통계 카드 */}
          {resistStats.count > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-[24px] bg-card px-6 py-5 shadow-[0_4px_20px_rgb(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.15)]"
            >
              <p className="mb-4 text-[13px] font-bold text-subtext">나의 참기 기록 ✨</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="flex flex-col gap-1">
                  <span className="text-[22px] font-black text-foreground">{resistStats.count}</span>
                  <span className="text-[12px] font-bold text-subtext">참기 횟수</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[22px] font-black text-kakao-brown">
                    {Math.round(resistStats.totalAmount / 10000)}
                  </span>
                  <span className="text-[12px] font-bold text-subtext">절약 금액 (만원)</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[22px] font-black text-blue-500">{resistStats.totalDays}</span>
                  <span className="text-[12px] font-bold text-subtext">앞당긴 일수</span>
                </div>
              </div>
            </motion.div>
          )}

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

      {/* 참기 성공 축하 애니메이션 */}
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
