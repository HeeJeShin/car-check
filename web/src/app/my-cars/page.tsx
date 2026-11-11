"use client";
// 내 차량: 리포트에서 담아 둔 차(세대) 목록. 로그인해야 볼 수 있습니다.
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AuthPanel } from "@/components/auth-panel";
import { PageBar, PcPageTitle } from "@/components/page-bar";
import { PageCard } from "@/components/page-card";
import { Card, ChevronRight, ErrorText, Loading } from "@/components/ui";
import { ApiError, api, loginToken, saveLoginToken, yearText, type Favorite } from "@/lib/api";
import { Button, LinkButton } from "@/components/button";

export default function MyCarsPage() {
  const [items, setItems] = useState<Favorite[] | null>(null);
  const [needLogin, setNeedLogin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleError = useCallback((err: Error) => {
    if (err instanceof ApiError && err.status === 401) {
      saveLoginToken(null); // 만료된 토큰
      setItems(null);
      setNeedLogin(true);
    } else {
      setError(err.message);
    }
  }, []);

  const load = useCallback(() => {
    (loginToken() ? api<Favorite[]>("/favorites") : Promise.reject(new ApiError("로그인이 필요합니다.", 401))).then((list) => {
      setNeedLogin(false);
      setItems(list);
    }, handleError);
  }, [handleError]);

  useEffect(load, [load]);

  function logout() {
    saveLoginToken(null);
    setItems(null);
    setNeedLogin(true);
  }

  async function remove(id: number) {
    setError(null);
    try {
      await api(`/favorites/${id}`, { method: "DELETE" });
      setItems((list) => list?.filter((f) => f.id !== id) ?? null);
    } catch (err) {
      handleError(err as Error);
    }
  }

  async function deleteAccount() {
    setError(null);
    try {
      await api("/auth/me", { method: "DELETE" });
      setConfirmDelete(false);
      logout();
    } catch (err) {
      handleError(err as Error);
    }
  }

  return (
    <>
      <PageBar
        back="/"
        backLabel="처음으로"
        title="내 차량"
        right={items ? <button type="button" onClick={logout} className="min-h-11 px-2">로그아웃</button> : undefined}
      />
      {needLogin ? (
        <PageCard>
          <h1 className="text-xl font-bold">로그인하면 내 차량을 볼 수 있어요</h1>
          <p className="text-sm leading-relaxed text-body">고질병 리포트에서 담아 둔 차를 여기서 다시 볼 수 있어요.</p>
          <AuthPanel onLogin={load} />
        </PageCard>
      ) : !items && !error ? (
        <Loading />
      ) : (
        <section className="flex flex-col gap-2.5 p-5">
          {items && <PcPageTitle title="내 차량" right={<button type="button" onClick={logout} className="min-h-11 px-2">로그아웃</button>} />}
          <ErrorText message={error} />
          {items?.length === 0 && (
            <div className="flex flex-col gap-4 py-10 text-center">
              <p className="text-base font-bold">아직 담은 차가 없어요</p>
              <p className="text-sm text-body">차종을 찾아 고질병 리포트에서 담아 보세요.</p>
              <LinkButton href="/cars">차종 찾기</LinkButton>
            </div>
          )}
          {items?.map((car) => (
            <Card key={car.id} className="flex items-center gap-1 p-1.5 pl-4">
              <Link href={`/cars/${car.id}`} className="flex min-w-0 flex-1 items-center gap-2 py-2.5">
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-[13px] text-muted">{car.maker} · 고질병 {car.issueCount}건</span>
                  <span className="text-base font-bold">{car.displayName} ({yearText(car)})</span>
                </span>
                <ChevronRight />
              </Link>
              <button type="button" aria-label={`${car.displayName} 삭제`} onClick={() => remove(car.id)} className="min-h-11 flex-none px-3 text-[13px] text-muted">삭제</button>
            </Card>
          ))}
          {items && (
            <div className="mt-8 flex flex-col gap-2 border-t border-line pt-4 text-[13px] text-muted">
              {confirmDelete ? (
                <>
                  <p className="leading-relaxed">계정 정보와 담아 둔 차가 모두 지워지고 되돌릴 수 없어요.</p>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" onClick={deleteAccount}>회원탈퇴 확인</Button>
                    <button type="button" onClick={() => setConfirmDelete(false)} className="min-h-11 px-3">취소</button>
                  </div>
                </>
              ) : (
                <button type="button" onClick={() => setConfirmDelete(true)} className="min-h-11 self-start underline">회원탈퇴</button>
              )}
            </div>
          )}
        </section>
      )}
    </>
  );
}
