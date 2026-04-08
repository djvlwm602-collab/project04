/**
 * 역할: localStorage 읽기/쓰기 래퍼 (SSR 안전)
 * 핵심 기능: UserProfile CRUD, 온보딩 상태, 서바이벌 킷 CRUD
 * 의존: types.ts, constants.ts
 */

import type {
  UserProfile, UserNickname,
  DeathNoteEntry, ResignationLetter, RoutineItem
} from "./types";
import { DEFAULT_PROFILE } from "./constants";

const PROFILE_KEY       = "bce-profile-v2";       // v2: 새 데이터 모델
const SETUP_DONE_KEY    = "bce-setup-done";
const NICKNAME_KEY      = "bce-nickname";
const SIGNUP_DONE_KEY   = "bce-signup-done";
const DEATH_NOTE_KEY    = "bce-death-note";
const RESIGNATION_KEY   = "bce-resignation";
const ROUTINE_KEY       = "bce-routine";

// ── UserProfile ────────────────────────────────────────────

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

// ── 온보딩 완료 여부 ────────────────────────────────────────

export function isSetupDone(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SETUP_DONE_KEY) === "true";
}

export function markSetupDone(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETUP_DONE_KEY, "true");
}

export function isSignupDone(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SIGNUP_DONE_KEY) === "true";
}

export function markSignupDone(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SIGNUP_DONE_KEY, "true");
}

// ── 닉네임/프로필 ────────────────────────────────────────────

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

// ── 데스노트 ────────────────────────────────────────────────

export function loadDeathNote(): DeathNoteEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DEATH_NOTE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addDeathNoteEntry(entry: DeathNoteEntry): void {
  if (typeof window === "undefined") return;
  const entries = loadDeathNote();
  entries.unshift(entry);
  localStorage.setItem(DEATH_NOTE_KEY, JSON.stringify(entries));
}

export function deleteDeathNoteEntry(id: string): void {
  if (typeof window === "undefined") return;
  const entries = loadDeathNote().filter((e) => e.id !== id);
  localStorage.setItem(DEATH_NOTE_KEY, JSON.stringify(entries));
}

// ── 사직서 ────────────────────────────────────────────────

export function loadResignation(): ResignationLetter | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(RESIGNATION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveResignation(letter: ResignationLetter): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(RESIGNATION_KEY, JSON.stringify(letter));
}

// ── 은퇴 후 일과 ──────────────────────────────────────────

export function loadRoutine(): RoutineItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ROUTINE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRoutine(items: RoutineItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ROUTINE_KEY, JSON.stringify(items));
}

// ── 회원탈퇴 시 전체 초기화 ─────────────────────────────────
// 일반 로그아웃은 localStorage를 건드리지 않음 (재로그인 시 대시보드 직행)
// 회원탈퇴만 모든 데이터를 삭제해 다음 로그인 시 처음부터 시작

export function clearUserData(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(SETUP_DONE_KEY);
  localStorage.removeItem(NICKNAME_KEY);
  localStorage.removeItem(SIGNUP_DONE_KEY);
  localStorage.removeItem(DEATH_NOTE_KEY);
  localStorage.removeItem(RESIGNATION_KEY);
  localStorage.removeItem(ROUTINE_KEY);
}
