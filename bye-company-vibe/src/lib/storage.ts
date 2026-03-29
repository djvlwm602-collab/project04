/**
 * 역할: localStorage 읽기/쓰기 래퍼 (SSR 안전)
 * 핵심 기능: UserProfile CRUD, ResistRecord CRUD, 온보딩 상태
 * 의존: types.ts, constants.ts
 */

import type { UserProfile, ResistRecord, UserNickname } from "./types";
import { DEFAULT_PROFILE } from "./constants";

const PROFILE_KEY = "bye-company-profile";
const RESIST_KEY = "bye-company-resist-records";
const SETUP_DONE_KEY = "bye-company-setup-done";
const NICKNAME_KEY = "bye-company-nickname";
const SIGNUP_DONE_KEY = "bye-company-signup-done";

// --- UserProfile ---

export function loadProfile(): UserProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(profile: UserProfile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

// --- 온보딩 완료 여부 ---

export function isSetupDone(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SETUP_DONE_KEY) === "true";
}

export function markSetupDone(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETUP_DONE_KEY, "true");
}

// --- ResistRecord ---

export function loadResistRecords(): ResistRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RESIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // localStorage 데이터 무결성 검증
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveResistRecord(record: ResistRecord): void {
  if (typeof window === "undefined") return;
  const records = loadResistRecords();
  records.unshift(record);
  localStorage.setItem(RESIST_KEY, JSON.stringify(records));
}

// 참기 기록 통계: 총 절약 금액, 총 앞당긴 일수
export function getResistStats(): { totalAmount: number; totalDays: number; count: number } {
  const records = loadResistRecords();
  return {
    totalAmount: records.reduce((sum, r) => sum + r.amount, 0),
    totalDays: records.reduce((sum, r) => sum + r.savedDays, 0),
    count: records.length,
  };
}

// --- 닉네임/프로필 ---

export function loadNickname(): UserNickname | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(NICKNAME_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveNickname(data: UserNickname): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(NICKNAME_KEY, JSON.stringify(data));
}

// --- 회원가입 완료 여부 (닉네임 설정까지 마친 상태) ---

export function isSignupDone(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SIGNUP_DONE_KEY) === "true";
}

export function markSignupDone(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SIGNUP_DONE_KEY, "true");
}

// 로그아웃 시 사용자 데이터 정리 — 세션과 로컬 데이터 동시 제거
export function clearUserData(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(RESIST_KEY);
  localStorage.removeItem(SETUP_DONE_KEY);
  localStorage.removeItem(NICKNAME_KEY);
  localStorage.removeItem(SIGNUP_DONE_KEY);
}
