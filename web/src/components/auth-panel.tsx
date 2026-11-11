"use client";
// 로그인·회원가입 패널: 관리 화면과 내 차량이 함께 씁니다.
// 구글 버튼은 구글이 제공하는 스크립트(Google Identity Services)가 그려 줍니다. 누르면 구글이 ID 토큰을 주고,
// 그걸 API에 보내 우리 로그인 토큰으로 바꿉니다. 비밀번호는 우리 서비스가 전혀 다루지 않습니다.
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ErrorText, Loading } from "@/components/ui";
import { ApiError, api, saveLoginToken, type AuthConfig, type AuthUser } from "@/lib/api";

type LoginResult = { token: string; user: AuthUser };

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (o: { client_id: string; callback: (r: { credential: string }) => void }) => void;
          renderButton: (el: HTMLElement, o: Record<string, unknown>) => void;
        };
      };
    };
  }
}

const GIS_SRC = "https://accounts.google.com/gsi/client";
function loadGoogleScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.google?.accounts) return resolve();
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`);
    const script = existing ?? Object.assign(document.createElement("script"), { src: GIS_SRC, async: true });
    script.addEventListener("load", () => resolve());
    script.addEventListener("error", () => reject(new Error("구글 로그인 스크립트를 불러오지 못했습니다.")));
    if (!existing) document.head.appendChild(script);
  });
}

function GoogleButton({ clientId, text, onCredential, onError }: { clientId: string; text: "signin_with" | "signup_with"; onCredential: (credential: string) => void; onError: (message: string) => void }) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const handlers = useRef({ onCredential, onError });
  useEffect(() => {
    handlers.current = { onCredential, onError };
  });

  useEffect(() => {
    loadGoogleScript().then(
      () => {
        if (!buttonRef.current || !window.google) return;
        window.google.accounts.id.initialize({ client_id: clientId, callback: ({ credential }) => handlers.current.onCredential(credential) });
        window.google.accounts.id.renderButton(buttonRef.current, { theme: "outline", size: "large", text, locale: "ko", width: 300 });
      },
      (err: Error) => handlers.current.onError(err.message),
    );
  }, [clientId, text]);

  return <div ref={buttonRef} className="flex min-h-11 justify-center" />;
}

const switchLink = "font-bold text-ink underline";

export function AuthPanel({ onLogin, allowSignup = true }: { onLogin: (user: AuthUser) => void; allowSignup?: boolean }) {
  const [config, setConfig] = useState<AuthConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    api<AuthConfig>("/auth/config").then(setConfig, (err: Error) => setError(err.message));
  }, []);

  // 우리 로그인 토큰을 받으면 저장하고 원래 하던 일로
  const finish = (r: LoginResult) => {
    saveLoginToken(r.token);
    onLogin(r.user);
  };

  function login(credential: string) {
    setError(null);
    api<LoginResult>("/auth/google", { method: "POST", json: { credential } }).then(finish, (err: Error) => {
      setError(err.message);
      if (allowSignup && err instanceof ApiError && err.status === 404) setMode("signup");
    });
  }

  function signup(credential: string) {
    setError(null);
    api<LoginResult>("/auth/google/signup", { method: "POST", json: { credential, agreed } }).then(finish, (err: Error) => setError(err.message));
  }

  function switchMode(next: "login" | "signup") {
    setError(null);
    setMode(next);
  }

  if (!config && !error) return <Loading />;
  const clientId = config?.googleClientId;
  return (
    <div className="flex flex-col gap-4">
      <ErrorText message={error} />
      {config && !clientId && <p className="rounded-xl bg-chip p-3 text-sm text-body">지금은 구글 로그인을 쓸 수 없어요. 잠시 후 다시 시도해 주세요.</p>}
      {clientId && mode === "login" && <GoogleButton key="login" clientId={clientId} text="signin_with" onCredential={login} onError={setError} />}
      {clientId && mode === "signup" && (
        <>
          <div className="flex flex-col gap-1.5 rounded-xl bg-chip p-3.5 text-[13px] leading-relaxed text-body">
            <p className="font-bold text-ink">회원가입</p>
            <p>수집 항목: 이메일, 이름, 프로필 사진</p>
            <p>이용 목적: 회원 확인, 내 차량 제공</p>
            <p>보유 기간: 회원탈퇴 시까지</p>
          </div>
          <label className="flex min-h-11 items-center gap-2.5 text-sm font-medium">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="h-5 w-5 accent-primary" />
            [필수] 개인정보 수집·이용에 동의합니다
          </label>
          <div className={agreed ? "" : "pointer-events-none opacity-50"} aria-disabled={!agreed}>
            <GoogleButton key="signup" clientId={clientId} text="signup_with" onCredential={signup} onError={setError} />
          </div>
        </>
      )}
      {allowSignup && (
        <p className="text-center text-[13px] text-muted">
          {mode === "login" ? (
            <>아직 회원이 아니신가요? <button type="button" onClick={() => switchMode("signup")} className={switchLink}>회원가입</button></>
          ) : (
            <>이미 회원이신가요? <button type="button" onClick={() => switchMode("login")} className={switchLink}>로그인</button></>
          )}
        </p>
      )}
      <Link href="/privacy" target="_blank" className="text-center text-xs text-muted underline">개인정보처리방침</Link>
    </div>
  );
}
