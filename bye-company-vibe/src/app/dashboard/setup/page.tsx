/**
 * 역할: 최초 진입 시 재무 프로필 입력 온보딩 페이지 (설정 변경 시에도 재사용)
 * 핵심 기능: 5개 재무 입력 필드, 실시간 월 저축 미리보기, 프로필 저장 후 대시보드 이동
 * 의존: storage.ts, types.ts, constants.ts
 */
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Coins, TrendingUp, Wallet, PiggyBank, Target } from "lucide-react";
import type { UserProfile } from "@/lib/types";
import { saveProfile, markSetupDone, loadProfile } from "@/lib/storage";

// 필드 설정: 아이콘, 라벨, 설명, 단위, 스텝을 한 곳에서 관리
const FIELD_CONFIG = [
  {
    key: "currentAssets" as keyof UserProfile,
    label: "현재 총 자산",
    description: "예적금 + 투자금 + 부동산 등 순자산 합계",
    Icon: Coins,
    unit: "만원",
    step: 1000,
    isPercent: false,
  },
  {
    key: "monthlyIncome" as keyof UserProfile,
    label: "월 합산 소득",
    description: "부부 합산 세후 월급",
    Icon: Wallet,
    unit: "만원",
    step: 50,
    isPercent: false,
  },
  {
    key: "monthlyExpense" as keyof UserProfile,
    label: "월 생활비",
    description: "고정비 + 변동비 합계 (저축 제외)",
    Icon: PiggyBank,
    unit: "만원",
    step: 50,
    isPercent: false,
  },
  {
    key: "targetExpense" as keyof UserProfile,
    label: "은퇴 후 월 생활비",
    description: "은퇴 후 매달 필요한 예상 생활비",
    Icon: Target,
    unit: "만원",
    step: 50,
    isPercent: false,
  },
  {
    key: "investReturnRate" as keyof UserProfile,
    label: "연 투자 수익률",
    description: "장기 투자 예상 연 수익률",
    Icon: TrendingUp,
    unit: "%",
    step: 0.5,
    isPercent: true,
  },
];

// 원 → 만원 변환 (표시용)
function toMan(won: number): number {
  return won / 10000;
}

// 만원 → 원 변환 (저장용)
function toWon(man: number): number {
  return man * 10000;
}

// 소수점 불필요 시 정수로 표시
function formatInputValue(profile: UserProfile, key: keyof UserProfile, isPercent: boolean): string {
  const raw = profile[key];
  if (isPercent) {
    // 0.06 → 6
    const percent = raw * 100;
    return String(percent % 1 === 0 ? percent : parseFloat(percent.toFixed(1)));
  }
  const man = toMan(raw);
  return String(man % 1 === 0 ? man : parseFloat(man.toFixed(1)));
}

export default function SetupPage() {
  const router = useRouter();
  // 재진입 시 기존 프로필을 불러오고, 최초 방문 시 DEFAULT_PROFILE 반환
  const [profile, setProfile] = useState<UserProfile>(() => loadProfile());

  const monthlySaving = profile.monthlyIncome - profile.monthlyExpense;

  // 입력값 변경 처리 — 표시 단위(만원/%)를 내부 단위(원/소수)로 역변환
  const handleChange = (key: keyof UserProfile, isPercent: boolean, value: string) => {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) return;

    const internalValue = isPercent
      ? parsed / 100   // % → 소수 (6 → 0.06)
      : toWon(parsed); // 만원 → 원

    setProfile((prev) => ({ ...prev, [key]: internalValue }));
  };

  // 제출: 프로필 저장 + 온보딩 완료 표시 + 대시보드 이동
  const handleSubmit = () => {
    if (monthlySaving <= 0) return;
    saveProfile(profile);
    markSetupDone();
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* 헤더 */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            재무 프로필 설정
          </h1>
          <p className="mt-2 text-sm text-subtext">
            정확할수록 은퇴 D-Day가 정밀해집니다
          </p>
        </div>

        {/* 입력 필드 카드 목록 — stagger 애니메이션 */}
        <div className="flex flex-col gap-4">
          {FIELD_CONFIG.map(({ key, label, description, Icon, unit, step, isPercent }, idx) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + idx * 0.08, ease: "easeOut" }}
              className="rounded-2xl bg-card p-5 shadow-[0_4px_16px_rgb(0,0,0,0.04)] dark:shadow-[0_4px_16px_rgb(0,0,0,0.15)]"
            >
              <div className="flex items-start gap-4">
                {/* 아이콘 */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-kakao-yellow text-kakao-brown">
                  <Icon size={20} />
                </div>

                {/* 라벨 + 입력 */}
                <div className="flex flex-1 flex-col gap-2">
                  <div>
                    <p className="text-sm font-bold text-foreground">{label}</p>
                    <p className="text-xs text-subtext mt-0.5">{description}</p>
                  </div>

                  {/* 숫자 입력 + 단위 */}
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      step={step}
                      min={0}
                      value={formatInputValue(profile, key, isPercent)}
                      onChange={(e) => handleChange(key, isPercent, e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-background px-3 py-2 text-right text-sm font-semibold text-foreground outline-none focus:border-kakao-brown focus:ring-1 focus:ring-kakao-brown dark:border-zinc-700 transition"
                    />
                    <span className="shrink-0 text-sm font-medium text-subtext">{unit}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 월 저축 미리보기 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="mt-6 rounded-2xl bg-card px-5 py-4 shadow-[0_4px_16px_rgb(0,0,0,0.04)] dark:shadow-[0_4px_16px_rgb(0,0,0,0.15)]"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-subtext">예상 월 저축액 (소득 − 생활비)</p>
            <p
              className={`text-lg font-extrabold ${
                monthlySaving > 0 ? "text-foreground" : "text-red-500"
              }`}
            >
              {toMan(monthlySaving).toLocaleString()}만원
            </p>
          </div>
          {/* 저축액이 0 이하일 때 경고 메시지 */}
          {monthlySaving <= 0 && (
            <p className="mt-1.5 text-xs text-red-500">
              월 저축액이 0 이하이면 은퇴 시뮬레이션을 시작할 수 없어요. 소득과 생활비를 다시 확인해 주세요.
            </p>
          )}
        </motion.div>

        {/* 제출 버튼 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          className="mt-6"
        >
          <button
            onClick={handleSubmit}
            disabled={monthlySaving <= 0}
            className="w-full rounded-[18px] bg-kakao-yellow py-4 text-[16px] font-bold text-kakao-brown transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            은퇴 D-Day 계산 시작하기
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
