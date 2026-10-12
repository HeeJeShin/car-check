"use client";
// 차종(세대) 상세: 고질병 목록 + 구매 시 확인법 + 모든 중고차 공통 점검
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, ErrorText, SeverityText, StatusBadge } from "@/components/ui";
import { api, yearText, type CarDetail } from "@/lib/api";

export default function CarPage() {
  const { id } = useParams<{ id: string }>();
  const [car, setCar] = useState<CarDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<CarDetail>(`/cars/${id}`).then(setCar, (err: Error) => setError(err.message));
  }, [id]);

  if (error) return <ErrorText message={error} />;
  if (!car) return <p className="text-sm text-zinc-500">불러오는 중…</p>;

  const hasDraft = car.issues.some((i) => i.status === "DRAFT");

  return (
    <div className="space-y-6">
      <section>
        <Link href="/" className="text-sm text-zinc-500 hover:underline">← 다시 검색</Link>
        <h1 className="mt-2 text-2xl font-bold">
          {car.maker} {car.name} <span className="text-zinc-500">{car.generation}</span>
        </h1>
        <p className="text-sm text-zinc-500">{yearText(car)}년식</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">고질병 · 주의사항 ({car.issues.length})</h2>
        {hasDraft && (
          <p className="text-xs text-zinc-500">
            &quot;초안&quot; 표시는 아직 출처를 확인하지 않은 정보예요. 구매 판단 전에 정비소나 동호회에서 한 번 더 확인하세요.
          </p>
        )}
        {car.issues.length === 0 && <Card><p className="text-sm text-zinc-500">아직 등록된 고질병이 없어요.</p></Card>}
        {car.issues.map((issue) => (
          <Card key={issue.id}>
            <div className="flex flex-wrap items-center gap-2">
              <SeverityText severity={issue.severity} />
              <span className="text-xs text-zinc-500">{issue.part}{issue.engine && ` · ${issue.engine}`}</span>
              <span className="ml-auto"><StatusBadge status={issue.status} /></span>
            </div>
            <h3 className="mt-2 font-semibold">{issue.title}</h3>
            <p className="mt-1 text-sm">{issue.description}</p>
            <div className="mt-3 rounded-lg bg-blue-50 p-3 text-sm dark:bg-blue-950/40">
              <span className="font-semibold">살 때 확인할 것 </span>
              {issue.checkHow}
            </div>
            {issue.sourceUrl && (
              <a href={issue.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-blue-600 underline">
                출처 보기
              </a>
            )}
          </Card>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">모든 중고차 공통 점검</h2>
        <Card>
          <ul className="space-y-2 text-sm">
            {car.generalChecks.map((c) => (
              <li key={c.title}>
                <span className="font-semibold">{c.title}</span> — {c.checkHow}
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
}
