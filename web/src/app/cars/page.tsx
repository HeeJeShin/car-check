"use client";
// 2. 차종 선택 (기획 캔버스 "2. 차종 선택"): 여기서는 차 이름만 고릅니다. 연식은 다음 화면에서.
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ErrorText, Loading, Pill, TopBar } from "@/components/ui";
import { BODY_LABEL, api, generationsHref, type BodyType, type ModelCard } from "@/lib/api";

// 국산 제조사는 각자 탭, 나머지는 "수입" 탭 하나로 묶습니다.
const DOMESTIC = ["현대", "기아", "제네시스", "쉐보레", "르노코리아", "KG모빌리티"];
const tabOf = (maker: string) => (DOMESTIC.includes(maker) ? maker : "수입");

export default function CarSelectPage() {
  const [models, setModels] = useState<ModelCard[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("현대");
  const [body, setBody] = useState<BodyType | "ALL">("ALL");
  const [q, setQ] = useState("");

  useEffect(() => {
    api<ModelCard[]>("/cars/models").then(setModels, (err: Error) => setError(err.message));
  }, []);

  // 데이터에 있는 제조사만 탭으로. 국산(정해진 순서) 먼저, 수입은 맨 뒤.
  const tabs = useMemo(() => {
    const present = new Set((models ?? []).map((m) => tabOf(m.maker)));
    return [...DOMESTIC, "수입"].filter((t) => present.has(t));
  }, [models]);

  // 차 종류 필터: 데이터에 있는 종류만, 정해진 순서로.
  const bodies = (Object.keys(BODY_LABEL) as BodyType[]).filter((b) => (models ?? []).some((m) => m.bodyType === b));

  // 검색어가 있으면 제조사 탭과 상관없이 전체에서 이름·별칭으로 찾습니다. 차 종류 필터는 항상 적용.
  const keyword = q.trim().toLowerCase().replace(/\s/g, "");
  const shown = (models ?? []).filter(
    (m) =>
      (body === "ALL" || m.bodyType === body) &&
      (keyword ? [m.name, ...m.aliases].some((n) => n.toLowerCase().replace(/\s/g, "").includes(keyword)) : tabOf(m.maker) === tab),
  );

  return (
    <>
      <TopBar back="/" backLabel="처음으로" right="1 / 3 단계" />
      <section className="flex flex-col gap-4 bg-white px-5 pt-7 pb-4">
        <h1 className="text-2xl font-bold tracking-tight">어떤 차를 사려고 하세요?</h1>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-muted">차 이름으로 찾기</span>
          <span className="flex h-12 items-center gap-2 rounded-xl border border-field bg-white px-3.5 focus-within:border-accent">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5B6270" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-4-4" />
            </svg>
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="예: 투싼, K5, 520d" className="flex-1 bg-transparent text-[15px] outline-none" />
          </span>
        </label>
        {!keyword && (
          <div className="flex flex-wrap gap-2" aria-label="제조사">
            {tabs.map((t) => (
              <Pill key={t} on={t === tab} onClick={() => setTab(t)}>{t}</Pill>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-1.5 border-t border-chip pt-3" aria-label="차 종류">
          {(["ALL", ...bodies] as const).map((b) => (
            <button
              key={b}
              type="button"
              aria-pressed={body === b}
              onClick={() => setBody(b)}
              className={`min-h-10 rounded-lg px-3 text-[13px] ${body === b ? "bg-accent-soft font-bold text-accent" : "bg-chip font-medium text-body"}`}
            >
              {b === "ALL" ? "전체" : BODY_LABEL[b]}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3 p-5">
        <ErrorText message={error} />
        {!models && !error && <Loading />}
        {models && (
          <p className="text-sm font-bold">
            {keyword ? `'${q.trim()}' 검색 결과` : `${tab} 차종`}
            {body !== "ALL" && ` · ${BODY_LABEL[body]}`} <span className="font-medium text-muted">{shown.length}개</span>
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          {shown.map((m) => (
            <Link key={`${m.maker}/${m.name}`} href={generationsHref(m.maker, m.name)} className="flex flex-col gap-1 rounded-[14px] border border-line bg-white p-3.5 hover:border-accent">
              <span className="text-base font-bold">{tabOf(m.maker) === "수입" ? `${m.maker} ${m.name}` : m.name}</span>
              <span className="text-xs text-muted">{BODY_LABEL[m.bodyType]} · 세대 {m.generations}개</span>
            </Link>
          ))}
        </div>
        {models && shown.length === 0 && <p className="rounded-[14px] bg-white p-4 text-sm text-body">찾는 차가 아직 없어요.</p>}
        <p className="mt-2 text-[13px] leading-relaxed text-muted">찾는 차가 없나요? 고질병 데이터는 인기 차종부터 계속 늘려가고 있어요.</p>
      </section>
    </>
  );
}
