/**
 * 역할: 회원가입 진입 페이지 — 카카오/구글 간편 가입 버튼
 * 핵심 기능: 소셜 OAuth 인증 시작, 인증 후 닉네임 설정(/signup/profile)으로 이동
 * 의존: next-auth (signIn, useSession), lib/storage
 */
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { isSignupDone, isSetupDone } from "@/lib/storage";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const { status } = useSession();
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  // TODO: 회원가입 플로우 확인 후 다시 활성화할 것
  // useEffect(() => {
  //   if (status === "authenticated") {
  //     if (isSetupDone()) router.replace("/dashboard");
  //     else if (isSignupDone()) router.replace("/dashboard/setup");
  //     else router.replace("/signup/profile");
  //   }
  // }, [status, router]);

  const handleSignup = (provider: "kakao" | "google") => {
    setLoadingProvider(provider);
    // OAuth 인증 후 닉네임 설정 페이지로 이동
    signIn(provider, { callbackUrl: "/signup/profile" });
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
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-white">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex w-full max-w-md flex-col items-center gap-8"
      >
        {/* 로고 + 타이틀 */}
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
              회원가입
            </h1>
            <p className="text-subtext mt-3 text-sm font-medium leading-relaxed">
              소셜 계정으로 간편하게 시작하세요<br/>별도 비밀번호가 필요 없습니다
            </p>
          </div>
        </div>

        {/* 소셜 가입 버튼 */}
        <div className="flex w-full flex-col gap-3 mt-2">
          <button
            onClick={() => handleSignup("kakao")}
            disabled={loadingProvider !== null}
            className="group flex w-full items-center justify-center gap-2 rounded-[18px] bg-kakao-yellow py-4 text-[16px] font-bold text-kakao-brown transition-all hover:scale-[1.02] active:scale-95 shadow-sm disabled:opacity-60 disabled:hover:scale-100"
          >
            {loadingProvider === "kakao" ? (
              <Loader2 size={20} className="animate-spin" />
            ) : null}
            카카오로 가입하기
          </button>

          <button
            onClick={() => handleSignup("google")}
            disabled={loadingProvider !== null}
            className="group flex w-full items-center justify-center gap-2 rounded-[18px] bg-white py-4 text-[16px] font-bold text-gray-700 border border-gray-200 transition-all hover:scale-[1.02] active:scale-95 shadow-sm dark:bg-[#2A2A2A] dark:text-zinc-200 dark:border-zinc-700 disabled:opacity-60 disabled:hover:scale-100"
          >
            {loadingProvider === "google" ? (
              <Loader2 size={20} className="animate-spin" />
            ) : null}
            Google로 가입하기
          </button>
        </div>

        <p className="mt-2 mb-2 text-[13px] text-subtext text-center font-medium">
          이미 계정이 있으신가요?{" "}
          <Link href="/" className="text-kakao-brown font-bold underline underline-offset-2 hover:opacity-80 transition-opacity">
            로그인
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
