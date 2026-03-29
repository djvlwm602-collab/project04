/**
 * 역할: NextAuth v5 설정 — 카카오/구글 소셜 로그인 프로바이더 정의
 * 핵심 기능: OAuth 프로바이더 설정, 세션 콜백, 로그인/로그아웃 헬퍼
 * 의존: next-auth
 */

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Kakao from "next-auth/providers/kakao";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Kakao({
      clientId: process.env.KAKAO_CLIENT_ID,
      clientSecret: process.env.KAKAO_CLIENT_SECRET,
    }),
  ],
  pages: {
    // 커스텀 로그인 페이지 사용 (기본 NextAuth UI 대신)
    signIn: "/",
  },
  callbacks: {
    // JWT에 프로바이더 정보 포함
    async jwt({ token, account }) {
      if (account) {
        token.provider = account.provider;
      }
      return token;
    },
    // 세션에 프로바이더 정보 전달
    async session({ session, token }) {
      if (session.user) {
        (session.user as unknown as Record<string, unknown>).provider = token.provider;
      }
      return session;
    },
  },
});
