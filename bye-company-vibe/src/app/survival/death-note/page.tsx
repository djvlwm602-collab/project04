/**
 * 역할: 데스노트 — 꼴 보기 싫은 인물 빨간 글씨로 기록
 * 핵심 기능: 이름+이유 입력, localStorage 저장, 목록 표시/삭제
 * 의존: lib/storage, lib/types, next-auth
 */
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import type { DeathNoteEntry } from "@/lib/types";
import { loadDeathNote, addDeathNoteEntry, deleteDeathNoteEntry } from "@/lib/storage";

export default function DeathNotePage() {
  const router = useRouter();
  const { status } = useSession();
  const [entries, setEntries] = useState<DeathNoteEntry[]>([]);
  const [name, setName] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  useEffect(() => {
    setEntries(loadDeathNote());
  }, []);

  const handleAdd = () => {
    const trimName = name.trim();
    if (!trimName) return;

    const entry: DeathNoteEntry = {
      id: Date.now().toString(),
      name: trimName,
      reason: reason.trim(),
      createdAt: new Date().toISOString(),
    };
    addDeathNoteEntry(entry);
    setEntries(loadDeathNote());
    setName("");
    setReason("");
  };

  const handleDelete = (id: string) => {
    deleteDeathNoteEntry(id);
    setEntries(loadDeathNote());
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F5F7]">
      <header className="flex h-16 items-center gap-3 px-6">
        <button onClick={() => router.back()} className="text-subtext hover:text-foreground transition-colors">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-extrabold text-foreground">📓 데스노트</h1>
      </header>

      <main className="flex flex-1 flex-col items-center p-5">
        <div className="w-full max-w-md flex flex-col gap-5">
          <div className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgb(0,0,0,0.05)]">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름 또는 별명"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-5 text-[24px] font-bold text-red-500 placeholder:text-gray-300 outline-none transition-colors"
              style={{ fontFamily: "'Gungsuh', '궁서', '궁서체', serif", fontWeight: 900, WebkitTextStroke: '0.6px currentColor' }}
            />
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="이유 (선택)"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[14px] text-foreground placeholder:text-gray-300 outline-none transition-colors"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <button
              onClick={handleAdd}
              disabled={!name.trim()}
              className="flex items-center justify-center gap-2 rounded-xl bg-red-500 py-3 text-[14px] font-bold text-white disabled:opacity-40 hover:bg-red-400 active:scale-95 transition-all"
            >
              <Plus size={16} />
              기록하기
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <AnimatePresence>
              {entries.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start justify-between rounded-2xl bg-white px-5 py-4 shadow-[0_2px_8px_rgb(0,0,0,0.05)]"
                >
                  <div>
                    <p className="text-[16px] font-black text-red-500" style={{ fontFamily: "'Gungsuh', '궁서', '궁서체', serif", fontWeight: 900, WebkitTextStroke: '0.6px currentColor' }}>{entry.name}</p>
                    {entry.reason && <p className="text-[13px] text-subtext mt-0.5">{entry.reason}</p>}
                  </div>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors mt-0.5"
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            {entries.length === 0 && (
              <p className="text-center text-[13px] text-subtext py-8">
                에헤이~ 정말 아무도 없다고?
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
