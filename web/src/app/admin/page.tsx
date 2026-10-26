"use client";
// 데이터 관리: 차종(세대)·엔진 추가, 고질병 추가·검증·삭제, 본넷 점검 포인트 추가·삭제.
// 직접 찾아본 정보를 넣는 곳입니다. "검증됨"은 출처 URL이 있어야 저장됩니다(서버 규칙).
// 다음 단계: 로그인을 붙여 관리자만 들어오게 막기.
import { useEffect, useState } from "react";
import { refreshPublicPages } from "@/app/actions";
import { BonnetDiagram } from "@/components/bonnet-diagram";
import { Card, ErrorText, SeverityText, StatusBadge, TopBar, fieldCls } from "@/components/ui";
import { BODY_LABEL, FUEL_LABEL, PARTS, TRANSMISSION_LABEL, api, yearText, type CarModel, type CarReport, type Inspection, type Severity } from "@/lib/api";

const btn = "rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50";
const subtleBtn = "rounded-lg border border-field bg-white px-3 py-1.5 text-sm";
const textareaCls = "h-16 w-full rounded-xl border border-field bg-white px-3.5 py-2.5 text-sm outline-none focus:border-accent";

export default function AdminPage() {
  const [cars, setCars] = useState<CarModel[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [report, setReport] = useState<CarReport | null>(null);
  const [inspection, setInspection] = useState<Inspection | null>(null);
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
    api<CarReport>(`/cars/${selectedId}`).then(setReport, (err: Error) => setError(err.message));
    api<Inspection>(`/cars/${selectedId}/inspection`).then(setInspection, (err: Error) => setError(err.message));
  }, [selectedId, reloadKey]);

  // 성공하면 목록을 다시 불러오고, 실패하면 서버가 준 이유를 그대로 보여줍니다.
  // 미리 만들어 둔 조회 화면(ISR)도 지워서, 사용자 화면에 고친 내용이 바로 보이게 합니다.
  async function run(action: () => Promise<unknown>) {
    setError(null);
    try {
      await action();
      await refreshPublicPages();
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

  async function remove(path: string, what: string) {
    if (!window.confirm(`이 ${what}을(를) 삭제할까요?`)) return;
    await run(() => api(path, { method: "DELETE" }));
  }

  return (
    <>
      <TopBar back="/" backLabel="처음으로" title="데이터 관리" />
      <div className="flex flex-col gap-8 p-5">
        <p className="text-sm text-muted">직접 찾아본 정보를 넣고, 초안을 확인해서 &quot;검증됨&quot;으로 바꿔요.</p>
        <ErrorText message={error} />

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">차종(세대) 선택</h2>
          <select className={fieldCls} value={selectedId ?? ""} onChange={(e) => setSelectedId(Number(e.target.value))}>
            {cars.map((c) => (
              <option key={c.id} value={c.id}>
                {c.maker} {c.name} · {c.displayName} ({yearText(c)}) · 고질병 {c._count?.issues ?? 0}건
              </option>
            ))}
          </select>
          {report && (
            <p className="text-sm text-body">
              {report.powertrains.map((p) => `${p.engine} · ${p.gearbox ?? TRANSMISSION_LABEL[p.transmission]}`).join(" / ") || "엔진·미션 정보 없음"}
            </p>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">고질병</h2>
          {report?.issues.map((issue) => (
            <Card key={issue.id} className="p-4">
              <div className="flex items-center gap-2">
                <SeverityText severity={issue.severity} />
                <span className="text-xs text-muted">{issue.part}{issue.engine && ` · ${issue.engine}`}</span>
                <span className="ml-auto"><StatusBadge status={issue.status} /></span>
              </div>
              <p className="mt-2 font-bold">{issue.title}</p>
              <p className="mt-1 text-sm text-body">{issue.description}</p>
              <p className="mt-1 text-sm text-muted">확인법: {issue.checkHow}</p>
              {issue.note && <p className="mt-1 text-xs text-muted">메모: {issue.note}</p>}
              <div className="mt-3 flex gap-2">
                {issue.status === "DRAFT" && <button className={subtleBtn} onClick={() => verify(issue.id, issue.sourceUrl)}>검증됨으로</button>}
                <button className={subtleBtn} onClick={() => remove(`/issues/${issue.id}`, "고질병")}>삭제</button>
              </div>
            </Card>
          ))}
          {selectedId && <IssueForm carModelId={selectedId} onSubmit={(body) => run(() => api("/issues", { method: "POST", json: body }))} />}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">본넷 점검 포인트</h2>
          <p className="text-sm text-muted">1~7번은 모든 차 공통이에요. 이 차만의 포인트를 추가하면 점선 동그라미로 보여요.</p>
          {inspection && <BonnetDiagram points={inspection.points} selected={0} onSelect={() => {}} />}
          {inspection?.points.filter((p) => p.mine).map((p) => (
            <Card key={p.id} className="flex items-center gap-2 p-3 text-sm">
              <span className="font-bold">{p.no}. {p.title}</span>
              <span className="text-muted">({p.x}%, {p.y}%)</span>
              <button className={`${subtleBtn} ml-auto`} onClick={() => remove(`/inspection-points/${p.id}`, "점검 포인트")}>삭제</button>
            </Card>
          ))}
          {selectedId && <PointForm carModelId={selectedId} onSubmit={(body) => run(() => api("/inspection-points", { method: "POST", json: body }))} />}
        </section>

        <CarForm onSubmit={(body) => run(() => api("/cars", { method: "POST", json: body }))} />
      </div>
    </>
  );
}

// 빈 선택 항목은 아예 보내지 않습니다(서버 DTO가 빈 문자열 URL 등을 거절하므로).
const compact = (o: Record<string, unknown>) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== ""));

function IssueForm({ carModelId, onSubmit }: { carModelId: number; onSubmit: (body: object) => Promise<boolean> }) {
  const empty = { engine: "", part: "엔진", title: "", description: "", checkHow: "", severity: "MEDIUM" as Severity, sourceUrl: "", note: "" };
  const [f, setF] = useState(empty);
  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <Card className="p-4">
      <form onSubmit={async (e) => { e.preventDefault(); if (await onSubmit(compact({ ...f, carModelId }))) setF(empty); }} className="flex flex-col gap-2">
        <p className="font-bold">고질병 추가</p>
        <div className="grid grid-cols-2 gap-2">
          <select className={fieldCls} value={f.part} onChange={set("part")}>{PARTS.map((p) => <option key={p}>{p}</option>)}</select>
          <select className={fieldCls} value={f.severity} onChange={set("severity")}>
            <option value="HIGH">위험 높음</option>
            <option value="MEDIUM">주의</option>
            <option value="LOW">참고</option>
          </select>
        </div>
        <input className={fieldCls} placeholder="엔진 (선택, 예: 1.7 디젤)" value={f.engine} onChange={set("engine")} />
        <input className={fieldCls} placeholder="제목 (예: 7단 DCT 저속 변속 충격)" value={f.title} onChange={set("title")} />
        <textarea className={textareaCls} placeholder="어떤 문제인지" value={f.description} onChange={set("description")} />
        <textarea className={textareaCls} placeholder="살 때 어떻게 확인하는지" value={f.checkHow} onChange={set("checkHow")} />
        <input className={fieldCls} placeholder="출처 URL (선택)" value={f.sourceUrl} onChange={set("sourceUrl")} />
        <input className={fieldCls} placeholder="메모 (선택)" value={f.note} onChange={set("note")} />
        <div><button className={btn}>초안으로 추가</button></div>
      </form>
    </Card>
  );
}

function PointForm({ carModelId, onSubmit }: { carModelId: number; onSubmit: (body: object) => Promise<boolean> }) {
  const empty = { title: "", look: "", bad: "", x: "50", y: "50" };
  const [f, setF] = useState(empty);
  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await onSubmit({ carModelId, order: 100, title: f.title, look: f.look, bad: f.bad, x: Number(f.x), y: Number(f.y) });
    if (ok) setF(empty);
  }

  return (
    <Card className="p-4">
      <form onSubmit={submit} className="flex flex-col gap-2">
        <p className="font-bold">이 차 점검 포인트 추가</p>
        <input className={fieldCls} placeholder="제목 (예: 흡기 호스 균열)" value={f.title} onChange={set("title")} />
        <textarea className={textareaCls} placeholder="보는 법" value={f.look} onChange={set("look")} />
        <textarea className={textareaCls} placeholder="이러면 주의" value={f.bad} onChange={set("bad")} />
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-muted">가로 위치 % (왼쪽 0 → 오른쪽 100)<input className={fieldCls} inputMode="decimal" value={f.x} onChange={set("x")} /></label>
          <label className="text-xs text-muted">세로 위치 % (앞유리 0 → 범퍼 100)<input className={fieldCls} inputMode="decimal" value={f.y} onChange={set("y")} /></label>
        </div>
        <div><button className={btn}>포인트 추가</button></div>
      </form>
    </Card>
  );
}

function CarForm({ onSubmit }: { onSubmit: (body: object) => Promise<boolean> }) {
  const empty = { maker: "", name: "", displayName: "", generation: "", segment: "", bodyType: "SUV", yearFrom: "", yearTo: "", aliases: "", engine: "", fuel: "GASOLINE", transmission: "AT", gearbox: "", drive: "" };
  const [f, setF] = useState(empty);
  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await onSubmit(
      compact({
        maker: f.maker,
        name: f.name,
        displayName: f.displayName,
        generation: f.generation,
        segment: f.segment,
        bodyType: f.bodyType,
        yearFrom: Number(f.yearFrom),
        ...(f.yearTo && { yearTo: Number(f.yearTo) }),
        aliases: f.aliases.split(",").map((a) => a.trim()).filter(Boolean),
        // 엔진 이름을 넣었을 때만 엔진·미션 1개를 같이 저장합니다. 더 있으면 Swagger(POST /cars)로 넣으세요.
        ...(f.engine && { powertrains: [compact({ engine: f.engine, fuel: f.fuel, transmission: f.transmission, gearbox: f.gearbox, drive: f.drive })] }),
      }),
    );
    if (ok) setF(empty);
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-bold">차종(세대) 추가</h2>
      <Card className="p-4">
        <form onSubmit={submit} className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <input className={fieldCls} placeholder="제조사 (예: 현대)" value={f.maker} onChange={set("maker")} />
            <input className={fieldCls} placeholder="차종 (예: 싼타페)" value={f.name} onChange={set("name")} />
            <input className={fieldCls} placeholder="세대 이름 (예: 더 뉴 싼타페)" value={f.displayName} onChange={set("displayName")} />
            <input className={fieldCls} placeholder="세대 코드 (예: TM)" value={f.generation} onChange={set("generation")} />
            <input className={fieldCls} placeholder="시작 연식 (예: 2020)" inputMode="numeric" value={f.yearFrom} onChange={set("yearFrom")} />
            <input className={fieldCls} placeholder="끝 연식 (비우면 현재)" inputMode="numeric" value={f.yearTo} onChange={set("yearTo")} />
            <input className={fieldCls} placeholder="차급 (예: 중형 SUV)" value={f.segment} onChange={set("segment")} />
            <select className={fieldCls} value={f.bodyType} onChange={set("bodyType")} aria-label="차 종류">
              {Object.entries(BODY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <input className={fieldCls} placeholder="별칭, 쉼표로" value={f.aliases} onChange={set("aliases")} />
          </div>
          <p className="mt-2 text-sm font-bold">엔진·미션 (선택)</p>
          <div className="grid grid-cols-2 gap-2">
            <input className={fieldCls} placeholder="엔진 (예: 2.0 디젤)" value={f.engine} onChange={set("engine")} />
            <select className={fieldCls} value={f.fuel} onChange={set("fuel")}>
              {Object.entries(FUEL_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select className={fieldCls} value={f.transmission} onChange={set("transmission")}>
              {Object.entries(TRANSMISSION_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <input className={fieldCls} placeholder="미션 상세 (예: 8단 자동)" value={f.gearbox} onChange={set("gearbox")} />
            <input className={fieldCls} placeholder="구동 (예: 2WD)" value={f.drive} onChange={set("drive")} />
          </div>
          <div><button className={btn}>차종 추가</button></div>
        </form>
      </Card>
    </section>
  );
}
