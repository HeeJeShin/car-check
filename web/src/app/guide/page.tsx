"use client";
// 5. AI 차량 추천: 차를 못 정했을 때 조건을 한 문장으로 받아, 등록된 차 중에서 차종·연식을 골라 줍니다.
// AI가 꺼져 있어도(키 없음) 화면은 뜨고, 위에 안내만 보여줍니다.
import Link from "next/link";
import { useEffect, useState } from "react";
import { PageBar } from "@/components/page-bar";
import { Card, ErrorText } from "@/components/ui";
import { api, type AiMode, type RecommendResult } from "@/lib/api";
import { Button } from "@/components/button";

const MODE_TEXT: Record<Exclude<AiMode, "gemini">, string> = {
  mock: "목 모드: 실제 AI 대신 샘플 답변이 나와요 (USE_MOCK_AI=true)",
  off: "AI가 꺼져 있어요. api/.env에 GEMINI_API_KEY를 넣거나 USE_MOCK_AI=true로 바꾸면 쓸 수 있어요. 차종 검색·고질병은 AI 없이도 돼요.",
};

const EXAMPLES = ["돈이 적게 들었으면 해요", "유지비 적은 차 추천해 주세요", "가족 4명이 탈 SUV", "초보라 주차 쉬운 차"];

export default function GuidePage() {
  const [mode, setMode] = useState<AiMode | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [request, setRequest] = useState("");
  const [result, setResult] = useState<RecommendResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api<{ mode: AiMode }>("/ai/status").then((r) => setMode(r.mode), (err: Error) => setStatusError(err.message));
  }, []);

  const disabled = mode === "off" || loading;

  async function recommend(text: string) {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      setResult(await api<RecommendResult>("/ai/recommend", { method: "POST", json: { request: text } }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageBar back="/" backLabel="처음으로" title="AI 차량 추천" />
      <section className="flex flex-col gap-3.5 bg-white px-5 pt-7 pb-5">
        <h1 className="text-2xl font-bold tracking-tight">아직 차를 못 정했어도 괜찮아요</h1>
        <p className="text-sm leading-relaxed text-body">원하는 조건을 한 문장으로 말해 주세요. 맞는 차와 연식을 골라 드려요.</p>
        {mode && mode !== "gemini" && <p className="rounded-[10px] bg-warning-soft p-3 text-[13px] leading-relaxed text-warning">{MODE_TEXT[mode]}</p>}
        <ErrorText message={statusError} />
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((q) => (
            <button key={q} type="button" disabled={disabled} onClick={() => { setRequest(q); recommend(q); }} className="min-h-10 rounded-full border border-field bg-white px-3 text-[13px] disabled:opacity-50">
              {q}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); recommend(request); }} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] text-muted">직접 말하기</span>
            <textarea
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              maxLength={200}
              placeholder="예: 출퇴근용인데 돈이 적게 들었으면 해요"
              className="h-24 resize-none rounded-xl border border-field bg-white px-3.5 py-3 text-[15px] outline-none focus:border-primary"
            />
          </label>
          <Button disabled={disabled || !request.trim()}>{loading ? "고르는 중…" : "추천받기"}</Button>
        </form>
        <ErrorText message={error} />
      </section>

      {result && (
        <section className="flex flex-col gap-3 p-5">
          <p className="text-sm font-bold">추천 결과</p>
          {result.cars.length === 0 ? (
            <p className="text-sm leading-relaxed text-body">아직 등록된 차 중에는 맞는 차가 없어요. 조건을 조금 바꿔서 다시 말해 주세요.</p>
          ) : (
            <>
              <p className="text-sm text-body">{result.summary}</p>
              {result.cars.map((car) => (
                <Card key={car.id} className="flex flex-col gap-1.5 p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-base font-bold">{car.maker} {car.label}</span>
                    <span className="flex-none text-[13px] text-muted">{car.yearRange}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-body">{car.why}</p>
                  <p className="text-[13px] leading-relaxed text-caution-strong">주의: {car.watchOut}</p>
                  <Link href={`/cars/${car.id}`} className="py-2 text-sm font-medium text-primary">이 차 고질병 보기 →</Link>
                </Card>
              ))}
              <p className="text-xs leading-relaxed text-muted">AI 추천은 참고용이에요. 실제 시세는 매물에서, 고질병은 차종 리포트에서 확인해 주세요.</p>
            </>
          )}
        </section>
      )}
    </>
  );
}
