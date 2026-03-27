/**
 * 역할: NextAuth v5 설정 — 카카오/구글 소셜 로그인 프로바이더 정의
 * 핵심 기능: OAuth 프로바이더 설정, 세션 콜백, 로그인/로그아웃 헬퍼
 * 의존: next-auth
 */

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

// 카카오 프로바이더 — next-auth v5에 내장되지 않으므로 커스텀 정의
const Kakao = {
  id: "kakao",
  name: "Kakao",
  type: "oauth" as const,
  authorization: {
    url: "https://kauth.kakao.com/oauth/authorize",
    params: { scope: "profile_nickname profile_image account_email" },
  },
  token: "https://kauth.kakao.com/oauth/token",
  userinfo: "https://kapi.kakao.com/v2/user/me",
  clientId: process.env.KAKAO_CLIENT_ID,
  clientSecret: process.env.KAKAO_CLIENT_SECRET,
  // 카카오 API 응답 구조에 맞게 프로필 매핑
  profile(profile: Record<string, unknown>) {
    const kakaoAccount = profile.kakao_account as Record<string, unknown> | undefined;
    const kakaoProfile = kakaoAccount?.profile as Record<string, string> | undefined;
    return {
      id: String(profile.id),
      name: kakaoProfile?.nickname ?? "카카오 사용자",
      email: (kakaoAccount?.email as string) ?? null,
      image: kakaoProfile?.profile_image_url ?? null,
    };
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Kakao,
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
