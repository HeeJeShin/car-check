"use client";
// 관리 화면 로그인: 구글 로그인 버튼 + (개발 중이면) 이메일만으로 로그인.
// 구글 버튼은 구글이 제공하는 스크립트(Google Identity Services)가 그려 줍니다. 누르면 구글이 ID 토큰을 주고,
// 그걸 API(POST /auth/google)에 보내 우리 로그인 토큰으로 바꿉니다. 비밀번호는 우리 서비스가 전혀 다루지 않습니다.
import { useEffect, useRef, useState } from "react";
import { Card, ErrorText, Loading, fieldCls } from "@/components/ui";
import { api, saveLoginToken, type AuthConfig, type AuthUser } from "@/lib/api";

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

export function AdminLogin({ onLogin }: { onLogin: (user: AuthUser) => void }) {
  const [config, setConfig] = useState<AuthConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [devEmail, setDevEmail] = useState("");
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api<AuthConfig>("/auth/config").then(setConfig, (err: Error) => setError(err.message));
  }, []);

  // 우리 로그인 토큰을 받으면 저장하고 관리 화면으로
  const finish = (r: LoginResult) => {
    saveLoginToken(r.token);
    onLogin(r.user);
  };
  const finishRef = useRef(finish);
  useEffect(() => {
    finishRef.current = finish;
  });

  useEffect(() => {
    const clientId = config?.googleClientId;
    if (!clientId) return;
    loadGoogleScript().then(
      () => {
        if (!buttonRef.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: ({ credential }) =>
            api<LoginResult>("/auth/google", { method: "POST", json: { credential } }).then((r) => finishRef.current(r), (err: Error) => setError(err.message)),
        });
        window.google.accounts.id.renderButton(buttonRef.current, { theme: "outline", size: "large", text: "signin_with", locale: "ko", width: 300 });
      },
      (err: Error) => setError(err.message),
    );
  }, [config?.googleClientId]);

  async function devLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    await api<LoginResult>("/auth/dev", { method: "POST", json: { email: devEmail } }).then(finish, (err: Error) => setError(err.message));
  }

  if (!config && !error) return <Loading />;
  return (
    <div className="flex flex-col gap-4 p-5 pt-8">
      <h1 className="text-xl font-bold">관리자 로그인</h1>
      <p className="text-sm leading-relaxed text-body">등록된 구글 계정만 들어올 수 있어요. 권한이 필요하면 관리자에게 이메일 등록을 요청하세요.</p>
      <ErrorText message={error} />
      {config?.googleClientId ? (
        <div ref={buttonRef} className="min-h-11" />
      ) : (
        config && <p className="rounded-xl bg-chip p-3 text-sm text-body">구글 로그인이 아직 설정되지 않았어요. api/.env에 GOOGLE_CLIENT_ID를 넣으면 버튼이 나와요.</p>
      )}
      {config?.devLogin && (
        <Card className="p-4">
          <form onSubmit={devLogin} className="flex flex-col gap-2">
            <p className="text-sm font-bold">개발용 로그인 <span className="font-medium text-muted">(AUTH_DEV_LOGIN=true일 때만 보여요)</span></p>
            <input type="email" required placeholder="ADMIN_EMAILS·EDITOR_EMAILS에 있는 이메일" value={devEmail} onChange={(e) => setDevEmail(e.target.value)} className={fieldCls} />
            <button className="rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white">이메일로 로그인</button>
          </form>
        </Card>
      )}
    </div>
  );
}
