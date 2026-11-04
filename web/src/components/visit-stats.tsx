"use client";
// 관리 화면 "방문 통계": 일별 방문자·페이지뷰(선 2개), 많이 본 차종 TOP 10, 들어온 곳(가로 막대), 기기(숫자).
// 기록은 우리 API에 쌓입니다(api/src/stats/stats.ts). IP는 저장하지 않아요.
// 색: 방문자 #2a78d6(파랑), 페이지뷰 #eb6834(주황) — 색약·대비 검사 통과. 글자는 색 대신 본문 글자색.
import { useEffect, useState } from "react";
import { Card, ErrorText } from "@/components/ui";
import { api, yearText, type VisitStats as Stats } from "@/lib/api";

const SERIES = [
  { key: "visitors", label: "방문자", color: "#2a78d6" },
  { key: "views", label: "페이지뷰", color: "#eb6834" },
] as const;
const RANGES = [7, 30, 90] as const;
const fmt = (n: number) => n.toLocaleString("ko-KR");
const shortDay = (day: string) => `${Number(day.slice(5, 7))}/${Number(day.slice(8, 10))}`;

export function VisitStats() {
  const [days, setDays] = useState<(typeof RANGES)[number]>(30);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Stats>(`/stats?days=${days}`).then(setStats, (err: Error) => setError(err.message));
  }, [days]);

  const mobile = stats?.devices.mobile ?? 0;
  const desktop = stats?.devices.desktop ?? 0;
  const deviceTotal = mobile + desktop;
  const pct = (n: number) => (deviceTotal ? `${Math.round((n / deviceTotal) * 100)}%` : "-");

  return (
    <section className="flex flex-col gap-3" aria-labelledby="visit-stats-title">
      <div className="flex items-center gap-2">
        <h2 id="visit-stats-title" className="text-lg font-bold">방문 통계</h2>
        {/* 기간 고르기: 차트 위 한 줄 */}
        <div className="ml-auto flex gap-1" role="group" aria-label="기간">
          {RANGES.map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={days === d}
              onClick={() => setDays(d)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium ${days === d ? "bg-ink text-white" : "border border-field bg-white text-body"}`}
            >
              {d}일
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-muted">한국 시간 기준. 로봇과 관리 화면 방문은 세지 않고, IP는 저장하지 않아요. 방문자는 하루 기준으로 센 수를 더한 값이에요.</p>
      <ErrorText message={error} />
      {!stats ? (
        <p className="text-sm text-muted">불러오는 중…</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            <StatTile label="방문자" value={fmt(stats.totals.visitors)} />
            <StatTile label="페이지뷰" value={fmt(stats.totals.views)} />
            <StatTile label="제보" value={fmt(stats.totals.reports)} />
          </div>

          <Card className="flex flex-col gap-2 p-4">
            <h3 className="text-sm font-bold">일별 방문</h3>
            <DailyChart daily={stats.daily} />
            <details className="text-xs">
              <summary className="cursor-pointer text-muted">표로 보기</summary>
              <table className="mt-2 w-full text-left">
                <thead className="text-muted">
                  <tr><th className="py-1 font-medium">날짜</th><th className="py-1 text-right font-medium">방문자</th><th className="py-1 text-right font-medium">페이지뷰</th></tr>
                </thead>
                <tbody>
                  {[...stats.daily].reverse().map((d) => (
                    <tr key={d.day} className="border-t border-line">
                      <td className="py-1">{d.day}</td><td className="py-1 text-right tabular-nums">{fmt(d.visitors)}</td><td className="py-1 text-right tabular-nums">{fmt(d.views)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </Card>

          <Card className="flex flex-col gap-2 p-4">
            <h3 className="text-sm font-bold">많이 본 차종 TOP 10 <span className="font-normal text-muted">(리포트·점검 가이드 페이지뷰)</span></h3>
            <BarList
              empty="아직 차종 페이지 방문이 없어요."
              rows={stats.topCars.map((c) => ({ key: String(c.id), label: `${c.displayName} (${yearText(c)})`, sub: c.maker, value: c.views }))}
            />
          </Card>

          <Card className="flex flex-col gap-2 p-4">
            <h3 className="text-sm font-bold">들어온 곳</h3>
            <BarList empty="아직 방문이 없어요." rows={stats.referrers.map((r) => ({ key: r.host, label: r.host, value: r.views }))} />
          </Card>

          <div className="grid grid-cols-2 gap-2">
            <StatTile label="휴대폰" value={pct(mobile)} sub={`${fmt(mobile)}회`} />
            <StatTile label="PC" value={pct(desktop)} sub={`${fmt(desktop)}회`} />
          </div>
        </>
      )}
    </section>
  );
}

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="flex flex-col gap-0.5 p-3">
      <span className="text-xs text-muted">{label}</span>
      <strong className="text-xl tabular-nums">{value}</strong>
      {sub && <span className="text-xs text-muted tabular-nums">{sub}</span>}
    </Card>
  );
}

// 일별 선 그래프: 축 하나(같은 단위 "회"), 선 2px, 마우스·손가락을 올리면 세로선이 가장 가까운 날짜에 붙고 두 값을 함께 보여줌.
// 키보드: 그래프에 포커스 후 ←/→로 날짜 이동.
function DailyChart({ daily }: { daily: Stats["daily"] }) {
  const [active, setActive] = useState<number | null>(null);
  const W = 320, H = 150, L = 28, R = 56, T = 10, B = 22; // 오른쪽 여백은 선 끝 이름표 자리
  const pw = W - L - R, ph = H - T - B;
  const max = Math.max(1, ...daily.map((d) => Math.max(d.views, d.visitors)));
  const nice = Math.max(4, niceMax(max)); // 방문이 적을 때도 0·2·4 눈금
  const x = (i: number) => L + (daily.length <= 1 ? pw / 2 : (i / (daily.length - 1)) * pw);
  const y = (v: number) => T + ph - (v / nice) * ph;
  const ticks = [0, nice / 2, nice].filter(Number.isInteger); // 2.5 같은 눈금은 빼기
  const last = daily.length - 1;
  const pick = (clientX: number, rect: DOMRect) => {
    const px = ((clientX - rect.left) / rect.width) * W;
    setActive(Math.max(0, Math.min(last, Math.round(((px - L) / pw) * last))));
  };

  // 선 끝 이름표가 겹치면 위아래로 벌림
  const endY = SERIES.map((s) => y(daily[last]?.[s.key] ?? 0));
  if (Math.abs(endY[0] - endY[1]) < 12) {
    const mid = (endY[0] + endY[1]) / 2;
    const up = daily[last]?.visitors >= daily[last]?.views ? 0 : 1;
    endY[up] = mid - 6;
    endY[1 - up] = mid + 6;
  }

  const a = active !== null ? daily[active] : null;
  return (
    <div className="flex flex-col gap-2">
      {/* 범례: 선 모양 그대로 */}
      <div className="flex gap-3 text-xs text-body">
        {SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4 rounded" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full touch-none select-none outline-none focus-visible:ring-2 focus-visible:ring-accent"
          role="img"
          aria-label={`일별 방문자와 페이지뷰, 최근 ${daily.length}일`}
          tabIndex={0}
          onPointerMove={(e) => pick(e.clientX, e.currentTarget.getBoundingClientRect())}
          onPointerDown={(e) => pick(e.clientX, e.currentTarget.getBoundingClientRect())}
          onPointerLeave={() => setActive(null)}
          onBlur={() => setActive(null)}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") setActive((i) => Math.max(0, (i ?? last + 1) - 1));
            if (e.key === "ArrowRight") setActive((i) => Math.min(last, (i ?? -1) + 1));
          }}
        >
          {/* 눈금: 흐리게 */}
          {ticks.map((t) => (
            <g key={t}>
              <line x1={L} x2={L + pw} y1={y(t)} y2={y(t)} stroke="var(--color-line)" strokeWidth={1} />
              <text x={L - 4} y={y(t) + 3} textAnchor="end" fontSize={9} fill="var(--color-muted, #6b7280)">{fmt(t)}</text>
            </g>
          ))}
          {/* 날짜: 처음·가운데·끝만 */}
          {[0, Math.floor(last / 2), last].filter((v, i, arr) => arr.indexOf(v) === i).map((i) => (
            <text key={i} x={x(i)} y={H - 6} textAnchor="middle" fontSize={9} fill="var(--color-muted, #6b7280)">{shortDay(daily[i].day)}</text>
          ))}
          {/* 선 2개: 페이지뷰를 먼저 그리고 방문자를 위에 (값이 같을 때 방문자 선이 가려지지 않게) */}
          {[...SERIES].reverse().map((s) => (
            <polyline
              key={s.key}
              points={daily.map((d, i) => `${x(i)},${y(d[s.key])}`).join(" ")}
              fill="none"
              stroke={s.color}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}
          {/* 선 끝 이름표 (글자는 본문 색) */}
          {SERIES.map((s, i) => (
            <text key={s.key} x={x(last) + 6} y={endY[i] + 3} fontSize={9} fill="var(--color-ink, #111827)">
              {s.label} {fmt(daily[last]?.[s.key] ?? 0)}
            </text>
          ))}
          {/* 가리킨 날짜: 세로선 + 점(흰 테두리) */}
          {a && active !== null && (
            <g>
              <line x1={x(active)} x2={x(active)} y1={T} y2={T + ph} stroke="var(--color-muted, #6b7280)" strokeWidth={1} strokeDasharray="2 2" />
              {SERIES.map((s) => (
                <circle key={s.key} cx={x(active)} cy={y(a[s.key])} r={4} fill={s.color} stroke="#fff" strokeWidth={2} />
              ))}
            </g>
          )}
        </svg>
        {a && active !== null && (
          <div
            className="pointer-events-none absolute top-0 z-10 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs shadow-sm"
            style={{ left: `${(x(active) / W) * 100}%`, transform: `translateX(${active > last / 2 ? "-105%" : "5%"})` }}
          >
            <p className="mb-0.5 text-muted">{a.day}</p>
            {SERIES.map((s) => (
              <p key={s.key} className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="inline-block h-0.5 w-3 rounded" style={{ background: s.color }} />
                <strong className="tabular-nums">{fmt(a[s.key])}</strong>
                <span className="text-muted">{s.label}</span>
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 가로 막대 목록: 막대는 파랑 한 가지(크기만 비교), 끝에 값 표시. 막대 사이 간격으로 구분.
function BarList({ rows, empty }: { rows: { key: string; label: string; sub?: string; value: number }[]; empty: string }) {
  if (rows.length === 0) return <p className="text-sm text-muted">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.value));
  return (
    <ol className="flex flex-col gap-2">
      {rows.map((r) => (
        <li key={r.key} className="flex flex-col gap-1" title={`${r.label}: ${fmt(r.value)}회`}>
          <div className="flex items-baseline gap-2 text-sm">
            <span className="truncate">{r.label}</span>
            {r.sub && <span className="shrink-0 text-xs text-muted">{r.sub}</span>}
            <span className="ml-auto shrink-0 tabular-nums text-body">{fmt(r.value)}</span>
          </div>
          <div className="h-2 w-full rounded-r bg-chip">
            <div className="h-2 rounded-r-[4px]" style={{ width: `${Math.max(2, (r.value / max) * 100)}%`, background: "#2a78d6" }} />
          </div>
        </li>
      ))}
    </ol>
  );
}

// 눈금이 1·2·5 단위로 떨어지게 최댓값을 올림 (예: 37 → 40, 120 → 200)
function niceMax(v: number) {
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}
