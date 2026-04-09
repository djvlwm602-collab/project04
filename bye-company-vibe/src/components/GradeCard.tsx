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
      if (e instanceof Error && e.name !== "AbortError") { /* 공유 실패 — 사용자가 이미 UI로 확인 가능 */ }
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
      {/*
        overflow-y-auto: 뷰포트보다 길어지면 모달 자체를 스크롤
        min-h-full + items-center: 짧을 땐 중앙 정렬, 넘칠 땐 스크롤
      */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed inset-0 z-50 overflow-y-auto"
      >
        <div className="flex min-h-full items-center justify-center px-5 py-4">
          <div className="flex w-full max-w-sm flex-col items-center gap-3">
            <button onClick={onClose} className="self-end text-white/60 hover:text-white transition-colors">
              <X size={24} />
            </button>

            {/*
              모바일/PC 공통: aspect-[4/5] 비율 고정
              max-h-[65svh]: 뷰포트 높이 초과 방지 → 카드+버튼이 한 화면에 들어오도록
            */}
            {/*
              p-6을 카드가 아닌 내부 absolute div로 이동:
              모바일 Safari에서 aspect-ratio 부모의 h-full 버그 우회 →
              absolute inset-0은 부모 실제 크기를 정확히 참조함
            */}
            <div
              ref={cardRef}
              className={`relative w-full overflow-hidden rounded-3xl bg-gradient-to-br ${GRADE_BG[grade]} shadow-2xl aspect-[4/5] max-h-[65svh]`}
            >
              <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10" />
              <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/10" />

              {/* absolute inset-0으로 부모 크기 정확히 참조 → justify-between 정상 동작 */}
              <div className="absolute inset-0 p-6 z-10 flex flex-col justify-between text-white">
                {/* 상단: 제목 + 닉네임 */}
                <div>
                  <p className="text-[12px] font-bold uppercase tracking-widest opacity-70">은퇴 진단서</p>
                  <p className="mt-1 text-[13px] font-bold opacity-60">{nickname || "익명의 직장인"}</p>
                </div>

                {/* 중간: 등급 + 라벨 + 설명 */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-end gap-1.5 leading-none">
                    <span className="text-[64px] font-black tracking-tight drop-shadow-lg leading-none">
                      {grade}
                    </span>
                    <span className="text-[14px] font-bold opacity-70 mb-2">등급</span>
                  </div>
                  <p className="text-[18px] font-extrabold">{meta.label}</p>
                  <p className="text-[15px] font-medium leading-relaxed opacity-80">
                    {meta.caption}
                  </p>
                </div>

                {/* 하단: D-Day + 은퇴 예정일 */}
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
        </div>
      </motion.div>
    </>
  );
}
