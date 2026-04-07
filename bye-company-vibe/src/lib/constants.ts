/**
 * 역할: 기본값, 등급 임계값, T형 경고 문구 상수 관리
 * 핵심 기능: DEFAULT_PROFILE, GRADE_THRESHOLDS, T_WARNINGS
 * 의존: types.ts
 */

import type { UserProfile, RetirementGrade } from "./types";

export const DEFAULT_PROFILE: UserProfile = {
  liquidAssets: 50000000,      // 5,000만원
  monthlySavings: 1000000,     // 100만원
  investReturnRate: 0.06,      // 6%
  retirementYears: 10,         // 10년
  monthlyExpense: 2000000,     // 200만원
  retirementPlan: "",
};

// 은퇴 자금이 몇 년을 버티는지에 따른 등급
export const GRADE_THRESHOLDS: Record<RetirementGrade, number> = {
  S: 35,   // 35년 이상 버팀 → "지금 당장 사표"
  A: 20,   // 20~35년 → "조만간 짐 싸도 됩니다"
  B: 10,   // 10~20년 → "굶고 사세요"
  C: 0,    // 10년 미만 → "죽기 전날까지 출근"
};

export const GRADE_META: Record<RetirementGrade, {
  label: string;
  caption: string;
  color: string;
  bg: string;
}> = {
  S: {
    label: "지금 당장 사표 던지세요",
    caption: "지옥 탈출 성공. 난 먼저 간다, 니들은 알아서 버텨라. ㅃㅇ",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  A: {
    label: "조만간 짐 싸셔도 됩니다",
    caption: "내 해방일은 20XX년. 이 회사 사람들 얼굴 볼 날도 얼마 안 남았다.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  B: {
    label: "은퇴는 되는데 굶고 사세요",
    caption: "탈출은 하는데... 은퇴 후에 물만 마셔야 함. 이게 맞냐?",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  C: {
    label: "죽기 전날까지 출근하세요",
    caption: "내 은퇴일: 계산 불가. 난 그냥 회사의 부품이었음",
    color: "text-red-600",
    bg: "bg-red-50",
  },
};

// Q3 수익률 실시간 T형 경고 문구
export const RETURN_RATE_WARNINGS: Array<{ threshold: number; message: string }> = [
  { threshold: 0.3, message: "마법사인가요? 워렌 버핏도 연 20%입니다." },
  { threshold: 0.2, message: "코인 트레이더십니까? 계좌가 증명하는 숫자를 쓰세요." },
  { threshold: 0.15, message: "희망 회로 작동 중. 현실적으로 조정하세요." },
  { threshold: 0.1, message: "공격적이네요. S&P500 장기 평균은 10%입니다." },
];

// Q2 저축 대비 실시간 T형 코멘트
export const SAVINGS_COMMENTS: Array<{ threshold: number; message: string }> = [
  { threshold: 3000000, message: "월 300만 이상? 진짜입니까. 우상향 확정." },
  { threshold: 1000000, message: "월 100만 이상. 평균은 넘겼습니다." },
  { threshold: 300000, message: "월 30만... 이 속도면 은퇴가 묘지에서 가능합니다." },
  { threshold: 0, message: "0원? 지금 당장 고정비를 점검하세요." },
];

// 분석 로딩 화면 텍스트 시퀀스
export const ANALYZING_TEXTS = [
  "3만 가지 파산 시나리오 분석 중...",
  "월급날과 카드값 비교 분석 중...",
  "부장님 얼굴 볼 날 수 카운팅 중...",
  "현실 직시 데이터 컴파일 중...",
  "퇴사 가능일 시뮬레이션 완료.",
];
