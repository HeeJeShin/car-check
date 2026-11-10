"use client";
// 서버에서 화면을 만들다 실패했을 때 (API 서버가 꺼져 있는 경우 등). 미리 만들어 둔 화면이 있으면 그걸 계속 보여주므로,
// 이 화면은 "처음 만드는 중에" API가 안 될 때만 보입니다.
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { PageBar } from "@/components/page-bar";
import { Button } from "@/components/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
    Sentry.captureException(error);
  }, [error]);
  return (
    <>
      <PageBar back="/" backLabel="처음으로" title="안내" />
      <section className="flex flex-col gap-4 p-5 pt-10">
        <h1 className="text-xl font-bold">잠시 정보를 불러오지 못했어요</h1>
        <p className="text-sm leading-relaxed text-body">잠시 후 다시 시도해주세요.</p>
        <Button type="button" onClick={reset}>다시 시도</Button>
      </section>
    </>
  );
}
