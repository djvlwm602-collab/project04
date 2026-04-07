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
    const trimReason = reason.trim();
    if (!trimName || !trimReason) return;

    const entry: DeathNoteEntry = {
      id: Date.now().toString(),
      name: trimName,
      reason: trimReason,
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
    <div className="flex min-h-screen flex-col bg-[#0a0a0a]">
      <header className="flex h-16 items-center gap-3 border-b border-white/10 px-6">
        <button onClick={() => router.back()} className="text-white/50 hover:text-white transition-colors">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-extrabold text-white">📓 데스노트</h1>
      </header>

      <main className="flex flex-1 flex-col items-center p-5">
        <div className="w-full max-w-md flex flex-col gap-5">
          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 p-5">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름 또는 별명"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[16px] font-bold text-red-400 placeholder:text-white/20 outline-none focus:border-red-500/50"
            />
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="이유 (한 줄로)"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[14px] text-white/70 placeholder:text-white/20 outline-none focus:border-red-500/50"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <button
              onClick={handleAdd}
              disabled={!name.trim() || !reason.trim()}
              className="flex items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-[14px] font-bold text-white disabled:opacity-40 hover:bg-red-500 active:scale-95 transition-all"
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
                  className="flex items-start justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4"
                >
                  <div>
                    <p className="text-[16px] font-black text-red-400">{entry.name}</p>
                    <p className="text-[13px] text-white/50 mt-0.5">{entry.reason}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="text-white/20 hover:text-red-400 transition-colors mt-0.5"
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            {entries.length === 0 && (
              <p className="text-center text-[13px] text-white/30 py-8">
                아직 아무도 없네요. 정말요?
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
