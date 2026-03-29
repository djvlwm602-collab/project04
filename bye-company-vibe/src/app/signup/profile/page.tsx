/**
 * 역할: 가입 Step 2 — 닉네임/프로필 설정 페이지
 * 핵심 기능: 소셜 프로필(이름, 이미지)을 미리 채워두고 닉네임 수정 가능, 저장 후 재무 프로필 설정으로 이동
 * 의존: next-auth (useSession), lib/storage (saveNickname, markSignupDone)
 */
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Camera, ArrowRight } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { saveNickname, markSignupDone } from "@/lib/storage";

export default function ProfileSetupPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // 소셜 프로필에서 닉네임과 이미지 미리 채움
  const [nickname, setNickname] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [error, setError] = useState("");

  // 세션 로드 후 소셜 프로필 정보로 초기값 설정
  useEffect(() => {
    if (session?.user) {
      setNickname(session.user.name || "");
      setProfileImage(session.user.image || "");
    }
  }, [session]);

  // 미인증 시 회원가입 첫 페이지로 리다이렉트
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/signup");
    }
  }, [status, router]);

  const handleSubmit = () => {
    const trimmed = nickname.trim();
    if (!trimmed) {
      setError("닉네임을 입력해 주세요.");
      return;
    }
    if (trimmed.length < 2) {
      setError("닉네임은 2자 이상이어야 합니다.");
      return;
    }
    if (trimmed.length > 12) {
      setError("닉네임은 12자 이하로 입력해 주세요.");
      return;
    }

    saveNickname({ nickname: trimmed, profileImage });
    markSignupDone();
    router.push("/dashboard/setup");
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
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex w-full max-w-md flex-col items-center gap-6 rounded-3xl bg-card p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]"
      >
        {/* 단계 표시 */}
        <p className="text-[13px] font-bold text-subtext">가입 2단계 중 1단계</p>

        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          프로필 설정
        </h1>
        <p className="text-subtext text-sm font-medium text-center leading-relaxed -mt-3">
          서비스에서 사용할 닉네임을 정해주세요
        </p>

        {/* 프로필 이미지 미리보기 */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
          className="relative"
        >
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gray-100 shadow-lg dark:bg-zinc-800">
            {profileImage ? (
              <img
                src={profileImage}
                alt="프로필"
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <User size={40} className="text-subtext" />
            )}
          </div>
          {/* 카메라 뱃지 — 향후 프로필 이미지 변경 기능 확장 가능 */}
          <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-kakao-yellow text-kakao-brown shadow">
            <Camera size={14} />
          </div>
        </motion.div>

        {/* 닉네임 입력 */}
        <div className="flex w-full flex-col gap-2 mt-2">
          <label className="text-[13px] font-bold text-subtext">닉네임</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value);
              setError("");
            }}
            placeholder="2~12자 닉네임"
            maxLength={12}
            className="w-full rounded-2xl border border-gray-200 bg-background px-4 py-3.5 text-[16px] font-bold text-foreground outline-none transition-colors focus:border-kakao-yellow focus:ring-2 focus:ring-kakao-yellow/20 dark:border-zinc-700"
          />
          <div className="flex items-center justify-between">
            {error ? (
              <p className="text-[12px] text-red-500 font-medium">{error}</p>
            ) : (
              <p className="text-[12px] text-subtext font-medium">
                소셜 프로필 이름이 미리 입력되어 있어요
              </p>
            )}
            <span className="text-[12px] text-subtext">{nickname.length}/12</span>
          </div>
        </div>

        {/* 소셜 계정 정보 표시 */}
        {session?.user?.email && (
          <div className="flex w-full items-center gap-3 rounded-2xl bg-gray-50 px-4 py-3 dark:bg-zinc-800/50">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-kakao-yellow/30 text-kakao-brown">
              <User size={14} />
            </div>
            <div className="flex flex-col">
              <span className="text-[12px] text-subtext font-medium">연결된 계정</span>
              <span className="text-[13px] font-bold text-foreground">{session.user.email}</span>
            </div>
          </div>
        )}

        {/* 다음 단계 버튼 */}
        <button
          onClick={handleSubmit}
          className="flex w-full items-center justify-center gap-2 rounded-[18px] bg-kakao-yellow py-4 text-[16px] font-bold text-kakao-brown transition-all hover:scale-[1.02] active:scale-95 shadow-sm mt-2"
        >
          다음: 재무 프로필 설정
          <ArrowRight size={18} />
        </button>
      </motion.div>
    </div>
  );
}
