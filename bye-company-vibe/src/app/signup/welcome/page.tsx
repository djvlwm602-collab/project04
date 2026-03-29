/**
 * 역할: 가입 완료 환영 페이지 — 주요 기능 가이드 슬라이드
 * 핵심 기능: 환영 메시지 표시, 3가지 핵심 기능 소개, 대시보드로 자연스럽게 전환
 * 의존: next-auth (useSession), lib/storage (loadNickname)
 */
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, CalendarDays, Wallet, AlertTriangle, ArrowRight, PartyPopper } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { loadNickname } from "@/lib/storage";

const GUIDE_SLIDES = [
  {
    Icon: CalendarDays,
    title: "은퇴 D-Day 확인",
    description: "입력한 재무 정보를 바탕으로\n예상 은퇴 가능 날짜를 실시간으로 확인하세요",
    color: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  },
  {
    Icon: Wallet,
    title: "지출 스와이프 시뮬레이션",
    description: "지출을 늘리거나 줄이면 은퇴 시기가\n어떻게 변하는지 슬라이더로 체험해 보세요",
    color: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  },
  {
    Icon: AlertTriangle,
    title: "결제 충동 참기",
    description: "충동 구매를 참을 때마다 가상 적립!\n얼마나 은퇴를 앞당겼는지 기록됩니다",
    color: "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  },
];

export default function WelcomePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [nickname, setNickname] = useState("");

  useEffect(() => {
    const saved = loadNickname();
    if (saved) {
      setNickname(saved.nickname);
    } else if (session?.user?.name) {
      setNickname(session.user.name);
    }
  }, [session]);

  // 미인증 시 로그인 페이지로
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [status, router]);

  const isLastSlide = currentSlide === GUIDE_SLIDES.length - 1;

  const handleNext = () => {
    if (isLastSlide) {
      router.push("/dashboard");
    } else {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    router.push("/dashboard");
  };

  // 세션 로딩 중 스피너
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-kakao-yellow border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-background transition-colors duration-300">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex w-full max-w-md flex-col items-center gap-6 rounded-3xl bg-card p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]"
      >
        {/* 환영 헤더 */}
        <motion.div
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.2 }}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-kakao-yellow/20"
        >
          <PartyPopper size={32} className="text-kakao-brown" />
        </motion.div>

        <div className="text-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            {nickname}님, 환영합니다!
          </h1>
          <p className="text-subtext mt-2 text-sm font-medium">
            가입이 완료되었습니다. 주요 기능을 알아보세요
          </p>
        </div>

        {/* 가이드 슬라이드 */}
        <div className="w-full min-h-[200px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className={`flex flex-col items-center gap-4 rounded-2xl p-6 ${GUIDE_SLIDES[currentSlide].color}`}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/60 dark:bg-black/10">
                {(() => {
                  const SlideIcon = GUIDE_SLIDES[currentSlide].Icon;
                  return <SlideIcon size={28} />;
                })()}
              </div>
              <h3 className="text-[18px] font-extrabold">
                {GUIDE_SLIDES[currentSlide].title}
              </h3>
              <p className="text-[14px] font-medium text-center leading-relaxed whitespace-pre-line opacity-80">
                {GUIDE_SLIDES[currentSlide].description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 슬라이드 인디케이터 */}
        <div className="flex items-center gap-2">
          {GUIDE_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === currentSlide
                  ? "w-6 bg-kakao-yellow"
                  : "w-2 bg-gray-300 dark:bg-zinc-600"
              }`}
            />
          ))}
        </div>

        {/* 하단 버튼 */}
        <div className="flex w-full flex-col gap-3">
          <button
            onClick={handleNext}
            className="flex w-full items-center justify-center gap-2 rounded-[18px] bg-kakao-yellow py-4 text-[16px] font-bold text-kakao-brown transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
          >
            {isLastSlide ? (
              <>
                <Rocket size={18} />
                대시보드로 이동
              </>
            ) : (
              <>
                다음
                <ArrowRight size={18} />
              </>
            )}
          </button>

          {!isLastSlide && (
            <button
              onClick={handleSkip}
              className="text-[13px] font-bold text-subtext hover:text-foreground transition-colors"
            >
              건너뛰기
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
