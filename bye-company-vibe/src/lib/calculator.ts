/**
 * 역할: 은퇴 계산 로직 — 적립기(복리) + 인출기(소진) 2단계
 * 핵심 기능: 적립 자산 계산, 파산 시점 계산, 등급 판정, 슬로프 데이터 생성
 * 의존: types.ts, constants.ts
 */

import type { UserProfile, RetirementGrade, AssetDataPoint } from "./types";
import { GRADE_THRESHOLDS, RETURN_RATE_WARNINGS, SAVINGS_COMMENTS } from "./constants";

// ── 적립기: 은퇴 시점의 자산 계산 ─────────────────────────
// 현재 자산 + 매월 저축 + 복리 수익률로 retirementYears년 후 자산 계산
export function calcAssetsAtRetirement(profile: UserProfile): number {
  const monthlyRate = profile.investReturnRate / 12;
  const months = profile.retirementYears * 12;
  let assets = profile.liquidAssets;

  for (let i = 0; i < months; i++) {
    assets = assets * (1 + monthlyRate) + profile.monthlySavings;
  }
  return assets;
}

// ── 인출기: 은퇴 자금이 몇 년을 버티는지 계산 ────────────────
// 은퇴 자금에서 매월 생활비를 빼되 잔여 자산은 계속 복리 운용
// 최대 100년으로 상한 처리
export function calcSurvivalYears(profile: UserProfile): number {
  const retirementAssets = calcAssetsAtRetirement(profile);
  const monthlyRate = profile.investReturnRate / 12;
  let assets = retirementAssets;
  let months = 0;

  while (assets > 0 && months < 1200) {
    assets = assets * (1 + monthlyRate) - profile.monthlyExpense;
    months++;
  }
  return Math.floor(months / 12);
}

// ── 등급 판정 ──────────────────────────────────────────────
export function calcGrade(profile: UserProfile): RetirementGrade {
  const years = calcSurvivalYears(profile);
  if (years >= GRADE_THRESHOLDS.S) return "S";
  if (years >= GRADE_THRESHOLDS.A) return "A";
  if (years >= GRADE_THRESHOLDS.B) return "B";
  return "C";
}

// ── D-Day (일 단위) ────────────────────────────────────────
export function calcDDay(profile: UserProfile): number {
  return Math.round(profile.retirementYears * 365);
}

// ── 남은 월요일 수 ────────────────────────────────────────
export function calcMondaysLeft(profile: UserProfile): number {
  return Math.round(profile.retirementYears * 52);
}

// ── 현재 자산으로 버틸 수 있는 일 수 ──────────────────────
export function calcSurvivalDays(profile: UserProfile): number {
  if (profile.monthlyExpense <= 0) return 0;
  const dailyExpense = profile.monthlyExpense / 30;
  return Math.floor(profile.liquidAssets / dailyExpense);
}

// ── 파산 슬로프 차트 데이터 생성 ──────────────────────────
// 적립기: 0 ~ retirementYears (연 단위 포인트)
// 인출기: 이후 파산 시점까지 (연 단위 포인트, 최대 50년)
export function calcSlopeData(profile: UserProfile): AssetDataPoint[] {
  const points: AssetDataPoint[] = [];
  const monthlyRate = profile.investReturnRate / 12;

  // 적립기
  let assets = profile.liquidAssets;
  points.push({ label: "현재", assets, phase: "accumulation" });

  for (let year = 1; year <= profile.retirementYears; year++) {
    for (let m = 0; m < 12; m++) {
      assets = assets * (1 + monthlyRate) + profile.monthlySavings;
    }
    points.push({
      label: year === profile.retirementYears ? "은퇴" : `${year}년`,
      assets: Math.round(assets),
      phase: "accumulation",
    });
  }

  // 인출기 (최대 50년)
  for (let year = 1; year <= 50; year++) {
    for (let m = 0; m < 12; m++) {
      assets = assets * (1 + monthlyRate) - profile.monthlyExpense;
      if (assets <= 0) {
        points.push({
          label: `은퇴+${year}년`,
          assets: 0,
          phase: "drawdown",
        });
        return points;
      }
    }
    points.push({
      label: `은퇴+${year}년`,
      assets: Math.round(assets),
      phase: "drawdown",
    });
  }

  return points;
}

// ── 은퇴 예정일 포맷 ────────────────────────────────────────
export function formatRetirementDate(profile: UserProfile): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + profile.retirementYears);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
}

// ── Q3 수익률 실시간 경고 문구 ─────────────────────────────
export function getReturnRateWarning(rate: number): string | null {
  const match = RETURN_RATE_WARNINGS.find((w) => rate >= w.threshold);
  return match?.message ?? null;
}

// ── Q2 저축액 실시간 코멘트 ────────────────────────────────
export function getSavingsComment(amount: number): string | null {
  const match = SAVINGS_COMMENTS.find((c) => amount >= c.threshold);
  return match?.message ?? null;
}
