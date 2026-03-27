/**
 * 역할: 서비스 진입점 — 소셜 로그인 화면
 * 핵심 기능: 카카오/구글 OAuth 로그인, 로그인 상태면 대시보드로 리다이렉트
 * 의존: next-auth (signIn), lib/storage (isSetupDone)
 */
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, CalendarDays, Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { isSetupDone } from "@/lib/storage";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  // 이미 로그인된 상태면 대시보드로 리다이렉트
  useEffect(() => {
    if (status === "authenticated") {
      router.replace(isSetupDone() ? "/dashboard" : "/dashboard/setup");
    }
  }, [status, router]);

  const handleLogin = (provider: "kakao" | "google") => {
    setLoadingProvider(provider);
    const callbackUrl = isSetupDone() ? "/dashboard" : "/dashboard/setup";
    signIn(provider, { callbackUrl });
  };

  // 세션 로딩 중이거나 이미 로그인된 상태면 로딩 표시
  if (status === "loading" || status === "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-kakao-yellow border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-background transition-colors duration-300">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex w-full max-w-md flex-col items-center gap-8 rounded-3xl bg-card p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]"
      >
        <div className="flex flex-col items-center gap-4 text-center mt-4">
          <motion.div
            initial={{ scale: 0.5, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.2 }}
            className="flex h-20 w-20 items-center justify-center rounded-2xl bg-kakao-yellow text-kakao-brown shadow-lg mb-2 relative overflow-hidden"
          >
            <TrendingUp size={40} className="absolute opacity-20 right-[-5px] bottom-[-5px]" />
            <CalendarDays size={36} />
          </motion.div>

          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Bye-Company Vibe
            </h1>
            <p className="text-subtext mt-3 text-sm font-medium leading-relaxed">
              40대 맞벌이 부부를 위한<br/>파이어족 은퇴 D-Day 시뮬레이터
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 mt-6">
          <button
            onClick={() => handleLogin("kakao")}
            disabled={loadingProvider !== null}
            className="group flex w-full items-center justify-center gap-2 rounded-[18px] bg-kakao-yellow py-4 text-[16px] font-bold text-kakao-brown transition-all hover:scale-[1.02] active:scale-95 shadow-sm disabled:opacity-60 disabled:hover:scale-100"
          >
            {loadingProvider === "kakao" ? (
              <Loader2 size={20} className="animate-spin" />
            ) : null}
            카카오로 시작하기
          </button>

          <button
            onClick={() => handleLogin("google")}
            disabled={loadingProvider !== null}
            className="group flex w-full items-center justify-center gap-2 rounded-[18px] bg-white py-4 text-[16px] font-bold text-gray-700 border border-gray-200 transition-all hover:scale-[1.02] active:scale-95 shadow-sm dark:bg-[#2A2A2A] dark:text-zinc-200 dark:border-zinc-700 disabled:opacity-60 disabled:hover:scale-100"
          >
            {loadingProvider === "google" ? (
              <Loader2 size={20} className="animate-spin" />
            ) : null}
            Google로 시작하기
          </button>
        </div>

        <p className="mt-4 mb-2 text-[12px] text-subtext text-center font-medium">
          로그인 시 서비스 이용약관 및<br/>개인정보 처리방침에 동의하게 됩니다.
        </p>
      </motion.div>
    </div>
  );
}
