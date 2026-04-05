/**
 * 역할: 클라이언트 측 프로바이더 래퍼 (SessionProvider 등)
 * 핵심 기능: next-auth SessionProvider로 전체 앱 감싸기
 * 의존: next-auth/react
 */
"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
