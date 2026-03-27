/**
 * 역할: 서버 사이드 인증 보호 — 미인증 사용자의 대시보드 접근 차단
 * 핵심 기능: /dashboard, /stress-test 경로에 인증 필수 적용
 * 의존: next-auth (auth), next/server
 * Notes: Next.js 16에서 middleware → proxy로 변경됨
 */

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const session = await auth();

  const { pathname } = request.nextUrl;

  // 인증이 필요한 경로인데 세션이 없으면 로그인 페이지로 리다이렉트
  if (!session) {
    const loginUrl = new URL("/", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // 인증이 필요한 경로만 매칭
  matcher: ["/dashboard/:path*", "/stress-test/:path*"],
};
