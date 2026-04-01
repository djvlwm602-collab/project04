/**
 * 역할: 루트 레이아웃 — HTML 구조 및 전역 프로바이더 설정
 * 핵심 기능: 메타데이터, SessionProvider 래핑, 전역 스타일
 * 의존: providers.tsx, globals.css
 */

import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "아임 파이어족",
  description: "40대 맞벌이 딩크족을 위한 파이어족 은퇴 D-Day 시뮬레이터",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        {/* Pretendard 웹폰트 — 한글 깨짐 방지 */}
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
