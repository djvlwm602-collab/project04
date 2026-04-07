/**
 * 역할: 서비스 진입점 — 감성 랜딩 + 소셜 로그인
 * 핵심 기능: 강렬한 타이포, 카카오/구글 로그인, 인증 상태 리다이렉트
 * 의존: next-auth, lib/storage
 */
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { isSetupDone, isSignupDone } from "@/lib/storage";
import Link from "next/link";

export default function LandingPage() {
  const router = useRouter();
  const { status } = useSession();
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      if (isSetupDone()) router.replace("/dashboard");
      else if (isSignupDone()) router.replace("/dashboard/setup");
      else router.replace("/signup/profile");
    }
  }, [status, router]);

  const handleLogin = (provider: "kakao" | "google") => {
    setLoadingProvider(provider);
    const callbackUrl = isSetupDone()
      ? "/dashboard"
      : isSignupDone()
        ? "/dashboard/setup"
        : "/signup/profile";
    signIn(provider, { callbackUrl });
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#FEE500] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0a0a0a] p-6">
      {/* 배경 그라데이션 효과 */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FEE500]/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative flex w-full max-w-md flex-col items-center gap-10"
      >
        {/* 메인 카피 */}
        <div className="flex flex-col items-center gap-4 text-center">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-[13px] font-bold uppercase tracking-[0.2em] text-[#FEE500]/60"
          >
            은퇴 서바이벌 계산기
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            className="text-[38px] font-black leading-tight tracking-tight text-white"
          >
            오늘도<br />
            <span className="text-[#FEE500]">견디는</span><br />
            당신에게
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="text-[15px] font-medium leading-relaxed text-white/40"
          >
            ㅅㅂ.. 언제 탈출할 수 있을까?<br />
            당신의 비밀 탈출 시나리오를 계산합니다.
          </motion.p>
        </div>

        {/* 로그인 버튼 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.5 }}
          className="flex w-full flex-col gap-3"
        >
          <button
            onClick={() => handleLogin("kakao")}
            disabled={loadingProvider !== null}
            className="flex w-full items-center justify-center gap-2.5 rounded-[18px] bg-[#FEE500] py-4 text-[16px] font-bold text-[#3C1E1E] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60"
          >
            {loadingProvider === "kakao" ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0 fill-current">
                <path d="M12 3c-5.52 0-10 3.51-10 7.85 0 2.8 1.83 5.25 4.6 6.55-.42 1.6-1.34 3.12-1.38 3.19-.04.07-.07.16-.01.23.05.08.14.13.24.13.12 0 .21-.03.28-.06 2.05-1.03 4.1-2.22 4.19-2.27.67.14 1.37.21 2.08.21 5.52 0 10-3.51 10-7.85S17.52 3 12 3z" />
              </svg>
            )}
            카카오로 시작하기
          </button>

          <button
            onClick={() => handleLogin("google")}
            disabled={loadingProvider !== null}
            className="flex w-full items-center justify-center gap-2.5 rounded-[18px] bg-white/10 py-4 text-[16px] font-bold text-white backdrop-blur-sm transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60"
          >
            {loadingProvider === "google" ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            Google로 시작하기
          </button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.5 }}
          className="text-[12px] text-white/30 text-center"
        >
          아직 계정이 없으신가요?{" "}
          <Link href="/signup" className="text-[#FEE500]/60 underline underline-offset-2 hover:text-[#FEE500]">
            회원가입
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
