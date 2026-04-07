/**
 * 역할: 오피스 서바이벌 킷 허브 — 3가지 기능 진입점
 * 핵심 기능: 데스노트, 사직서, 은퇴 후 일과 진입
 * 의존: next-auth, next/navigation
 */
"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, BookOpen, FileText, Sun } from "lucide-react";

const KITS = [
  {
    href: "/survival/death-note",
    icon: BookOpen,
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
    title: "데스노트",
    desc: "꼴 보기 싫은 상사/동료를 빨간 글씨로 기록",
  },
  {
    href: "/survival/resignation",
    icon: FileText,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-500",
    title: "사직서 미리 쓰기",
    desc: "가슴속 품고 다니는 사직서, 솔직하게 작성",
  },
  {
    href: "/survival/routine",
    icon: Sun,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-500",
    title: "은퇴 후 일과",
    desc: "시간 단위로 작성 + 원형 일과표 시각화",
  },
];

export default function SurvivalPage() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F5F7]">
      <header className="flex h-16 items-center gap-3 border-b border-gray-200 bg-white px-6 shadow-sm">
        <button onClick={() => router.back()} className="text-subtext hover:text-foreground transition-colors">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-extrabold">오피스 서바이벌 킷</h1>
      </header>

      <main className="flex flex-1 flex-col items-center p-5">
        <div className="w-full max-w-md flex flex-col gap-3 mt-2">
          <p className="text-[13px] font-bold text-subtext text-center py-2">
            퇴사 전까지 버티기 위한 비밀 무기들
          </p>
          {KITS.map((kit, i) => (
            <motion.button
              key={kit.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => router.push(kit.href)}
              className="flex w-full items-center gap-4 rounded-2xl bg-white px-5 py-5 shadow-[0_2px_12px_rgb(0,0,0,0.05)] hover:bg-gray-50 active:scale-[0.98] transition-all text-left"
            >
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${kit.iconBg}`}>
                <kit.icon size={22} className={kit.iconColor} />
              </div>
              <div>
                <p className="text-[16px] font-extrabold text-foreground">{kit.title}</p>
                <p className="text-[12px] text-subtext mt-0.5">{kit.desc}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </main>
    </div>
  );
}
