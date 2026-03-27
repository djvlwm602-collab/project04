import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bye-Company Vibe",
  description: "40대 맞벌이 딩크족을 위한 파이어족 은퇴 D-Day 시뮬레이터",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
