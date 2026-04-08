/**
 * 역할: Step 4 분석 로딩 화면 — 이모지 + 텍스트 시퀀스 + 완료 후 대시보드 이동
 * 핵심 기능: 단계별 이모지 통통 튕기며 전환, 포인트 텍스트 강조, 8초 후 자동 이동
 * 의존: lib/constants, lib/storage, next-auth
 */
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { markSetupDone } from "@/lib/storage";

// 각 단계별 이모지 + 텍스트 + 강조 키워드
const STEPS = [
  { emoji: "📊", text: "3만 가지 파산 시나리오 분석 중...", highlight: "파산 시나리오" },
  { emoji: "💳", text: "월급날과 카드값 비교 분석 중...", highlight: "카드값" },
  { emoji: "😤", text: "부장님 얼굴 볼 날 수 카운팅 중...", highlight: "부장님" },
  { emoji: "💻", text: "현실 직시 데이터 컴파일 중...", highlight: "현실 직시" },
  { emoji: "🎉", text: "퇴사 가능일 시뮬레이션 완료.", highlight: "퇴사 가능일" },
];

// 강조 키워드에 포인트 컬러 적용
function HighlightText({ text, highlight }: { text: string; highlight: string }) {
  const idx = text.indexOf(highlight);
  if (idx === -1) return <span>{text}</span>;
  return (
    <span>
      {text.slice(0, idx)}
      <span className="text-[#d97706]">{highlight}</span>
      {text.slice(idx + highlight.length)}
    </span>
  );
}

export default function AnalyzingPage() {
  const router = useRouter();
  const { status } = useSession();
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  useEffect(() => {
    const totalDuration = 5000;
    const interval = totalDuration / STEPS.length;

    const timer = setInterval(() => {
      setStepIndex((prev) => {
        if (prev >= STEPS.length - 1) {
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

  const step = STEPS[stepIndex];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-[#F5F5F7] px-8">
      {/* 이모지 — 위에서 떨어지며 스프링으로 통통 튕겨 정착, 퇴장 시 아래로 사라짐 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={stepIndex}
          initial={{ y: -50, opacity: 0, scale: 0.6 }}
          animate={{
            y: 0,
            opacity: 1,
            scale: 1,
            transition: { type: "spring", stiffness: 280, damping: 9, mass: 0.8 },
          }}
          exit={{
            y: 30,
            opacity: 0,
            scale: 0.75,
            transition: { duration: 0.22, ease: "easeIn" },
          }}
          className="text-[72px] leading-none select-none"
        >
          {step.emoji}
        </motion.div>
      </AnimatePresence>

      {/* 텍스트 */}
      <AnimatePresence mode="wait">
        <motion.p
          key={stepIndex}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.35, delay: 0.1 } }}
          exit={{ opacity: 0, y: -8, transition: { duration: 0.25 } }}
          className="text-center text-[17px] font-bold text-gray-700"
        >
          <HighlightText text={step.text} highlight={step.highlight} />
        </motion.p>
      </AnimatePresence>

      {/* 진행 바 */}
      <div className="w-full max-w-[280px] h-[6px] rounded-full bg-gray-200 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-[#FEE500]"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 5, ease: "linear" }}
        />
      </div>
    </div>
  );
}
