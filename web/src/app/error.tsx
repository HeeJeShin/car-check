"use client";
// 서버에서 화면을 만들다 실패했을 때 (API 서버가 꺼져 있는 경우 등). 미리 만들어 둔 화면이 있으면 그걸 계속 보여주므로,
// 이 화면은 "처음 만드는 중에" API가 안 될 때만 보입니다.
import { useEffect } from "react";
import { TopBar } from "@/components/ui";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);
  return (
    <>
      <TopBar back="/" backLabel="처음으로" />
      <section className="flex flex-col gap-4 p-5 pt-10">
        <h1 className="text-xl font-bold">잠시 정보를 불러오지 못했어요</h1>
        <p className="text-sm leading-relaxed text-body">잠시 후 다시 시도해주세요.</p>
        <button type="button" onClick={reset} className="rounded-xl bg-accent p-4 text-base font-bold text-white">다시 시도</button>
      </section>
    </>
  );
}
