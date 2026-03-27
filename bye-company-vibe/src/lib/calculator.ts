/**
 * 역할: FIRE 은퇴 계산 로직 및 피드백 문구 선택
 * 핵심 기능: 복리 계산, 은퇴 개월 수, 피드백 문구 매칭
 * 의존: types.ts, constants.ts
 */

import type { UserProfile } from "./types";
import {
  FIRE_MULTIPLIER,
  SAVING_FEEDBACKS,
  SPENDING_FEEDBACKS,
} from "./constants";

// 목표 자금 계산: 은퇴 후 월 생활비 × 12 × 25(4% 룰)
export function calcTargetAmount(targetExpense: number): number {
  return targetExpense * 12 * FIRE_MULTIPLIER;
}

// 월 저축액 계산
export function calcMonthlySaving(profile: UserProfile): number {
  return profile.monthlyIncome - profile.monthlyExpense;
}

// 복리 기반 FIRE 도달 개월 수 계산
// 최대 600개월(50년) 제한으로 무한 루프 방지
export function calculateMonthsToFIRE(
  assets: number,
  monthlySaving: number,
  target: number,
  annualRate: number
): number {
  const monthlyRate = annualRate / 12;
  let current = assets;
  let months = 0;

  if (current >= target) return 0;
  if (monthlySaving <= 0 && monthlyRate <= 0) return 600;

  while (current < target && months < 600) {
    current = current * (1 + monthlyRate) + monthlySaving;
    months++;
  }
  return months;
}

// UserProfile 기반 은퇴 개월 수 한번에 계산
export function calcMonthsFromProfile(
  profile: UserProfile,
  extraSaving: number = 0
): number {
  const target = calcTargetAmount(profile.targetExpense);
  const saving = calcMonthlySaving(profile) + extraSaving;
  return calculateMonthsToFIRE(
    profile.currentAssets,
    saving,
    target,
    profile.investReturnRate
  );
}

// 슬라이더 피드백 문구 선택 (금액 구간 매칭 + 랜덤)
export function getSliderFeedback(
  sliderValue: number,
  monthDiff: number
): string {
  if (sliderValue === 0) {
    return "현재 페이스로 훌륭하게 저축하고 계십니다! 부장님 면전에 사표 던질 날이 머지않았습니다.";
  }

  const absValue = Math.abs(sliderValue);
  const absDiff = Math.abs(monthDiff);
  const feedbacks = sliderValue > 0 ? SAVING_FEEDBACKS : SPENDING_FEEDBACKS;

  // 금액에 맞는 피드백 항목 찾기 (내림차순이므로 첫 번째 매칭)
  const matched = feedbacks.find((f) => absValue >= f.minAmount);
  if (!matched) return "";

  const msg = matched.messages[Math.floor(Math.random() * matched.messages.length)];
  return msg.replace("{months}", String(absDiff));
}

// 개월 수 → 예상 날짜 문자열 변환
export function formatProjectedDate(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
}
