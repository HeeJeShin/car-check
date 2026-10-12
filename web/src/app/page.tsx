"use client";
// 메인: 차종 + 연식 검색 → 해당 세대 고르기 → 상세(고질병) 화면으로
import Link from "next/link";
import { useState } from "react";
import { Card, ErrorText, buttonCls, inputCls } from "@/components/ui";
import { api, yearText, type CarModel } from "@/lib/api";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [year, setYear] = useState("");
  const [results, setResults] = useState<CarModel[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ q: q.trim(), ...(year && { year }) });
      setResults(await api<CarModel[]>(`/cars/search?${params}`));
    } catch (err) {
      setError((err as Error).message);
      setResults(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold">중고차, 사기 전에 이것부터</h1>
        <p className="mt-1 text-sm text-zinc-500">차종과 연식을 넣으면 그 차의 고질병과 구매할 때 확인할 점을 알려드려요.</p>
      </section>

      <form onSubmit={onSubmit} className="flex flex-wrap gap-2">
        <input className={`${inputCls} min-w-40 flex-1`} placeholder="차종 (예: 투싼, K5, 520d)" value={q} onChange={(e) => setQ(e.target.value)} />
        <input className={`${inputCls} w-32`} placeholder="연식 (예: 2015)" inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, ""))} />
        <button className={buttonCls} disabled={loading}>
          {loading ? "찾는 중…" : "검색"}
        </button>
      </form>

      <ErrorText message={error} />

      {results && results.length === 0 && (
        <Card>
          <p className="text-sm">아직 등록되지 않은 차종이에요.</p>
          <p className="mt-1 text-sm text-zinc-500">
            <Link href="/admin" className="text-blue-600 underline">데이터 관리</Link>에서 추가하거나,{" "}
            <Link href="/guide" className="text-blue-600 underline">AI 가이드</Link>에서 무엇부터 볼지 물어보세요.
          </p>
        </Card>
      )}

      {results && results.length > 1 && (
        <p className="text-sm font-medium">
          {year ? `${year}년식` : "이 차종"}은 세대가 {results.length}개예요. 세대마다 고질병이 달라서, 차량등록증의 최초 등록일이나 모델명을 보고 골라주세요.
        </p>
      )}

      <div className="grid gap-3">
        {results?.map((car) => (
          <Link key={car.id} href={`/cars/${car.id}`}>
            <Card className="transition hover:border-blue-500">
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-semibold">
                  {car.maker} {car.name} <span className="text-zinc-500">{car.generation}</span>
                </p>
                <span className="text-sm text-zinc-500">{yearText(car)}</span>
              </div>
              <p className="mt-1 text-sm text-zinc-500">등록된 고질병·주의사항 {car._count?.issues ?? 0}건 →</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
