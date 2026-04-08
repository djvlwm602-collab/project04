/**
 * 역할: 은퇴 후 일과 작성 + 원형 시각화
 * 핵심 기능: 시작 시각/길이/활동 입력, RoutineWheel SVG, 자동 색상/이모지, localStorage 저장
 * 의존: lib/storage, lib/types, RoutineWheel
 */
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import type { RoutineItem } from "@/lib/types";
import { loadRoutine, saveRoutine } from "@/lib/storage";
import { RoutineWheel } from "@/components/RoutineWheel";

// ── 카테고리별 색상 팔레트 ──────────────────────────────────────
const CATEGORY_COLORS: Record<string, string[]> = {
  meal:     ["#fb923c", "#f97316", "#fdba74"],
  exercise: ["#22c55e", "#4ade80", "#86efac"],
  sleep:    ["#818cf8", "#6366f1", "#a5b4fc"],
  read:     ["#38bdf8", "#0ea5e9", "#7dd3fc"],
  leisure:  ["#ec4899", "#f472b6", "#f9a8d4"],
};
const OTHER_COLORS = ["#FEE500", "#f59e0b", "#8b5cf6", "#14b8a6", "#f43f5e", "#64748b", "#a78bfa"];

function detectCategory(activity: string): string {
  const s = activity.toLowerCase();
  if (/아침|점심|저녁|식사|밥|조식|중식|석식|브런치|먹|카페|커피/.test(s)) return "meal";
  if (/운동|헬스|러닝|달리기|요가|수영|자전거|등산|배드민턴|테니스/.test(s)) return "exercise";
  if (/수면|취침|잠|낮잠/.test(s)) return "sleep";
  if (/독서|책|공부|학습|강의/.test(s)) return "read";
  if (/산책|여행|취미|그림|음악|영화|드라마|게임|쇼핑|친구|가족/.test(s)) return "leisure";
  return "other";
}

// 활동명 → 이모지 매핑
function getEmoji(activity: string): string {
  const s = activity.toLowerCase();
  if (/아침|조식/.test(s)) return "🌅";
  if (/점심|중식/.test(s)) return "🍱";
  if (/저녁|석식/.test(s)) return "🌙";
  if (/브런치/.test(s)) return "🥞";
  if (/식사|밥|먹/.test(s)) return "🍽️";
  if (/카페|커피/.test(s)) return "☕";
  if (/러닝|달리기/.test(s)) return "🏃";
  if (/요가|명상/.test(s)) return "🧘";
  if (/수영/.test(s)) return "🏊";
  if (/자전거/.test(s)) return "🚴";
  if (/등산/.test(s)) return "🏔️";
  if (/운동|헬스/.test(s)) return "💪";
  if (/낮잠/.test(s)) return "💤";
  if (/수면|취침|잠/.test(s)) return "😴";
  if (/독서|책/.test(s)) return "📚";
  if (/공부|학습|강의/.test(s)) return "✏️";
  if (/산책|걷기/.test(s)) return "🚶";
  if (/여행/.test(s)) return "✈️";
  if (/음악|노래/.test(s)) return "🎵";
  if (/그림|미술/.test(s)) return "🎨";
  if (/영화|드라마/.test(s)) return "🎬";
  if (/게임/.test(s)) return "🎮";
  if (/쇼핑/.test(s)) return "🛍️";
  if (/친구|모임/.test(s)) return "👥";
  if (/가족/.test(s)) return "👨‍👩‍👧";
  if (/청소/.test(s)) return "🧹";
  if (/요리/.test(s)) return "👨‍🍳";
  return "⭐";
}

// 카테고리 안에서 기존 항목 수 기준으로 색상 순환 배정
function autoColor(activity: string, existingItems: RoutineItem[]): string {
  const cat = detectCategory(activity);
  if (cat === "other") {
    const usedColors = new Set(existingItems.map((i) => i.color));
    return OTHER_COLORS.find((c) => !usedColors.has(c)) ?? OTHER_COLORS[existingItems.length % OTHER_COLORS.length];
  }
  const palette = CATEGORY_COLORS[cat];
  const sameCount = existingItems.filter((i) => detectCategory(i.activity) === cat).length;
  return palette[sameCount % palette.length];
}

export default function RoutinePage() {
  const router = useRouter();
  const { status } = useSession();
  const [items, setItems] = useState<RoutineItem[]>([]);
  const [form, setForm] = useState({ startHour: 6, durationHours: 1, activity: "" });

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  useEffect(() => {
    setItems(loadRoutine());
  }, []);

  const totalHours = items.reduce((sum, i) => sum + i.durationHours, 0);
  const remainingHours = 24 - totalHours;

  const handleAdd = () => {
    const trimActivity = form.activity.trim();
    if (!trimActivity) return;
    if (form.durationHours < 1 || form.durationHours > remainingHours) return;

    const newItem: RoutineItem = {
      id: Date.now().toString(),
      startHour: form.startHour,
      durationHours: form.durationHours,
      activity: trimActivity,
      color: autoColor(trimActivity, items),
      emoji: getEmoji(trimActivity),
    };
    const updated = [...items, newItem].sort((a, b) => a.startHour - b.startHour);
    setItems(updated);
    saveRoutine(updated);
    // 입력 초기화 — activity 먼저 비워서 Enter 이중 호출 방지
    setForm((f) => ({ ...f, activity: "", startHour: Math.min(23, f.startHour + f.durationHours) }));
  };

  const handleDelete = (id: string) => {
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    saveRoutine(updated);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F5F7]">
      <header className="flex h-16 items-center gap-3 px-6">
        <button onClick={() => router.back()} className="text-subtext hover:text-foreground transition-colors">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-extrabold">☀️ 은퇴 후 일과</h1>
      </header>

      <main className="flex flex-1 flex-col items-center p-5 gap-5">
        <div className="w-full max-w-md flex flex-col gap-5">
          {/* 원형 일과표 */}
          <div className="flex flex-col items-center gap-2 rounded-[24px] bg-white p-6 shadow-[0_2px_20px_rgb(0,0,0,0.06)]">
            <RoutineWheel items={items} size={320} />
            <p className="text-[12px] text-subtext font-medium">
              {totalHours}시간 작성됨 · {remainingHours}시간 남음
            </p>
          </div>

          {/* 입력 폼 */}
          <div className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgb(0,0,0,0.05)] flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              {/* 시작 시각 — 커스텀 화살표로 여백 확보 */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-subtext">시작 시각</label>
                <div className="relative">
                  <select
                    value={form.startHour}
                    onChange={(e) => setForm((f) => ({ ...f, startHour: Number(e.target.value) }))}
                    className="w-full appearance-none rounded-xl border border-gray-200 pl-4 pr-10 py-3 text-[14px] font-bold text-foreground outline-none"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>{String(i).padStart(2, "0")}:00</option>
                    ))}
                  </select>
                  {/* 커스텀 화살표 */}
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-subtext">길이 (시간)</label>
                <input
                  type="number"
                  min={1}
                  max={remainingHours}
                  value={form.durationHours}
                  onChange={(e) => setForm((f) => ({ ...f, durationHours: Number(e.target.value) }))}
                  className="rounded-xl border border-gray-200 px-4 py-3 text-[14px] font-bold text-foreground outline-none"
                />
              </div>
            </div>

            <input
              type="text"
              value={form.activity}
              onChange={(e) => setForm((f) => ({ ...f, activity: e.target.value }))}
              placeholder="활동명 (예: 러닝, 독서, 낮잠)"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-[14px] text-foreground outline-none focus:border-gray-400 transition-colors"
              onKeyDown={(e) => {
                // isComposing: 한글 IME 조합 중일 땐 Enter 무시 — 이중 추가 방지
                if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAdd();
                }
              }}
            />

            <button
              type="button"
              onClick={handleAdd}
              disabled={!form.activity.trim() || remainingHours <= 0}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#FEE500] py-3 text-[14px] font-bold text-[#3C1E1E] disabled:opacity-40 hover:scale-[1.02] active:scale-95 transition-all"
            >
              <Plus size={16} />
              추가하기
            </button>
          </div>

          {/* 일과 목록 */}
          <div className="flex flex-col gap-2">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center justify-between rounded-2xl bg-white px-5 py-3.5 shadow-[0_1px_8px_rgb(0,0,0,0.04)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <div>
                      <p className="text-[14px] font-bold text-foreground">
                        {item.emoji} {item.activity}
                      </p>
                      <p className="text-[11px] text-subtext">
                        {String(item.startHour).padStart(2, "0")}:00 · {item.durationHours}시간
                      </p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(item.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
