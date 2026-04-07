/**
 * 역할: 프로젝트 전역에서 사용하는 타입 정의
 * 핵심 기능: UserProfile (6문 6답), 서바이벌 킷 타입
 * 의존: 없음
 */

// 6문 6답으로 수집하는 재무 프로필
export interface UserProfile {
  liquidAssets: number;       // Q1 즉시 동원 가능한 현금 (원)
  monthlySavings: number;     // Q2 월 순저축액 (원)
  investReturnRate: number;   // Q3 연 투자 수익률 (0.06 = 6%)
  retirementYears: number;    // Q4 은퇴까지 남은 연수
  monthlyExpense: number;     // Q5 은퇴 후 월 생활비 (원)
  retirementPlan: string;     // Q6 퇴사 후 계획 (주관식)
}

export type RetirementGrade = "S" | "A" | "B" | "C";

// 파산 슬로프 차트용 데이터 포인트
export interface AssetDataPoint {
  label: string;    // "현재", "3년 후", "은퇴", "+10년" 등
  assets: number;   // 해당 시점 자산 (원)
  phase: "accumulation" | "drawdown"; // 적립기 / 인출기
}

// 데스노트 항목
export interface DeathNoteEntry {
  id: string;
  name: string;       // 이름/별명
  reason: string;     // 이유
  createdAt: string;  // ISO 날짜 문자열
}

// 사직서
export interface ResignationLetter {
  recipient: string;    // 수신인 (예: "OOO 대표이사 귀중")
  content: string;      // 본문
  updatedAt: string;    // 마지막 수정 ISO 날짜
}

// 은퇴 후 일과 항목
export interface RoutineItem {
  id: string;
  startHour: number;    // 0~23
  durationHours: number; // 1~24
  activity: string;      // 활동명
  color: string;         // hex 색상
}

export interface UserNickname {
  nickname: string;
  profileImage?: string;
}
