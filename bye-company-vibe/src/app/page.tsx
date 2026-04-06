/**
 * 역할: 서비스 진입점 — 소셜 로그인 화면
 * 핵심 기능: 카카오/구글 OAuth 로그인, 로그인 상태면 대시보드로 리다이렉트
 * 의존: next-auth (signIn), lib/storage (isSetupDone)
 */
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { isSetupDone } from "@/lib/storage";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const handleLogin = (provider: "kakao" | "google") => {
    setLoadingProvider(provider);
    const callbackUrl = isSetupDone() ? "/dashboard" : "/dashboard/setup";
    signIn(provider, { callbackUrl });
  };

  // 세션 로딩 중 로딩 표시
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-kakao-yellow border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-6 bg-background">
      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex w-full max-w-md flex-col items-center gap-8"
      >
        <div className="flex flex-col items-center gap-4 text-center mt-4">
          <motion.div
            initial={{ scale: 0.5, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.2 }}
            className="h-20 w-20 rounded-2xl shadow-lg mb-2 relative overflow-hidden"
          >
            <img
              src="/fire.png"
              alt="아임 파이어족"
              className="h-full w-full object-cover"
            />
          </motion.div>

          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              아임 파이어족
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
            ) : (
              <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] shrink-0 fill-current" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3c-5.52 0-10 3.51-10 7.85 0 2.8 1.83 5.25 4.6 6.55-.42 1.6-1.34 3.12-1.38 3.19-.04.07-.07.16-.01.23.05.08.14.13.24.13.12 0 .21-.03.28-.06 2.05-1.03 4.1-2.22 4.19-2.27.67.14 1.37.21 2.08.21 5.52 0 10-3.51 10-7.85S17.52 3 12 3z" />
              </svg>
            )}
            카카오로 시작하기
          </button>

          <button
            onClick={() => handleLogin("google")}
            disabled={loadingProvider !== null}
            className="group flex w-full items-center justify-center gap-2 rounded-[18px] bg-white py-4 text-[16px] font-bold text-gray-700 border border-gray-200 transition-all hover:scale-[1.02] active:scale-95 shadow-sm dark:bg-[#2A2A2A] dark:text-zinc-200 dark:border-zinc-700 disabled:opacity-60 disabled:hover:scale-100"
          >
            {loadingProvider === "google" ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] shrink-0" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            Google로 시작하기
          </button>
        </div>

        <p className="mt-2 mb-1 text-[13px] text-subtext text-center font-medium">
          아직 계정이 없으신가요?{" "}
          <Link href="/signup" className="text-kakao-brown dark:text-kakao-yellow font-bold underline underline-offset-2 hover:opacity-80 transition-opacity">
            회원가입
          </Link>
        </p>

        <p className="mt-1 mb-2 text-[12px] text-subtext text-center font-medium">
          로그인 시 서비스 이용약관 및<br/>개인정보 처리방침에 동의하게 됩니다.
        </p>
      </motion.div>
    </div>
  );
}
