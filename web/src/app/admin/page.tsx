"use client";
// 데이터 관리: 차종 추가, 고질병 추가·검증·삭제.
// 직접 찾아본 정보를 넣는 곳입니다. "검증됨"은 출처 URL이 있어야 저장됩니다(서버 규칙).
// 다음 단계: 로그인을 붙여 관리자만 들어오게 막기.
import { useEffect, useState } from "react";
import { Card, ErrorText, SeverityText, StatusBadge, buttonCls, inputCls, subtleButtonCls } from "@/components/ui";
import { PARTS, api, yearText, type CarDetail, type CarModel, type Severity } from "@/lib/api";

export default function AdminPage() {
  const [cars, setCars] = useState<CarModel[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<CarDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  // 저장·삭제 후 이 숫자를 올리면 아래 effect들이 다시 돌아 목록을 새로 불러옵니다.
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    api<CarModel[]>("/cars").then(
      (list) => {
        setCars(list);
        setSelectedId((cur) => cur ?? list[0]?.id ?? null);
      },
      (err: Error) => setError(err.message),
    );
  }, [reloadKey]);

  useEffect(() => {
    if (!selectedId) return;
    api<CarDetail>(`/cars/${selectedId}`).then(setDetail, (err: Error) => setError(err.message));
  }, [selectedId, reloadKey]);

  // 성공하면 목록을 다시 불러오고, 실패하면 서버가 준 이유를 그대로 보여줍니다.
  async function run(action: () => Promise<unknown>) {
    setError(null);
    try {
      await action();
      setReloadKey((k) => k + 1);
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  }

  async function verify(issueId: number, currentUrl: string | null) {
    const sourceUrl = window.prompt("확인한 출처 URL을 넣어주세요 (네이버 카페 글, 리콜 공지 등)", currentUrl ?? "https://");
    if (!sourceUrl) return;
    await run(() => api(`/issues/${issueId}`, { method: "PATCH", json: { status: "VERIFIED", sourceUrl } }));
  }

  async function remove(issueId: number) {
    if (!window.confirm("이 고질병을 삭제할까요?")) return;
    await run(() => api(`/issues/${issueId}`, { method: "DELETE" }));
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold">데이터 관리</h1>
        <p className="mt-1 text-sm text-zinc-500">직접 찾아본 고질병 정보를 넣고, 초안을 확인해서 &quot;검증됨&quot;으로 바꿔요.</p>
      </section>

      <ErrorText message={error} />

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="mr-auto text-lg font-semibold">차종별 고질병</h2>
          <select className={`${inputCls} w-auto`} value={selectedId ?? ""} onChange={(e) => setSelectedId(Number(e.target.value))}>
            {cars.map((c) => (
              <option key={c.id} value={c.id}>
                {c.maker} {c.name} {c.generation} ({yearText(c)}) · {c._count?.issues ?? 0}건
              </option>
            ))}
          </select>
        </div>
        {detail?.issues.map((issue) => (
          <Card key={issue.id}>
            <div className="flex flex-wrap items-center gap-2">
              <SeverityText severity={issue.severity} />
              <span className="text-xs text-zinc-500">{issue.part}{issue.engine && ` · ${issue.engine}`}</span>
              <span className="ml-auto"><StatusBadge status={issue.status} /></span>
            </div>
            <p className="mt-2 font-semibold">{issue.title}</p>
            <p className="mt-1 text-sm">{issue.description}</p>
            <p className="mt-1 text-sm text-zinc-500">확인법: {issue.checkHow}</p>
            {issue.note && <p className="mt-1 text-xs text-zinc-500">메모: {issue.note}</p>}
            <div className="mt-3 flex gap-2">
              {issue.status === "DRAFT" && (
                <button className={subtleButtonCls} onClick={() => verify(issue.id, issue.sourceUrl)}>검증됨으로</button>
              )}
              <button className={subtleButtonCls} onClick={() => remove(issue.id)}>삭제</button>
            </div>
          </Card>
        ))}
        {selectedId && <IssueForm carModelId={selectedId} onSubmit={(body) => run(() => api("/issues", { method: "POST", json: body }))} />}
      </section>

      <CarForm onSubmit={(body) => run(() => api("/cars", { method: "POST", json: body }))} />
    </div>
  );
}

function IssueForm({ carModelId, onSubmit }: { carModelId: number; onSubmit: (body: object) => Promise<boolean> }) {
  const empty = { engine: "", part: "엔진", title: "", description: "", checkHow: "", severity: "MEDIUM" as Severity, sourceUrl: "", note: "" };
  const [f, setF] = useState(empty);
  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    // 빈 선택 항목은 아예 보내지 않습니다(서버 DTO가 빈 문자열 URL 등을 거절하므로).
    const body = Object.fromEntries(Object.entries({ ...f, carModelId }).filter(([, v]) => v !== ""));
    if (await onSubmit(body)) setF(empty);
  }

  return (
    <Card>
      <form onSubmit={submit} className="space-y-2">
        <p className="font-semibold">고질병 추가</p>
        <div className="grid gap-2 sm:grid-cols-3">
          <select className={inputCls} value={f.part} onChange={set("part")}>
            {PARTS.map((p) => <option key={p}>{p}</option>)}
          </select>
          <select className={inputCls} value={f.severity} onChange={set("severity")}>
            <option value="HIGH">위험 높음</option>
            <option value="MEDIUM">주의</option>
            <option value="LOW">참고</option>
          </select>
          <input className={inputCls} placeholder="엔진 (선택, 예: 1.7 디젤)" value={f.engine} onChange={set("engine")} />
        </div>
        <input className={inputCls} placeholder="제목 (예: 7단 DCT 저속 변속 충격)" value={f.title} onChange={set("title")} />
        <textarea className={`${inputCls} h-16`} placeholder="어떤 문제인지" value={f.description} onChange={set("description")} />
        <textarea className={`${inputCls} h-16`} placeholder="살 때 어떻게 확인하는지" value={f.checkHow} onChange={set("checkHow")} />
        <input className={inputCls} placeholder="출처 URL (선택, 넣으면 나중에 검증 처리하기 쉬워요)" value={f.sourceUrl} onChange={set("sourceUrl")} />
        <input className={inputCls} placeholder="메모 (선택)" value={f.note} onChange={set("note")} />
        <button className={buttonCls}>초안으로 추가</button>
      </form>
    </Card>
  );
}

function CarForm({ onSubmit }: { onSubmit: (body: object) => Promise<boolean> }) {
  const empty = { maker: "", name: "", generation: "", yearFrom: "", yearTo: "", aliases: "" };
  const [f, setF] = useState(empty);
  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await onSubmit({
      maker: f.maker,
      name: f.name,
      generation: f.generation,
      yearFrom: Number(f.yearFrom),
      ...(f.yearTo && { yearTo: Number(f.yearTo) }),
      aliases: f.aliases.split(",").map((a) => a.trim()).filter(Boolean),
    });
    if (ok) setF(empty);
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">차종(세대) 추가</h2>
      <Card>
        <form onSubmit={submit} className="grid gap-2 sm:grid-cols-3">
          <input className={inputCls} placeholder="제조사 (예: 현대)" value={f.maker} onChange={set("maker")} />
          <input className={inputCls} placeholder="차종 (예: 싼타페)" value={f.name} onChange={set("name")} />
          <input className={inputCls} placeholder="세대 (예: TM)" value={f.generation} onChange={set("generation")} />
          <input className={inputCls} placeholder="시작 연식 (예: 2018)" inputMode="numeric" value={f.yearFrom} onChange={set("yearFrom")} />
          <input className={inputCls} placeholder="끝 연식 (비우면 현재)" inputMode="numeric" value={f.yearTo} onChange={set("yearTo")} />
          <input className={inputCls} placeholder="별칭, 쉼표로 (예: santafe, 싼타페tm)" value={f.aliases} onChange={set("aliases")} />
          <div><button className={buttonCls}>차종 추가</button></div>
        </form>
      </Card>
    </section>
  );
}
