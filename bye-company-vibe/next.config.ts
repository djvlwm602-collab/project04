/**
 * 역할: Next.js 설정 — 보안 헤더 포함
 * 핵심 기능: HTTP 보안 헤더 (CSP, HSTS, X-Frame-Options 등)
 * 의존: 없음
 */
import type { NextConfig } from "next";

// CSP에서 허용할 외부 출처 목록
// - Google/Kakao OAuth 플로우에 필요한 도메인
// - Pretendard 웹폰트 CDN
const googleDomains = "accounts.google.com *.googleapis.com";
const kakaoDomains = "kauth.kakao.com *.kakao.com *.kakaocdn.net";
const fontCdn = "cdn.jsdelivr.net";

const cspHeader = [
  // 기본: 자기 출처만 허용
  `default-src 'self'`,
  // Next.js 앱 라우터 하이드레이션 및 개발환경/동적 기능에 안전한 평가(eval)와 인라인 스크립트 필요
  `script-src 'self' 'unsafe-inline' 'unsafe-eval'`,
  // Tailwind 인라인 스타일 + Pretendard CDN
  `style-src 'self' 'unsafe-inline' ${fontCdn}`,
  // Pretendard 웹폰트
  `font-src 'self' ${fontCdn} data:`,
  // 프로필 이미지: Google/Kakao 프로필 사진 허용
  `img-src 'self' data: blob: *.googleusercontent.com *.kakaocdn.net`,
  // XHR/fetch: 자기 출처만 (NextAuth 콜백은 같은 오리진)
  `connect-src 'self'`,
  // OAuth 팝업/리다이렉트 프레임 허용
  `frame-src 'self' ${googleDomains} ${kakaoDomains}`,
  // 플래시 등 플러그인 완전 차단
  `object-src 'none'`,
  // base 태그를 통한 경로 오염 방지
  `base-uri 'self'`,
  // 폼 제출 허용 출처 (OAuth 포함)
  `form-action 'self' ${googleDomains} ${kakaoDomains}`,
  // 다른 사이트가 iframe으로 이 앱을 삽입하는 것 차단
  `frame-ancestors 'none'`,
]
  .join("; ")
  .replace(/\n/g, "");

const securityHeaders = [
  // ── XSS / 클릭재킹 ────────────────────────────────────────
  {
    key: "Content-Security-Policy",
    value: cspHeader,
  },
  {
    // frame-ancestors로 중복이지만 구형 브라우저 호환
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    // MIME 스니핑 공격 방지
    key: "X-Content-Type-Options",
    value: "nosniff",
  },

  // ── 전송 보안 ────────────────────────────────────────────
  {
    // HTTPS 강제 (프로덕션 배포 시 활성화됨)
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },

  // ── 정보 노출 최소화 ──────────────────────────────────────
  {
    // 외부 사이트로 이동 시 Referer 헤더에 전체 URL 대신 오리진만 전송
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    // 불필요한 브라우저 API 차단 (카메라·마이크·위치·결제 등)
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=()",
  },
  {
    // DNS 프리페치 허용 (성능 개선, 보안 영향 없음)
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // 모든 경로에 보안 헤더 적용
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
