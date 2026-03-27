/**
 * 역할: NextAuth API 라우트 핸들러
 * 핵심 기능: /api/auth/* 경로의 GET/POST 요청 처리
 * 의존: lib/auth
 */

import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
