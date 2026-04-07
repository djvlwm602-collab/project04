/**
 * 역할: 은퇴 후 일과 작성 + 원형 시각화
 * 핵심 기능: 시작 시각/길이/활동 입력, RoutineWheel SVG, localStorage 저장
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

const PRESET_COLORS = [
  "#FEE500", "#22c55e", "#3b82f6", "#f97316",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f43f5e",
];

export default function RoutinePage() {
  const router = useRouter();
  const { status } = useSession();
  const [items, setItems] = useState<RoutineItem[]>([]);
  const [form, setForm] = useState({
    startHour: 6,
    durationHours: 1,
    activity: "",
    color: PRESET_COLORS[0],
  });

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  useEffect(() => {
    setItems(loadRoutine());
  }, []);

  const totalHours = items.reduce((sum, i) => sum + i.durationHours, 0);
  const remainingHours = 24 - totalHours;

  const handleAdd = () => {
    if (!form.activity.trim()) return;
    if (form.durationHours < 1 || form.durationHours > remainingHours) return;

    const newItem: RoutineItem = {
      id: Date.now().toString(),
      startHour: form.startHour,
      durationHours: form.durationHours,
      activity: form.activity.trim(),
      color: form.color,
    };
    const updated = [...items, newItem].sort((a, b) => a.startHour - b.startHour);
    setItems(updated);
    saveRoutine(updated);
    setForm((f) => ({ ...f, activity: "", startHour: Math.min(23, f.startHour + f.durationHours) }));
  };

  const handleDelete = (id: string) => {
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    saveRoutine(updated);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F5F7]">
      <header className="flex h-16 items-center gap-3 border-b border-gray-200 bg-white px-6 shadow-sm">
        <button onClick={() => router.back()} className="text-subtext hover:text-foreground transition-colors">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-extrabold">☀️ 은퇴 후 일과</h1>
      </header>

      <main className="flex flex-1 flex-col items-center p-5 gap-5">
        <div className="w-full max-w-md flex flex-col gap-5">
          {/* 원형 일과표 */}
          <div className="flex flex-col items-center gap-2 rounded-[24px] bg-white p-6 shadow-[0_2px_20px_rgb(0,0,0,0.06)]">
            <RoutineWheel items={items} size={240} />
            <p className="text-[12px] text-subtext font-medium">
              {totalHours}시간 작성됨 · {remainingHours}시간 남음
            </p>
          </div>

          {/* 입력 폼 */}
          <div className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgb(0,0,0,0.05)] flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-subtext">시작 시각</label>
                <select
                  value={form.startHour}
                  onChange={(e) => setForm((f) => ({ ...f, startHour: Number(e.target.value) }))}
                  className="rounded-xl border border-gray-200 px-3 py-2.5 text-[14px] font-bold text-foreground outline-none"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{String(i).padStart(2, "0")}:00</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-subtext">길이 (시간)</label>
                <input
                  type="number"
                  min={1}
                  max={remainingHours}
                  value={form.durationHours}
                  onChange={(e) => setForm((f) => ({ ...f, durationHours: Number(e.target.value) }))}
                  className="rounded-xl border border-gray-200 px-3 py-2.5 text-[14px] font-bold text-foreground outline-none"
                />
              </div>
            </div>

            <input
              type="text"
              value={form.activity}
              onChange={(e) => setForm((f) => ({ ...f, activity: e.target.value }))}
              placeholder="활동명 (예: 러닝, 독서, 낮잠)"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-[14px] text-foreground outline-none focus:border-[#FEE500] transition-colors"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />

            {/* 색상 선택 */}
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setForm((f) => ({ ...f, color: c }))}
                  className="h-7 w-7 rounded-full transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    outline: form.color === c ? `3px solid ${c}` : "none",
                    outlineOffset: "2px",
                  }}
                />
              ))}
            </div>

            <button
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
                      <p className="text-[14px] font-bold text-foreground">{item.activity}</p>
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
