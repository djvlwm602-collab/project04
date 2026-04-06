/**
 * 역할: 스트레스/보너스 시나리오 토글 후 은퇴일 변화를 실시간으로 확인하는 시뮬레이터 페이지
 * 핵심 기능: 시나리오 다중 선택, 기본 vs 시나리오 적용 은퇴 개월 수 비교, 애니메이션 입장
 * 의존: lib/types, lib/constants, lib/calculator, lib/storage, next-auth
 */

"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import type { UserProfile } from "@/lib/types";
import { STRESS_SCENARIOS } from "@/lib/constants";
import { calcMonthsFromProfile, formatProjectedDate } from "@/lib/calculator";
import { loadProfile, isSetupDone } from "@/lib/storage";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function StressTestPage() {
  const router = useRouter();
  const { status } = useSession();

  // 프로필 로드 상태 (null = 로딩 중)
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // 활성화된 시나리오 ID 집합 (다중 선택 지원)
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set());

  // 미인증 시 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
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

  // 기본 은퇴 개월 수 (시나리오 미적용)
  const baseMonths = useMemo(() => {
    if (!profile) return 0;
    return calcMonthsFromProfile(profile);
  }, [profile]);

  // 시나리오 적용: 각 active 시나리오의 apply 함수를 순차 적용
  const stressedProfile = useMemo(() => {
    if (!profile) return null;
    let result = { ...profile };
    for (const scenario of STRESS_SCENARIOS) {
      if (activeIds.has(scenario.id)) {
        result = scenario.apply(result);
      }
    }
    return result;
  }, [profile, activeIds]);

  // 시나리오 적용 후 은퇴 개월 수
  const stressedMonths = useMemo(() => {
    if (!stressedProfile) return 0;
    return calcMonthsFromProfile(stressedProfile);
  }, [stressedProfile]);

  // 개월 수 차이 (양수 = 늘어남, 음수 = 단축)
  const monthDiff = stressedMonths - baseMonths;

  // 시나리오 카드 토글 핸들러
  const handleToggle = (id: string) => {
    setActiveIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // 전체 초기화
  const handleReset = () => setActiveIds(new Set());

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
      {/* 상단 헤더 — 뒤로가기 + 타이틀 */}
      <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex h-9 w-9 items-center justify-center rounded-full text-subtext transition-colors hover:bg-gray-100"
            aria-label="대시보드로 돌아가기"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-extrabold tracking-tight">스트레스 테스트</h1>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 flex-col items-center p-6 sm:p-10">
        <div className="w-full max-w-md space-y-6">

          {/* 비교 카드 — 기본 vs 시나리오 적용 은퇴일 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[32px] bg-card p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)]"
          >
            <div className="mb-5 flex items-center gap-2">
              <ShieldAlert size={22} className="text-kakao-brown" />
              <h2 className="text-[17px] font-extrabold">시나리오 비교</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* 현재 예상 */}
              <div className="flex flex-col items-center gap-1 rounded-2xl bg-gray-50 p-4">
                <span className="text-[12px] font-bold text-subtext">현재 예상</span>
                <span className="text-[22px] font-black text-foreground">{baseMonths}개월</span>
                <span className="text-[13px] font-bold text-subtext">{formatProjectedDate(baseMonths)}</span>
              </div>

              {/* 시나리오 적용 */}
              <div className="flex flex-col items-center gap-1 rounded-2xl bg-kakao-yellow/10 border border-transparent p-4">
                <span className="text-[12px] font-bold text-subtext">시나리오 적용</span>
                <span className="text-[22px] font-black text-foreground">{stressedMonths}개월</span>
                <span className="text-[13px] font-bold text-subtext">{formatProjectedDate(stressedMonths)}</span>
              </div>
            </div>

            {/* 차이 표시 — 선택된 시나리오가 있을 때만 표시 */}
            {activeIds.size > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4"
              >
                {stressedMonths >= 600 ? (
                  /* 50년 내 은퇴 불가 경고 */
                  <div className="flex items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-[14px] font-bold text-red-600">
                    <ShieldAlert size={16} />
                    50년 내 은퇴가 어렵습니다
                  </div>
                ) : monthDiff > 0 ? (
                  /* 은퇴일이 늘어난 경우 — 빨간색 경고 */
                  <div className="rounded-2xl bg-red-50 px-4 py-3 text-center text-[14px] font-bold text-red-600">
                    +{monthDiff}개월 늘어남
                  </div>
                ) : monthDiff < 0 ? (
                  /* 은퇴일이 단축된 경우 — 파란색 축하 */
                  <div className="rounded-2xl bg-blue-50 px-4 py-3 text-center text-[14px] font-bold text-blue-600">
                    {Math.abs(monthDiff)}개월 단축!
                  </div>
                ) : (
                  /* 변화 없음 */
                  <div className="rounded-2xl bg-gray-100 px-4 py-3 text-center text-[14px] font-bold text-subtext">
                    변화 없음
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>

          {/* 시나리오 목록 헤더 + 전체 초기화 버튼 */}
          <div className="flex items-center justify-between px-1">
            <p className="text-[14px] font-bold text-subtext">시나리오를 선택해 영향을 확인하세요</p>
            {activeIds.size > 0 && (
              <button
                onClick={handleReset}
                className="text-[13px] font-bold text-subtext underline underline-offset-2 transition-opacity hover:opacity-70"
              >
                전체 초기화
              </button>
            )}
          </div>

          {/* 시나리오 카드 목록 — Framer Motion 스태거 입장 */}
          <div className="flex flex-col gap-3">
            {STRESS_SCENARIOS.map((scenario, i) => {
              const isActive = activeIds.has(scenario.id);
              return (
                <motion.button
                  key={scenario.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => handleToggle(scenario.id)}
                  className={`flex w-full items-center gap-4 rounded-[24px] border-2 p-5 text-left transition-all active:scale-[0.98] ${
                    isActive
                      ? "border-kakao-yellow bg-kakao-yellow/20"
                      : "border-transparent bg-card shadow-[0_4px_16px_rgb(0,0,0,0.05)]"
                  }`}
                >
                  {/* 선택 여부 표시 원형 인디케이터 */}
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      isActive
                        ? "border-kakao-brown bg-kakao-brown"
                        : "border-gray-300 bg-transparent"
                    }`}
                  >
                    {isActive && (
                      <div className="h-2.5 w-2.5 rounded-full bg-white" />
                    )}
                  </div>

                  {/* 이모지 */}
                  <span className="text-[28px] leading-none">{scenario.emoji}</span>

                  {/* 이름 + 설명 */}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[15px] font-extrabold text-foreground">{scenario.name}</span>
                    <span className="text-[13px] font-medium text-subtext">{scenario.description}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>

        </div>
      </main>
    </div>
  );
}
