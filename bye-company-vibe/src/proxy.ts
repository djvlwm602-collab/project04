/**
 * 역할: 서버 사이드 인증 보호 — 미인증 사용자의 대시보드/서바이벌 접근 차단
 * 핵심 기능: 보호 경로에 인증 필수, 루트(/)는 항상 허용
 * 의존: next-auth (auth), next/server
 * Notes: auth 래퍼 패턴 — auth() 직접 호출 시 OAuth 자동 리다이렉트 버그 방지
 */

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default auth((req: any) => {
  if (!req.auth) {
    const loginUrl = new URL("/", req.url);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
});

export const config = {
  // 루트(/)는 매칭에서 제외 — 항상 메인 랜딩 페이지 표시
  matcher: ["/dashboard/:path*", "/survival/:path*"],
};
