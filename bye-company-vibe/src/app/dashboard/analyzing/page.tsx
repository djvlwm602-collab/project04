/**
 * 역할: Step 4 분석 로딩 화면 — 텍스트 시퀀스 + 완료 후 대시보드 이동
 * 핵심 기능: ANALYZING_TEXTS 순환 표시, 3.5초 후 자동 이동
 * 의존: lib/constants, lib/storage, next-auth
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

  useEffect(() => {
    const totalDuration = 3500;
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
