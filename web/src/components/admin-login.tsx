"use client";
// 관리 화면 로그인. 일반 사용자(USER) 계정으로 들어오면 권한이 없다고 알려 줍니다.
import { LoginButtons } from "@/components/login-buttons";
import { ErrorText } from "@/components/ui";
import type { AuthUser } from "@/lib/api";

export function AdminLogin({ onLogin, denied = false }: { onLogin: (user: AuthUser) => void; denied?: boolean }) {
  return (
    <div className="flex flex-col gap-4 p-5 pt-8">
      <h1 className="text-xl font-bold">관리자 로그인</h1>
      <p className="text-sm leading-relaxed text-body">등록된 구글 계정만 들어올 수 있어요. 권한이 필요하면 관리자에게 이메일 등록을 요청하세요.</p>
      {denied && <ErrorText message="이 계정은 관리 권한이 없어요. 등록된 계정으로 로그인해 주세요." />}
      <LoginButtons onLogin={onLogin} devPlaceholder="ADMIN_EMAILS·EDITOR_EMAILS에 있는 이메일" />
    </div>
  );
}
