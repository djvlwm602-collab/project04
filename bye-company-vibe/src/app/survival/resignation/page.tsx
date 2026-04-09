/**
 * 역할: 사직서 미리 쓰기 — 수신인 + 본문 자유 작성, localStorage 자동 저장
 * 핵심 기능: 실시간 저장, 마지막 수정일 표시
 * 의존: lib/storage, lib/types
 */
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Save } from "lucide-react";
import type { ResignationLetter } from "@/lib/types";
import { loadResignation, saveResignation } from "@/lib/storage";

export default function ResignationPage() {
  const router = useRouter();
  const { status } = useSession();
  const [letter, setLetter] = useState<ResignationLetter>({
    recipient: "",
    content: "",
    updatedAt: "",
  });
  const [saved, setSaved] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  useEffect(() => {
    const loaded = loadResignation();
    if (loaded) setLetter(loaded);
  }, []);

  // 컴포넌트 언마운트 시 타이머 정리 — 메모리 누수 방지
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const handleChange = (field: keyof ResignationLetter, value: string) => {
    const updated = { ...letter, [field]: value, updatedAt: new Date().toISOString() };
    setLetter(updated);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveResignation(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 1000);
  };

  const lastSaved = letter.updatedAt
    ? new Date(letter.updatedAt).toLocaleString("ko-KR", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-[#fafaf8]">
      <header className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-subtext hover:text-foreground transition-colors">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-lg font-extrabold">📄 사직서</h1>
        </div>
        <div className="flex items-center gap-2">
          {saved && <Save size={16} className="text-green-500" />}
          {lastSaved && (
            <span className="text-[11px] text-subtext">{lastSaved} 저장됨</span>
          )}
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center pt-[10px] px-5 pb-5 sm:pt-6 sm:px-8">
        <div className="w-full max-w-md flex flex-col gap-4">
          <div className="rounded-2xl bg-white border border-gray-200 p-6 shadow-sm flex flex-col gap-4">
            <div className="text-center border-b border-gray-100 pb-4">
              <h2 className="text-[20px] font-black text-gray-800">사 직 서</h2>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-subtext">수신인</label>
              <input
                type="text"
                value={letter.recipient}
                onChange={(e) => handleChange("recipient", e.target.value)}
                placeholder="예) OOO 대표이사 귀중"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-[14px] text-gray-700 outline-none focus:border-gray-400 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-subtext">본문</label>
              <textarea
                value={letter.content}
                onChange={(e) => handleChange("content", e.target.value)}
                placeholder="진심을 담아 솔직하게 쓰세요. 어차피 아무도 안 봅니다."
                rows={10}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-[14px] text-gray-700 outline-none focus:border-gray-400 transition-colors resize-none leading-relaxed"
              />
            </div>

            <p className="text-[11px] text-subtext text-center">
              입력 후 자동 저장됩니다. 진짜 제출하지 마세요. 🙏
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
