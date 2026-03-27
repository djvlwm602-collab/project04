"use client";

import { motion } from "framer-motion";
import { LogIn, TrendingUp, CalendarDays } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = () => {
    // 실제 로그인 로직이 들어갈 부분, 임시로 대시보드로 이동
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-background transition-colors duration-300">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex w-full max-w-md flex-col items-center gap-8 rounded-3xl bg-card p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]"
      >
        <div className="flex flex-col items-center gap-4 text-center mt-4">
          <motion.div 
            initial={{ scale: 0.5, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.2 }}
            className="flex h-20 w-20 items-center justify-center rounded-2xl bg-kakao-yellow text-kakao-brown shadow-lg mb-2 relative overflow-hidden"
          >
            <TrendingUp size={40} className="absolute opacity-20 right-[-5px] bottom-[-5px]" />
            <CalendarDays size={36} />
          </motion.div>
          
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Bye-Company Vibe
            </h1>
            <p className="text-subtext mt-3 text-sm font-medium leading-relaxed">
              40대 맞벌이 부부를 위한<br/>파이어족 은퇴 D-Day 시뮬레이터
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 mt-6">
          <button 
            onClick={handleLogin}
            className="group flex w-full items-center justify-center gap-2 rounded-[18px] bg-kakao-yellow py-4 text-[16px] font-bold text-kakao-brown transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
          >
            카카오로 시작하기
          </button>
          
          <button 
            onClick={handleLogin}
            className="group flex w-full items-center justify-center gap-2 rounded-[18px] bg-white py-4 text-[16px] font-bold text-gray-700 border border-gray-200 transition-all hover:scale-[1.02] active:scale-95 shadow-sm dark:bg-[#2A2A2A] dark:text-zinc-200 dark:border-zinc-700"
          >
            Google로 시작하기
          </button>
        </div>
        
        <p className="mt-4 mb-2 text-[12px] text-subtext text-center font-medium">
          로그인 시 서비스 이용약관 및<br/>개인정보 처리방침에 동의하게 됩니다.
        </p>
      </motion.div>
    </div>
  );
}
