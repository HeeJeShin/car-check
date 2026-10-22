"use client";
// 5. AI 가이드 (기획 캔버스 "5. AI 가이드"): 차를 못 정했을 때만 AI를 씁니다.
// AI가 꺼져 있어도(키 없음) 화면은 뜨고, 위에 안내만 보여줍니다.
import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, ErrorText, Pill, TopBar, fieldCls, primaryBtn } from "@/components/ui";
import { api, generationsHref, type AiMode, type RecommendResult } from "@/lib/api";

const MODE_TEXT: Record<Exclude<AiMode, "gemini">, string> = {
  mock: "목 모드: 실제 AI 대신 샘플 답변이 나와요 (USE_MOCK_AI=true)",
  off: "AI가 꺼져 있어요. api/.env에 GEMINI_API_KEY를 넣거나 USE_MOCK_AI=true로 바꾸면 쓸 수 있어요. 차종 검색·고질병은 AI 없이도 돼요.",
};

const QUICK_QUESTIONS = ["첫 중고차, 뭐부터 알아봐요?", "딜러한테 뭘 물어봐야 해요?", "디젤 vs 가솔린, 뭐가 나아요?"];
const PURPOSES = ["출퇴근", "가족", "캠핑·여행", "첫 차", "장거리"];

export default function GuidePage() {
  const [mode, setMode] = useState<AiMode | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [tab, setTab] = useState<"start" | "recommend">("start");

  useEffect(() => {
    api<{ mode: AiMode }>("/ai/status").then((r) => setMode(r.mode), (err: Error) => setStatusError(err.message));
  }, []);

  const off = mode === "off";

  return (
    <>
      <TopBar back="/" backLabel="처음으로" right={<span className="rounded-md bg-accent-soft px-2 py-1 text-xs font-medium text-accent">AI 가이드</span>} />
      <section className="flex flex-col gap-3.5 bg-white px-5 pt-7 pb-0">
        <h1 className="text-2xl font-bold tracking-tight">아직 차를 못 정했어도 괜찮아요</h1>
        <p className="text-sm leading-relaxed text-body">무엇부터 알아볼지, 나에게 맞는 차가 뭔지 AI에게 물어보세요.</p>
        {mode && mode !== "gemini" && <p className="rounded-[10px] bg-[#FEF3C7] p-3 text-[13px] leading-relaxed text-[#92400E]">{MODE_TEXT[mode]}</p>}
        <ErrorText message={statusError} />
        <div role="tablist" className="flex gap-1.5">
          {([["start", "무엇부터 볼까요?"], ["recommend", "용도별 추천"]] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`min-h-11 flex-1 border-b-2 text-[15px] ${tab === key ? "border-ink font-bold" : "border-line font-medium text-muted"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>
      {tab === "start" ? <StartTab disabled={off} /> : <RecommendTab disabled={off} />}
    </>
  );
}

function StartTab({ disabled }: { disabled: boolean }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function ask(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      setAnswer((await api<{ answer: string }>("/ai/guide", { method: "POST", json: { question: q } })).answer);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex flex-col gap-3 p-5">
      <p className="text-sm font-bold">이런 걸 많이 물어봐요</p>
      <div className="flex flex-wrap gap-2">
        {QUICK_QUESTIONS.map((q) => (
          <button key={q} type="button" disabled={disabled || loading} onClick={() => { setQuestion(q); ask(q); }} className="min-h-10 rounded-full border border-field bg-white px-3 text-[13px] disabled:opacity-50">
            {q}
          </button>
        ))}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); ask(question); }} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-muted">직접 물어보기</span>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={500}
            placeholder="예: 차를 하나도 모르는데 첫 중고차 사려면 뭐부터 알아봐야 해요?"
            className="h-24 resize-none rounded-xl border border-field bg-white px-3.5 py-3 text-[15px] outline-none focus:border-accent"
          />
        </label>
        <button className={primaryBtn} disabled={disabled || loading || !question.trim()}>{loading ? "생각 중…" : "물어보기"}</button>
      </form>
      <ErrorText message={error} />
      {answer && (
        <Card className="flex flex-col gap-2 p-4">
          <span className="text-xs font-bold text-accent">AI 답변</span>
          <p className="text-sm leading-7 whitespace-pre-wrap text-body">{answer}</p>
        </Card>
      )}
    </section>
  );
}

function RecommendTab({ disabled }: { disabled: boolean }) {
  const [purpose, setPurpose] = useState("출퇴근");
  const [budget, setBudget] = useState("");
  const [passengers, setPassengers] = useState("");
  const [result, setResult] = useState<RecommendResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      setResult(
        await api<RecommendResult>("/ai/recommend", {
          method: "POST",
          json: { purpose, budgetManwon: Number(budget), ...(passengers && { passengers: Number(passengers) }) },
        }),
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex flex-col gap-3 p-5">
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <p className="text-sm font-bold">주로 어디에 쓰세요?</p>
        <div className="flex flex-wrap gap-2">
          {PURPOSES.map((p) => <Pill key={p} on={p === purpose} onClick={() => setPurpose(p)}>{p}</Pill>)}
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] text-muted">예산 (만원)</span>
            <input inputMode="numeric" placeholder="예: 1500" value={budget} onChange={(e) => setBudget(e.target.value.replace(/\D/g, ""))} className={fieldCls} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] text-muted">주로 타는 인원</span>
            <input inputMode="numeric" placeholder="예: 4" value={passengers} onChange={(e) => setPassengers(e.target.value.replace(/\D/g, ""))} className={fieldCls} />
          </label>
        </div>
        <button className={primaryBtn} disabled={disabled || loading || !budget}>{loading ? "고르는 중…" : "추천받기"}</button>
      </form>
      <ErrorText message={error} />

      {result && (
        <>
          <p className="mt-2 text-sm font-bold">추천 결과</p>
          <p className="text-sm text-body">{result.summary}</p>
          {result.cars.map((car) => (
            <Card key={car.name} className="flex flex-col gap-1.5 p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-base font-bold">{car.name}</span>
                <span className="text-[13px] text-muted">{car.yearRange}</span>
              </div>
              <p className="text-sm leading-relaxed text-body">{car.why}</p>
              <p className="text-[13px] leading-relaxed text-[#9A3412]">주의: {car.watchOut}</p>
              {car.carModels.length > 0 ? (
                <Link href={generationsHref(car.carModels[0].maker, car.carModels[0].name)} className="py-2 text-sm font-medium text-accent">
                  이 차 고질병 보기 →
                </Link>
              ) : (
                <p className="text-xs text-muted">아직 고질병 데이터가 없는 차종이에요.</p>
              )}
            </Card>
          ))}
          <ul className="list-disc pl-5 text-sm text-body">
            {result.nextSteps.map((s) => <li key={s}>{s}</li>)}
          </ul>
          <p className="text-xs leading-relaxed text-muted">AI 추천은 참고용이에요. 고질병은 사람이 확인한 데이터로 보여드려요.</p>
        </>
      )}
    </section>
  );
}
