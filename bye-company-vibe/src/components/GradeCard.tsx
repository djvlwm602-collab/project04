/**
 * 역할: S/A/B/C 등급 진단서 모달 — 공유용 카드 생성 + 이미지 저장/공유
 * 핵심 기능: html-to-image로 카드 이미지 생성, Web Share API 연동
 * 의존: lib/types, lib/constants, html-to-image
 */
"use client";

import { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Download, Share2, X } from "lucide-react";
import type { UserProfile, RetirementGrade } from "@/lib/types";
import { GRADE_META } from "@/lib/constants";
import { calcDDay, calcSurvivalYears } from "@/lib/calculator";

interface Props {
  grade: RetirementGrade;
  profile: UserProfile;
  nickname: string;
  retirementDate: string;
  onClose: () => void;
}

const GRADE_BG: Record<RetirementGrade, string> = {
  S: "from-emerald-400 via-teal-500 to-cyan-500",
  A: "from-blue-400 via-indigo-500 to-violet-500",
  B: "from-amber-400 via-orange-500 to-red-400",
  C: "from-slate-500 via-gray-600 to-zinc-700",
};

export function GradeCard({ grade, profile, nickname, retirementDate, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const meta = GRADE_META[grade];
  const dDay = calcDDay(profile);
  const survivalYears = calcSurvivalYears(profile);

  const handleSave = useCallback(async () => {
    if (!cardRef.current || saving) return;
    setSaving(true);
    try {
      const { toPng } = await import("html-to-image");
      const url = await toPng(cardRef.current, { pixelRatio: 3, cacheBust: true });
      const a = document.createElement("a");
      a.download = `retirement-grade-${grade}.png`;
      a.href = url;
      a.click();
    } finally {
      setSaving(false);
    }
  }, [saving, grade]);

  const handleShare = useCallback(async () => {
    if (!cardRef.current || saving) return;
    setSaving(true);
    try {
      const { toBlob } = await import("html-to-image");
      const blob = await toBlob(cardRef.current, { pixelRatio: 3, cacheBust: true });
      if (!blob) return;
      if (navigator.share) {
        await navigator.share({
          title: `은퇴 등급: ${grade}`,
          files: [new File([blob], `grade-${grade}.png`, { type: "image/png" })],
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.download = `grade-${grade}.png`;
        a.href = url;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      if (e instanceof Error && e.name !== "AbortError") console.error(e);
    } finally {
      setSaving(false);
    }
  }, [saving, grade]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-6"
      >
        <div className="flex w-full max-w-sm flex-col items-center gap-4">
          <button onClick={onClose} className="self-end text-white/60 hover:text-white transition-colors">
            <X size={24} />
          </button>

          <div
            ref={cardRef}
            className={`relative w-full overflow-hidden rounded-3xl bg-gradient-to-br ${GRADE_BG[grade]} p-8 shadow-2xl`}
            style={{ aspectRatio: "4 / 5" }}
          >
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10" />
            <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/10" />

            <div className="relative z-10 flex h-full flex-col justify-between text-white">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-widest opacity-70">은퇴 진단서</p>
                <p className="mt-1 text-[13px] font-bold opacity-60">{nickname || "익명의 직장인"}</p>
              </div>

              <div className="flex flex-col gap-2">
                <div className="text-[80px] font-black leading-none tracking-tight drop-shadow-lg">
                  {grade}
                </div>
                <p className="text-[16px] font-extrabold">{meta.label}</p>
                <p className="mt-2 text-[13px] font-medium leading-relaxed opacity-80">
                  {meta.caption}
                </p>
              </div>

              <div className="flex justify-between">
                <div>
                  <p className="text-[11px] opacity-60">D-Day</p>
                  <p className="text-[18px] font-extrabold">D-{dDay.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] opacity-60">은퇴 후 {survivalYears}년 생존</p>
                  <p className="text-[13px] font-bold opacity-80">{retirementDate} 예정</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex w-full gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-[15px] font-bold text-gray-800 shadow-lg hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all"
            >
              <Download size={18} /> 저장
            </button>
            <button
              onClick={handleShare}
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-[15px] font-bold text-gray-800 shadow-lg hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all"
            >
              <Share2 size={18} /> 공유
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
