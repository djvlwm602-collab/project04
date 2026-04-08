/**
 * 역할: /signup 접근 시 루트로 리다이렉트 — 회원가입 플로우는 로그인 페이지에 통합
 */
import { redirect } from "next/navigation";

export default function SignupPage() {
  redirect("/");
}
