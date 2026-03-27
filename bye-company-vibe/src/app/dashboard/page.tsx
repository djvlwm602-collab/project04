"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Wallet, Rocket, AlertTriangle } from "lucide-react";

// 초기 환경 변수 (통계청 DINK 가구 평균 기반 시뮬레이션 데이터)
const baseTargetAmount = 1050000000; // 10억 5천만 원 (월 350만 생활비 * 12 * 25)
const baseAssets = 400000000; // 4억 원 (현재 자본)
const baseMonthlySaving = 4500000; // 월 저축 450만 원 (합산 소득 800 - 생활비 350)
const annualReturnRate = 0.06; // 투자 수익률 6%

// 복리 계산 함수: 목표 금액에 도달하기까지 걸리는 개월 수 반환
function calculateMonthsToFIRE(assets: number, monthlySaving: number, target: number, rate: number) {
  const monthlyRate = rate / 12;
  let currentAssets = assets;
  let months = 0;
  
  if (currentAssets >= target) return 0;
  
  // 최대 50년(600개월) 루프 방지
  while (currentAssets < target && months < 600) {
    currentAssets = currentAssets * (1 + monthlyRate) + monthlySaving;
    months++;
  }
  return months;
}

export default function DashboardPage() {
  const [sliderValue, setSliderValue] = useState(0); // -50만 원 ~ +50만 원 조절 슬라이더

  const monthsLeft = useMemo(() => {
    return calculateMonthsToFIRE(baseAssets, baseMonthlySaving + sliderValue, baseTargetAmount, annualReturnRate);
  }, [sliderValue]);

  // 예상 은퇴일 날짜 객체 생성
  const projectedDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthsLeft);
    return d;
  }, [monthsLeft]);

  // 아무 조정이 없을 때의 기본 개월 수 (차이값 비교용)
  const baseMonthsLeft = useMemo(() => {
    return calculateMonthsToFIRE(baseAssets, baseMonthlySaving, baseTargetAmount, annualReturnRate);
  }, []);

  const monthDiff = baseMonthsLeft - monthsLeft;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderValue(Number(e.target.value));
  };

  const formattedDate = `${projectedDate.getFullYear()}년 ${projectedDate.getMonth() + 1}월`;

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground transition-colors duration-300">
      {/* 상단 헤더 영역 */}
      <header className="flex h-16 items-center border-b border-gray-200 bg-white px-6 shadow-sm dark:border-zinc-800 dark:bg-card">
        <h1 className="text-lg font-extrabold tracking-tight">Bye-Company Vibe</h1>
      </header>

      <main className="flex flex-1 flex-col items-center p-6 sm:p-10">
        <div className="w-full max-w-md space-y-6">
          
          {/* 파이어족 D-Day 메인 카드 UI */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center rounded-[32px] bg-kakao-yellow p-10 text-kakao-brown shadow-xl relative overflow-hidden"
          >
            {/* 장식용 큰 아이콘 배경 */}
            <Rocket size={120} className="absolute -right-6 -bottom-6 opacity-10" />
            
            <p className="text-[15px] font-bold opacity-80 mb-1 z-10">예상 은퇴(사직) 가능일</p>
            <h2 className="text-4xl font-black tracking-tighter drop-shadow-sm my-2 z-10">
              {formattedDate}
            </h2>
            <p className="mt-3 text-[15px] font-medium opacity-90 z-10 bg-white/30 px-4 py-1.5 rounded-full inline-block">
              현재 페이스로 <span className="font-extrabold">{monthsLeft}개월</span> 남았습니다.
            </p>
          </motion.div>

          {/* 지출 증감 인터랙티브 슬라이더 카드 UI */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-[32px] bg-card p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]"
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-[18px] font-extrabold">지출 스와이프 액션</h3>
              <Wallet className="text-subtext" size={24} />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-[13px] font-bold text-subtext mb-2">
                <span className="text-red-500">지출 펑펑 (-50만)</span>
                <span className="text-blue-500">영끌 저축 (+50만)</span>
              </div>
              
              <input 
                type="range" 
                min="-500000" 
                max="500000" 
                step="50000"
                value={sliderValue} 
                onChange={handleSliderChange}
                className="w-full accent-kakao-dark h-2.5 bg-gray-200 rounded-full appearance-none cursor-pointer dark:bg-zinc-700"
              />
              <div className="text-center mt-4 font-extrabold text-[17px]">
                조정 금액: {sliderValue > 0 ? '+' : ''}{(sliderValue / 10000).toLocaleString()}만 원 / 월
              </div>
            </div>

            {/* 실시간 피드백 박스 */}
            <div className={`mt-6 rounded-2xl p-5 text-[14.5px] font-bold leading-relaxed transition-colors ${sliderValue > 0 ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : sliderValue < 0 ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-gray-100 text-subtext dark:bg-zinc-800'}`}>
              {sliderValue > 0 && `🎉 나이스! 오마카세를 포기하고 월 ${(sliderValue / 10000)}만 원을 아끼면, 은퇴일이 무려 ${monthDiff}개월 앞당겨집니다!`}
              {sliderValue < 0 && `🚨 삐용삐용! 이번 달 ${Math.abs(sliderValue / 10000)}만 원을 더 쓰시면, 원수 같은 이 회사를 ${Math.abs(monthDiff)}개월 더 다녀야 합니다...`}
              {sliderValue === 0 && `현재 월 450만 원씩 훌륭하게 저축하고 계십니다! 부장님 면전에 사표 던질 날이 머지않았습니다.`}
            </div>
          </motion.div>

          {/* 참기 액션 버튼 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <button className="group flex w-full items-center justify-center gap-2 rounded-[22px] bg-kakao-dark py-5 text-[17px] font-bold text-white transition-transform hover:scale-[1.02] active:scale-95 shadow-lg">
              <AlertTriangle size={22} className="text-kakao-yellow" />
              지금 결제 충동 참기! (가상적립)
            </button>
          </motion.div>
          
        </div>
      </main>
    </div>
  );
}
