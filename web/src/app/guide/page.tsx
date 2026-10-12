"use client";
// AI 가이드: ① 아무것도 모를 때 무엇부터 ② 용도·예산별 차종 추천
// AI가 꺼져 있어도(키 없음) 화면은 뜨고, 상단에 안내만 보여줍니다.
import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, ErrorText, buttonCls, inputCls } from "@/components/ui";
import { api, type AiMode, type RecommendResult } from "@/lib/api";

const MODE_TEXT: Record<AiMode, string> = {
  gemini: "Gemini 연결됨",
  mock: "목 모드: 실제 AI 대신 샘플 답변이 나와요 (USE_MOCK_AI=true)",
  off: "AI 꺼짐: api/.env에 GEMINI_API_KEY를 넣거나 USE_MOCK_AI=true로 바꾸면 쓸 수 있어요. 차종 검색은 AI 없이도 됩니다.",
};

export default function GuidePage() {
  const [mode, setMode] = useState<AiMode | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  useEffect(() => {
    api<{ mode: AiMode }>("/ai/status").then((r) => setMode(r.mode), (err: Error) => setStatusError(err.message));
  }, []);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold">AI 가이드</h1>
        <p className="mt-1 text-sm text-zinc-500">차를 잘 몰라도 괜찮아요. 무엇부터 볼지, 어떤 차가 맞을지 물어보세요.</p>
        {mode && (
          <p className={`mt-3 rounded-lg p-3 text-sm ${mode === "gemini" ? "bg-emerald-50 dark:bg-emerald-950/40" : "bg-amber-50 dark:bg-amber-950/40"}`}>
            {MODE_TEXT[mode]}
          </p>
        )}
        <ErrorText message={statusError} />
      </section>
      <GuideForm disabled={mode === "off"} />
      <RecommendForm disabled={mode === "off"} />
    </div>
  );
}

function GuideForm({ disabled }: { disabled: boolean }) {
  const [question, setQuestion] = useState("차를 하나도 모르는데 첫 중고차 사려면 뭐부터 알아봐야 해요?");
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      setAnswer((await api<{ answer: string }>("/ai/guide", { method: "POST", json: { question } })).answer);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">무엇부터 알아볼까요?</h2>
      <form onSubmit={onSubmit} className="space-y-2">
        <textarea className={`${inputCls} h-20`} maxLength={500} value={question} onChange={(e) => setQuestion(e.target.value)} />
        <button className={buttonCls} disabled={disabled || loading || !question.trim()}>
          {loading ? "생각 중…" : "물어보기"}
        </button>
      </form>
      <ErrorText message={error} />
      {answer && <Card><p className="whitespace-pre-wrap text-sm leading-relaxed">{answer}</p></Card>}
    </section>
  );
}

function RecommendForm({ disabled }: { disabled: boolean }) {
  const [purpose, setPurpose] = useState("");
  const [budget, setBudget] = useState("");
  const [passengers, setPassengers] = useState("");
  const [notes, setNotes] = useState("");
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
          json: {
            purpose,
            budgetManwon: Number(budget),
            ...(passengers && { passengers: Number(passengers) }),
            ...(notes.trim() && { notes }),
          },
        }),
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">용도별 차종 추천</h2>
      <form onSubmit={onSubmit} className="grid gap-2 sm:grid-cols-2">
        <input className={inputCls} placeholder="용도 (예: 출퇴근 + 주말 캠핑)" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
        <input className={inputCls} placeholder="예산 (만원, 예: 1500)" inputMode="numeric" value={budget} onChange={(e) => setBudget(e.target.value.replace(/\D/g, ""))} />
        <input className={inputCls} placeholder="주로 타는 인원 (선택)" inputMode="numeric" value={passengers} onChange={(e) => setPassengers(e.target.value.replace(/\D/g, ""))} />
        <input className={inputCls} placeholder="기타 (선택, 예: 운전 초보)" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div>
          <button className={buttonCls} disabled={disabled || loading || !purpose.trim() || !budget}>
            {loading ? "고르는 중…" : "추천받기"}
          </button>
        </div>
      </form>
      <ErrorText message={error} />
      {result && (
        <div className="space-y-3">
          <p className="text-sm">{result.summary}</p>
          {result.cars.map((car) => (
            <Card key={car.name}>
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-semibold">{car.name}</p>
                <span className="text-sm text-zinc-500">{car.yearRange}</span>
              </div>
              <p className="mt-1 text-sm">{car.why}</p>
              <p className="mt-1 text-sm text-orange-700 dark:text-orange-400">주의: {car.watchOut}</p>
              {car.carModels.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-3">
                  {car.carModels.map((m) => (
                    <Link key={m.id} href={`/cars/${m.id}`} className="text-sm text-blue-600 underline">
                      {m.label} 고질병 보기
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-zinc-500">아직 고질병 데이터가 없는 차종이에요.</p>
              )}
            </Card>
          ))}
          <ul className="list-disc pl-5 text-sm text-zinc-600 dark:text-zinc-400">
            {result.nextSteps.map((s) => <li key={s}>{s}</li>)}
          </ul>
          <p className="text-xs text-zinc-500">AI 추천은 참고용이에요. 고질병은 위 링크의 검증된 데이터를 확인하세요.</p>
        </div>
      )}
    </section>
  );
}
