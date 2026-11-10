"use client";
// 데이터 관리: 방문 통계, 사용자 제보 답변, 차종(세대)·엔진 추가, 고질병 추가·검증·삭제, 본넷 점검 포인트 추가·삭제.
// 직접 찾아본 정보를 넣는 곳입니다. "출처 있음"은 출처 URL이 있어야 저장됩니다(서버 규칙).
// 구글 로그인 필요. ADMIN은 전부, EDITOR는 초안 작성까지만(검증·삭제·차종 추가 버튼이 안 보임).
// 버튼을 숨기는 건 편의일 뿐이고, 실제로 막는 건 API(auth.guard.ts, issues.service.ts)입니다.
import { useEffect, useState } from "react";
import { refreshPublicPages } from "@/app/actions";
import { AdminLogin } from "@/components/admin-login";
import { Button } from "@/components/button";
import { BonnetDiagram } from "@/components/bonnet-diagram";
import { VisitStats } from "@/components/visit-stats";
import { PageBar } from "@/components/page-bar";
import { Card, ErrorText, Loading, SeverityText, fieldCls } from "@/components/ui";
import {
  ApiError, BODY_LABEL, FUEL_LABEL, PARTS, REPORT_REASONS, STATUS_LABEL, TRANSMISSION_LABEL, api, loginToken, saveLoginToken, yearText,
  type AdminIssue, type AdminReport, type AuthUser, type CarModel, type CarReport, type Inspection, type IssueStatus, type Severity,
} from "@/lib/api";

const textareaCls = "h-16 w-full rounded-xl border border-field bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary";

export default function AdminPage() {
  // undefined = 저장된 토큰 확인 중, null = 로그인 안 됨
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);

  useEffect(() => {
    const token = loginToken();
    (token ? api<AuthUser>("/auth/me") : Promise.resolve(null)).then(setUser, () => {
      saveLoginToken(null); // 만료됐거나 서버 비밀키가 바뀐 토큰
      setUser(null);
    });
  }, []);

  const logout = () => {
    saveLoginToken(null);
    setUser(null);
  };

  if (user === undefined) return <Loading />;
  if (!user || user.role === "USER") {
    return (
      <>
        <PageBar back="/" backLabel="처음으로" title="데이터 관리" />
        <AdminLogin onLogin={setUser} denied={user?.role === "USER"} />
      </>
    );
  }
  return <AdminConsole user={user} onLogout={logout} />;
}

function AdminConsole({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const isAdmin = user.role === "ADMIN";
  const [cars, setCars] = useState<CarModel[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [report, setReport] = useState<CarReport | null>(null);
  const [issues, setIssues] = useState<AdminIssue[]>([]);
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [reports, setReports] = useState<AdminReport[]>([]);
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
    api<AdminReport[]>("/issues/reports").then(setReports, (err: Error) => setError(err.message));
  }, [reloadKey]);

  useEffect(() => {
    if (!selectedId) return;
    api<CarReport>(`/cars/${selectedId}`).then(setReport, (err: Error) => setError(err.message));
    api<AdminIssue[]>(`/issues?carModelId=${selectedId}`).then(setIssues, (err: Error) => setError(err.message));
    api<Inspection>(`/cars/${selectedId}/inspection`).then(setInspection, (err: Error) => setError(err.message));
  }, [selectedId, reloadKey]);

  // 성공하면 목록을 다시 불러오고, 실패하면 서버가 준 이유를 그대로 보여줍니다.
  // 미리 만들어 둔 조회 화면(ISR)도 지워서, 사용자 화면에 고친 내용이 바로 보이게 합니다.
  async function run(action: () => Promise<unknown>) {
    setError(null);
    try {
      await action();
      await refreshPublicPages(loginToken());
      setReloadKey((k) => k + 1);
      return true;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) onLogout(); // 로그인이 만료됨 → 로그인 화면으로
      setError((err as Error).message);
      return false;
    }
  }

  // 심사 버튼: 승인은 출처 URL, 반려·승인 취소는 사유를 물어본 뒤 보냅니다. 규칙은 서버가 다시 검사합니다.
  async function transition(issue: AdminIssue, action: AdminIssue["actions"][number]) {
    const body: { to: IssueStatus; sourceUrl?: string; reason?: string } = { to: action.to };
    if (action.needs === "sourceUrl") {
      const url = window.prompt("확인한 출처 URL을 넣어주세요 (리콜 공지, 정비 기록 등)", issue.sourceUrl ?? "https://");
      if (!url) return;
      body.sourceUrl = url;
    }
    if (action.needs === "reason") {
      const reason = window.prompt(`'${action.label}' 사유를 적어주세요 (이력에 남아요)`);
      if (!reason?.trim()) return;
      body.reason = reason;
    }
    await run(() => api(`/issues/${issue.id}/transition`, { method: "POST", json: body }));
  }

  async function remove(path: string, what: string) {
    if (!window.confirm(`이 ${what}을(를) 삭제할까요?`)) return;
    await run(() => api(path, { method: "DELETE" }));
  }

  return (
    <>
      <PageBar
        back="/"
        backLabel="처음으로"
        title="데이터 관리"
        keepOnPc
        right={<button type="button" onClick={onLogout} className="min-h-11 underline">로그아웃</button>}
      />
      <div className="flex flex-col gap-8 p-5 lg:p-8">
        <p className="text-sm text-muted">
          <strong className="text-ink">{user.name}</strong> ({user.email}) · {isAdmin ? "관리자: 모든 수정·검증·삭제" : "에디터: 초안 작성·수정만 (검증·삭제는 관리자)"}
        </p>
        <p className="text-sm text-muted">직접 찾아본 정보를 넣고, 초안을 확인해서 &quot;출처 있음&quot;으로 바꿔요.</p>
        <ErrorText message={error} />

        <VisitStats />

        {/* PC: 왼쪽 제보함, 오른쪽 고질병 관리. 휴대폰: 위에서 아래로 */}
        <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
        <ReportInbox
          reports={reports}
          isAdmin={isAdmin}
          onAnswer={(id, answer) => run(() => api(`/issues/reports/${id}/answer`, { method: "POST", json: { answer } }))}
          onSelectCar={setSelectedId}
        />

        <div className="flex flex-col gap-8">
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
          <p className="text-xs leading-relaxed text-muted">초안 → 검토 요청 → 관리자 승인(출처 있음) 또는 반려. 반려된 정보는 사용자 화면에 안 보여요. 검토 중·검증된 정보는 초안으로 되돌린 뒤 고칠 수 있어요.</p>
          {issues.map((issue) => (
            <Card key={issue.id} className={`p-4 ${issue.status === "REJECTED" ? "opacity-70" : ""}`}>
              <div className="flex items-center gap-2">
                <SeverityText severity={issue.severity} />
                <span className="text-xs text-muted">{issue.part}{issue.engine && ` · ${issue.engine}`}</span>
                <span className="ml-auto"><ReviewBadge status={issue.status} /></span>
              </div>
              <p className="mt-2 font-bold">{issue.title}</p>
              <p className="mt-1 text-sm text-body">{issue.description}</p>
              <p className="mt-1 text-sm text-muted">확인법: {issue.checkHow}</p>
              {issue.note && <p className="mt-1 text-xs text-muted">메모: {issue.note}</p>}
              {issue.sourceUrl && <a href={issue.sourceUrl} target="_blank" rel="noreferrer" className="mt-1 block text-xs text-primary underline">출처</a>}
              <div className="mt-3 flex flex-wrap gap-2">
                {issue.actions.map((a) => (
                  <Button key={a.to} variant="secondary" size="xs" onClick={() => transition(issue, a)}>{a.label}</Button>
                ))}
                {isAdmin && <Button variant="secondary" size="xs" onClick={() => remove(`/issues/${issue.id}`, "고질병")}>삭제</Button>}
              </div>
              <IssueHistoryList history={issue.history} />
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
              {isAdmin && <Button variant="secondary" size="xs" className="ml-auto" onClick={() => remove(`/inspection-points/${p.id}`, "점검 포인트")}>삭제</Button>}
            </Card>
          ))}
          {selectedId && <PointForm carModelId={selectedId} onSubmit={(body) => run(() => api("/inspection-points", { method: "POST", json: body }))} />}
        </section>

        {isAdmin && <CarForm onSubmit={(body) => run(() => api("/cars", { method: "POST", json: body }))} />}
        </div>
        </div>
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
        <div><Button size="sm">초안으로 추가</Button></div>
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
        <div><Button size="sm">포인트 추가</Button></div>
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
          <div><Button size="sm">차종 추가</Button></div>
        </form>
      </Card>
    </section>
  );
}

const REVIEW_BADGE: Record<IssueStatus, string> = {
  DRAFT: "bg-chip text-body",
  IN_REVIEW: "bg-info-soft text-info",
  VERIFIED: "bg-success-soft text-success",
  REJECTED: "bg-danger-soft text-danger-strong",
};
function ReviewBadge({ status }: { status: IssueStatus }) {
  return <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${REVIEW_BADGE[status]}`}>{STATUS_LABEL[status]}</span>;
}

const FIELD_LABEL: Record<string, string> = { title: "제목", description: "설명", checkHow: "확인법", severity: "위험도", part: "부위", engine: "엔진", sourceUrl: "출처", note: "메모" };

/** 누가·언제·무엇을·왜 (최신이 위) */
function IssueHistoryList({ history }: { history: AdminIssue["history"] }) {
  if (history.length === 0) return null;
  return (
    <details className="mt-3 text-xs text-body">
      <summary className="cursor-pointer text-muted">변경 이력 {history.length}건</summary>
      <ol className="mt-2 flex flex-col gap-1.5 border-l-2 border-chip pl-3">
        {history.map((h) => (
          <li key={h.id}>
            <span className="text-muted">{new Date(h.createdAt).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" })} · {h.user.name}</span>{" "}
            {h.action === "CREATED" && "작성"}
            {h.action === "STATUS_CHANGED" && h.fromStatus && h.toStatus && <strong>{STATUS_LABEL[h.fromStatus]} → {STATUS_LABEL[h.toStatus]}</strong>}
            {h.action === "UPDATED" && `수정: ${Object.keys(h.changes ?? {}).map((k) => FIELD_LABEL[k] ?? k).join(", ")}`}
            {h.reason && <span className="block text-warning">사유: {h.reason}</span>}
          </li>
        ))}
      </ol>
    </details>
  );
}

// 제보함: 사용자가 "틀린 내용 있어요"로 보낸 것. 답변 안 한 것이 위에 옵니다.
// 답변을 달면 사용자 리포트 화면의 그 고질병 카드 아래에 공개됩니다. 고질병 내용을 고치는 건 아래 "고질병"에서.
function ReportInbox({
  reports,
  isAdmin,
  onAnswer,
  onSelectCar,
}: {
  reports: AdminReport[];
  isAdmin: boolean;
  onAnswer: (id: number, answer: string) => Promise<boolean>;
  onSelectCar: (carId: number) => void;
}) {
  const open = reports.filter((r) => !r.answer).length;
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-bold">
        제보함 <span className="text-sm font-medium text-muted">답변 기다리는 제보 {open}건</span>
      </h2>
      <p className="text-xs leading-relaxed text-muted">답변을 달면 사용자 화면의 고질병 카드 아래에 제보와 함께 공개돼요. 답변 전에는 개수만 보여요.</p>
      {reports.length === 0 && <p className="text-sm text-body">아직 제보가 없어요.</p>}
      {reports.map((r) => (
        <ReportCard key={r.id} report={r} isAdmin={isAdmin} onAnswer={onAnswer} onSelectCar={onSelectCar} />
      ))}
    </section>
  );
}

function ReportCard({
  report: r,
  isAdmin,
  onAnswer,
  onSelectCar,
}: {
  report: AdminReport;
  isAdmin: boolean;
  onAnswer: (id: number, answer: string) => Promise<boolean>;
  onSelectCar: (carId: number) => void;
}) {
  const [answer, setAnswer] = useState(r.answer ?? "");
  const car = r.issue.carModel;
  return (
    <Card className={`flex flex-col gap-2 p-4 ${r.answer ? "opacity-80" : ""}`}>
      <p className="text-xs text-muted">
        {car.displayName} ({yearText(car)}) · {new Date(r.createdAt).toLocaleString("ko-KR")}
      </p>
      <p className="text-sm font-bold">{r.issue.title}</p>
      <p className="text-sm text-body">{r.reasons.map((key) => REPORT_REASONS[key] ?? key).join(" · ")}</p>
      {r.comment && <p className="text-sm text-ink">“{r.comment}”</p>}
      {r.sourceUrl && (
        <a href={r.sourceUrl} target="_blank" rel="noreferrer" className="break-all text-xs text-primary underline">{r.sourceUrl}</a>
      )}
      {r.answer && (
        <p className="text-sm text-body">
          <strong>답변</strong> {r.answer} <span className="text-xs text-muted">({r.answeredBy?.name})</span>
        </p>
      )}
      {isAdmin && (
        <form
          className="flex flex-col gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            await onAnswer(r.id, answer);
          }}
        >
          <textarea className={textareaCls} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="제보에 대한 답변 (사용자 화면에 공개돼요)" maxLength={1000} />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={!answer.trim()}>{r.answer ? "답변 고치기" : "답변 등록"}</Button>
            <Button type="button" variant="secondary" size="xs" onClick={() => onSelectCar(car.id)}>이 차 고질병 보기</Button>
          </div>
        </form>
      )}
    </Card>
  );
}
