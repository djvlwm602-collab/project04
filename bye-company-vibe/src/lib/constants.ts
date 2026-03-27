/**
 * 역할: 기본값, 피드백 문구, 스트레스 시나리오 등 상수 관리
 * 핵심 기능: DEFAULT_PROFILE, FIRE_MULTIPLIER, 피드백 문구, 스트레스 시나리오
 * 의존: types.ts
 */

import type { UserProfile, FeedbackItem, StressScenario } from "./types";

// 통계청 2024 기준 40대 맞벌이 딩크 가구 기본값
export const DEFAULT_PROFILE: UserProfile = {
  currentAssets: 400000000,
  monthlyIncome: 8000000,
  monthlyExpense: 3500000,
  investReturnRate: 0.06,
  targetExpense: 3500000,
};

export const FIRE_MULTIPLIER = 25;

export const SLIDER_MIN = -500000;
export const SLIDER_MAX = 500000;
export const SLIDER_STEP = 50000;

export const SAVING_FEEDBACKS: FeedbackItem[] = [
  {
    minAmount: 500000,
    label: "해외여행 적금",
    messages: [
      "올해 여행은 퇴직 후 세계일주로! 은퇴가 {months}개월 앞당겨집니다!",
      "비행기 값 아끼면 은퇴행 티켓이 {months}개월 빨라집니다!",
    ],
  },
  {
    minAmount: 300000,
    label: "골프 라운딩 1회",
    messages: [
      "필드 대신 퇴직금 필드를 채우세요! 은퇴 {months}개월 단축!",
      "스윙 대신 저축 스윙! 은퇴가 {months}개월 가까워집니다!",
    ],
  },
  {
    minAmount: 150000,
    label: "오마카세 1회",
    messages: [
      "오마카세 포기 = 은퇴 {months}개월 앞당김!",
      "오늘의 참치 대신 내일의 자유! {months}개월 단축!",
    ],
  },
  {
    minAmount: 100000,
    label: "배달 8회",
    messages: [
      "치킨 참으면 사표가 {months}개월 가까워집니다!",
      "배달 대신 자취 요리! 은퇴 {months}개월 앞당김!",
    ],
  },
  {
    minAmount: 50000,
    label: "커피 20잔",
    messages: [
      "아아 대신 물 마시면 은퇴가 {months}개월 빨라집니다!",
      "커피값 모으면 은퇴가 {months}개월 앞당겨져요!",
    ],
  },
];

export const SPENDING_FEEDBACKS: FeedbackItem[] = [
  {
    minAmount: 500000,
    label: "해외여행급 지출",
    messages: [
      "이 회사를 {months}개월 더 다녀야 합니다… 각오하세요!",
    ],
  },
  {
    minAmount: 300000,
    label: "큰 지출",
    messages: [
      "부장님 얼굴을 {months}개월 더 봐야 합니다…",
    ],
  },
  {
    minAmount: 100000,
    label: "중간 지출",
    messages: [
      "월요일 아침이 {months}개월 더 찾아옵니다…",
    ],
  },
  {
    minAmount: 50000,
    label: "소소한 지출",
    messages: [
      "소소하지만… 은퇴가 {months}개월 멀어집니다.",
    ],
  },
];

export const RESIST_CATEGORIES = [
  "외식/카페", "쇼핑", "구독 서비스", "택시/교통",
  "술/유흥", "충동구매", "기타",
] as const;

export const STRESS_SCENARIOS: StressScenario[] = [
  {
    id: "income-drop",
    name: "소득 30% 감소",
    emoji: "🔻",
    description: "권고사직, 이직, 연봉 삭감",
    apply: (p) => ({ ...p, monthlyIncome: p.monthlyIncome * 0.7 }),
  },
  {
    id: "return-drop",
    name: "투자 수익률 하락",
    emoji: "📉",
    description: "장기 침체, 하락장 (6% → 3%)",
    apply: (p) => ({ ...p, investReturnRate: 0.03 }),
  },
  {
    id: "expense-up",
    name: "생활비 50만 원 증가",
    emoji: "🔺",
    description: "의료비, 부모 부양, 반려동물 등",
    apply: (p) => ({ ...p, monthlyExpense: p.monthlyExpense + 500000 }),
  },
  {
    id: "target-up",
    name: "목표 생활비 상향",
    emoji: "💎",
    description: "은퇴 후 더 여유로운 생활 (350만 → 450만)",
    apply: (p) => ({ ...p, targetExpense: p.targetExpense + 1000000 }),
  },
  {
    id: "bonus",
    name: "보너스 2000만 원",
    emoji: "🎉",
    description: "성과급, 부동산 매각 등 일시적 유입",
    apply: (p) => ({ ...p, currentAssets: p.currentAssets + 20000000 }),
  },
  {
    id: "worst-case",
    name: "복합 위기",
    emoji: "🚨",
    description: "소득↓ + 지출↑ + 수익률↓ 동시 발생",
    apply: (p) => ({
      ...p,
      monthlyIncome: p.monthlyIncome * 0.7,
      monthlyExpense: p.monthlyExpense + 500000,
      investReturnRate: 0.03,
    }),
  },
];
