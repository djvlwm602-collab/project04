/**
 * 역할: 프로젝트 전역에서 사용하는 타입 정의
 * 핵심 기능: UserProfile, ResistRecord, FeedbackItem, StressScenario
 * 의존: 없음
 */

export interface UserProfile {
  currentAssets: number;      // 현재 자산 (원)
  monthlyIncome: number;      // 월 소득 (원)
  monthlyExpense: number;     // 월 생활비 (원)
  investReturnRate: number;   // 연 투자 수익률 (0.06 = 6%)
  targetExpense: number;      // 은퇴 후 월 생활비 (원)
}

export interface ResistRecord {
  id: string;
  amount: number;             // 참은 금액 (원)
  category: string;           // 카테고리
  savedDays: number;          // 앞당겨진 은퇴 일수
  createdAt: string;          // ISO 날짜 문자열
}

export interface FeedbackItem {
  minAmount: number;       // 이 금액 이상일 때 매칭
  label: string;           // 항목명
  messages: string[];      // 랜덤 선택할 문구 배열 ({months}는 실제 개월 수로 치환)
}

export interface StressScenario {
  id: string;
  name: string;
  emoji: string;
  description: string;
  apply: (profile: UserProfile) => UserProfile;
}
