/**
 * 역할: FIRE 대시보드 메인 화면 — D-Day 카드, 지출 슬라이더, 참기 버튼 표시
 * 핵심 기능: 프로필 로드, 은퇴 개월 수 계산, 슬라이더 피드백, 참기 기록, 헤더 네비게이션
 * 의존: lib/types, lib/constants, lib/calculator, lib/storage, next-auth
 */

"use client";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Wallet, Rocket, AlertTriangle, Settings, Zap, X, LogOut } from "lucide-react";
import type { UserProfile, ResistRecord } from "@/lib/types";
import { SLIDER_MIN, SLIDER_MAX, SLIDER_STEP, RESIST_CATEGORIES } from "@/lib/constants";
import { calcMonthsFromProfile, getSliderFeedback, formatProjectedDate, calcMonthlySaving } from "@/lib/calculator";
import { saveResistRecord, getResistStats, loadProfile, isSetupDone } from "@/lib/storage";

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
  // 기본 선택 카테고리 없음
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const handleSubmit = () => {
    if (amount <= 0 || !selectedCategory) return;
    onSubmit(amount, selectedCategory);
  };

  return (
    <div className="flex flex-col gap-5 p-6">
      {/* 헤더 */}
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

      {/* 금액 입력 */}
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

      {/* 카테고리 선택 — 필 버튼 */}
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

      {/* 하단 버튼 */}
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
// 대시보드 메인 페이지
// ──────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // 프로필 로드 상태
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // 슬라이더 조정 금액 (기본값 0)
  const [sliderValue, setSliderValue] = useState(0);

  // 피드백 문구를 state로 관리 — 슬라이더 변경 시에만 갱신해 랜덤 텍스트 무한 재렌더 방지
  const [feedbackText, setFeedbackText] = useState("");

  // 참기 모달 표시 여부
  const [showResistModal, setShowResistModal] = useState(false);

  // 참기 성공 축하 애니메이션 표시 여부
  const [showCelebration, setShowCelebration] = useState(false);

  // 참기 누적 통계
  const [resistStats, setResistStats] = useState({ totalAmount: 0, totalDays: 0, count: 0 });

  // 미인증 시 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [status, router]);

  // 마운트 시 온보딩 완료 여부 확인 후 프로필 로드
  useEffect(() => {
    if (status !== "authenticated") return;
    if (!isSetupDone()) {
      router.replace("/dashboard/setup");
      return;
    }
    setProfile(loadProfile());
  }, [status, router]);

  // 마운트 시 참기 통계 로드
  useEffect(() => {
    setResistStats(getResistStats());
  }, []);

  // 슬라이더 적용된 현재 은퇴 개월 수
  const monthsLeft = useMemo(() => {
    if (!profile) return 0;
    return calcMonthsFromProfile(profile, sliderValue);
  }, [profile, sliderValue]);

  // 슬라이더 조정 없는 기본 은퇴 개월 수 (차이 비교용)
  const baseMonthsLeft = useMemo(() => {
    if (!profile) return 0;
    return calcMonthsFromProfile(profile, 0);
  }, [profile]);

  const monthDiff = baseMonthsLeft - monthsLeft;

  // 슬라이더 또는 monthDiff 변경 시에만 피드백 문구 갱신
  useEffect(() => {
    setFeedbackText(getSliderFeedback(sliderValue, monthDiff));
  }, [sliderValue, monthDiff]);

  const formattedDate = formatProjectedDate(monthsLeft);

  // 월 저축액 (만 원 단위 표시용)
  const monthlySavingMan = profile
    ? Math.round(calcMonthlySaving(profile) / 10000)
    : 0;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderValue(Number(e.target.value));
  };

  // 참기 기록 저장 및 축하 애니메이션 트리거
  const handleResist = (amount: number, category: string) => {
    if (!profile) return; // null guard
    const baseMonths = calcMonthsFromProfile(profile);
    const extraMonths = calcMonthsFromProfile(profile, amount);
    const savedDays = Math.round((baseMonths - extraMonths) * 30);

    const record: ResistRecord = {
      id: Date.now().toString(),
      amount,
      category,
      // 사용자 동기 부여를 위해 최소 1일 보장 (소액이라도 의미 부여)
      savedDays: Math.max(savedDays, 1),
      createdAt: new Date().toISOString(),
    };

    saveResistRecord(record);
    setResistStats(getResistStats());
    setShowResistModal(false);
    setShowCelebration(true);
    // 2.5초 후 축하 애니메이션 자동 종료
    setTimeout(() => setShowCelebration(false), 2500);
  };

  // 프로필 로드 전 로딩 스피너 표시
  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-kakao-yellow border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground transition-colors duration-300">
      {/* 상단 헤더 — 타이틀 + 스트레스 테스트/설정 네비게이션 버튼 */}
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
          {/* 스트레스 테스트 페이지로 이동 */}
          <button
            onClick={() => router.push("/stress-test")}
            className="flex h-9 w-9 items-center justify-center rounded-full text-subtext transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800"
            aria-label="스트레스 테스트"
          >
            <Zap size={20} />
          </button>
          {/* 프로필 설정 페이지로 이동 */}
          <button
            onClick={() => router.push("/dashboard/setup")}
            className="flex h-9 w-9 items-center justify-center rounded-full text-subtext transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800"
            aria-label="설정"
          >
            <Settings size={20} />
          </button>
          {/* 로그아웃 */}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex h-9 w-9 items-center justify-center rounded-full text-subtext transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800"
            aria-label="로그아웃"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center p-6 sm:p-10">
        <div className="w-full max-w-md space-y-6">

          {/* D-Day 메인 카드 — 예상 은퇴일과 남은 개월 수 표시 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative flex flex-col items-center justify-center overflow-hidden rounded-[32px] bg-kakao-yellow p-10 text-kakao-brown shadow-xl"
          >
            {/* 장식용 아이콘 배경 */}
            <Rocket size={120} className="absolute -bottom-6 -right-6 opacity-10" />

            <p className="z-10 mb-1 text-[15px] font-bold opacity-80">예상 은퇴(사직) 가능일</p>
            <h2 className="z-10 my-2 text-4xl font-black tracking-tighter drop-shadow-sm">
              {formattedDate}
            </h2>
            <p className="z-10 mt-3 inline-block rounded-full bg-white/30 px-4 py-1.5 text-[15px] font-medium opacity-90">
              현재 페이스로 <span className="font-extrabold">{monthsLeft}개월</span> 남았습니다.
            </p>
            {/* 월 저축 기준 안내 */}
            <p className="z-10 mt-2 text-[13px] font-medium opacity-60">
              월 저축 {monthlySavingMan}만 원 기준
            </p>
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

              {/* lib 상수로 min/max/step 관리 */}
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

            {/* 실시간 피드백 박스 — 저축 증가/감소에 따라 색상 변경 */}
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

          {/* 참기 액션 버튼 — 클릭 시 참기 모달 오픈 */}
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

          {/* 누적 참기 통계 카드 — 기록이 1개 이상일 때만 표시 */}
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

      {/* 참기 모달 — 하단에서 슬라이드업 */}
      <AnimatePresence>
        {showResistModal && (
          <>
            {/* 어두운 오버레이 — 클릭 시 모달 닫기 */}
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResistModal(false)}
              className="fixed inset-0 z-40 bg-black/40"
            />
            {/* 바텀 시트 카드 */}
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

      {/* 참기 성공 축하 애니메이션 — pointer-events 없음 */}
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
            {/* 반투명 배경 */}
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
