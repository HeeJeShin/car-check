"use client";
// 리포트의 "내 차량에 담기". 로그인하지 않았으면 로그인 창을 띄우고, 로그인이 끝나면 페이지를 옮기지 않고 그대로 담습니다.
import Link from "next/link";
import { useEffect, useState } from "react";
import { LoginButtons } from "@/components/login-buttons";
import { ErrorText } from "@/components/ui";
import { ApiError, api, loginToken, saveLoginToken, type Favorite } from "@/lib/api";

export function FavoriteButton({ carModelId }: { carModelId: number }) {
  const [saved, setSaved] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loginToken()) return;
    api<Favorite[]>("/favorites").then(
      (list) => setSaved(list.some((f) => f.id === carModelId)),
      (err: Error) => {
        if (err instanceof ApiError && err.status === 401) saveLoginToken(null); // 만료된 토큰
      },
    );
  }, [carModelId]);

  async function change(next: boolean) {
    setBusy(true);
    setError(null);
    try {
      await api(`/favorites/${carModelId}`, { method: next ? "PUT" : "DELETE" });
      setSaved(next);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        saveLoginToken(null);
        setLoginOpen(true);
      } else {
        setError((err as Error).message);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-pressed={saved}
          disabled={busy}
          onClick={() => (loginToken() ? change(!saved) : setLoginOpen(true))}
          className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border text-sm font-bold disabled:opacity-60 ${saved ? "border-primary bg-primary-soft text-primary" : "border-field bg-white text-ink"}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 20.5s-7.5-4.6-9.3-9.2C1.5 8 3.6 4.5 7.2 4.5c2 0 3.7 1 4.8 2.8 1.1-1.8 2.8-2.8 4.8-2.8 3.6 0 5.7 3.5 4.5 6.8-1.8 4.6-9.3 9.2-9.3 9.2z" />
          </svg>
          {saved ? "내 차량에 담겼어요" : "내 차량에 담기"}
        </button>
        {saved && <Link href="/my-cars" className="flex min-h-11 items-center px-2 text-sm font-medium text-primary">내 차량 보기</Link>}
      </div>
      <ErrorText message={error} />
      {loginOpen && (
        <LoginSheet
          onClose={() => setLoginOpen(false)}
          onLogin={() => {
            setLoginOpen(false);
            change(true);
          }}
        />
      )}
    </div>
  );
}

function LoginSheet({ onClose, onLogin }: { onClose: () => void; onLogin: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/50 md:items-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="login-sheet-title" className="flex w-full max-w-md flex-col gap-4 rounded-t-2xl bg-white p-5 pb-8 md:rounded-2xl md:pb-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <h2 id="login-sheet-title" className="text-lg font-bold tracking-tight">로그인하면 내 차량에 담을 수 있어요</h2>
          <button type="button" autoFocus aria-label="닫기" onClick={onClose} className="-mt-2 -mr-2 flex h-11 w-11 flex-none items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <p className="text-sm leading-relaxed text-body">담아 둔 차는 내 차량에서 언제든 다시 볼 수 있어요.</p>
        <LoginButtons onLogin={onLogin} />
      </div>
    </div>
  );
}
