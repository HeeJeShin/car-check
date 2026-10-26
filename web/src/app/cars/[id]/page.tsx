// 4. 고질병 리포트 (기획 캔버스 "4. 고질병 리포트")
// 스펙 요약 → 매장 점검 가이드 진입 → 고질병 → 매장 체크리스트 → 공통 점검
// 서버 컴포넌트: 세대마다 화면을 처음 방문 때 만들어 두고 재사용합니다(ISR). 체크리스트만 브라우저에서 동작.
import Link from "next/link";
import { ReportChecklist } from "@/components/report-checklist";
import { Card, ChevronRight, SEVERITY, SeverityText, StatusBadge, TopBar, primaryBtn, secondaryBtn } from "@/components/ui";
import { FUEL_LABEL, TRANSMISSION_LABEL, generationsHref, yearText, type CarReport } from "@/lib/api";
import { cachedApi } from "@/lib/cached";

export const revalidate = 3600;

// 빌드 때는 미리 만들지 않고(빌드에 API가 필요 없게), 첫 방문 때 만들어 저장합니다.
export async function generateStaticParams() {
  return [];
}

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const car = await cachedApi<CarReport>(`/cars/${Number(id) || 0}`);

  const back = generationsHref(car.maker, car.name);
  const count = (s: keyof typeof SEVERITY) => car.issues.filter((i) => i.severity === s).length;
  const verified = car.issues.filter((i) => i.status === "VERIFIED").length;

  // 매장 체크리스트 = 공통 조회 + 이 차 고질병 확인 + 시운전
  const checklist = [
    "카히스토리로 사고·침수 이력 조회",
    "리콜 조치 완료 여부 확인",
    ...car.issues.map((i) => `${i.title} 확인`),
    "성능·상태점검기록부 받기",
    "본넷 열고 점검하기",
    "타이어 연식·마모 확인 (네고 근거)",
    "시운전 (저속·고속·급제동)",
  ];

  return (
    <>
      <TopBar back={back} backLabel="연식 다시 고르기" right="3 / 3 단계" />

      <section className="flex flex-col gap-3 bg-white px-5 pt-6 pb-5">
        <span className="text-[13px] font-medium text-muted">{car.maker} · {car.name} {car.generation}</span>
        <h1 className="text-2xl font-bold tracking-tight">{car.displayName} ({yearText(car)})</h1>
        <div className="flex flex-wrap gap-2">
          {(["HIGH", "MEDIUM", "LOW"] as const).map((s) =>
            count(s) > 0 ? <span key={s} className={`rounded-lg px-2.5 py-1.5 text-[13px] font-bold ${SEVERITY[s].chip}`}>{SEVERITY[s].label} {count(s)}</span> : null,
          )}
          <span className="rounded-lg bg-chip px-2.5 py-1.5 text-[13px] font-medium text-body">검증됨 {verified} · 참고 {car.issues.length - verified}</span>
        </div>
        {car.powertrains.length > 0 && (
          <ul className="flex flex-col gap-1 text-sm text-body">
            {car.powertrains.map((p) => (
              <li key={p.id}>
                엔진 <strong className="text-ink">{p.engine}</strong> · 미션 <strong className="text-ink">{p.gearbox ?? TRANSMISSION_LABEL[p.transmission]}</strong>
                {p.drive && <> · 구동 <strong className="text-ink">{p.drive}</strong></>} <span className="text-faint">({FUEL_LABEL[p.fuel]})</span>
              </li>
            ))}
          </ul>
        )}
        <Link href={`/cars/${car.id}/inspect`} className="flex items-center gap-3 rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-3.5">
          <span className="flex flex-1 flex-col gap-0.5">
            <span className="text-[15px] font-bold">매장 점검 가이드</span>
            <span className="text-[13px] text-body">본넷 열고 볼 곳 · 이 차 시운전 포인트</span>
          </span>
          <ChevronRight className="text-[#B91C1C]" />
        </Link>
        <nav aria-label="리포트 목차" className="mt-1 flex gap-1.5">
          <a href="#issues" className="flex-1 border-b-2 border-ink py-3 text-center text-sm font-bold">고질병</a>
          <a href="#checklist" className="flex-1 border-b-2 border-line py-3 text-center text-sm font-medium text-muted">매장 체크</a>
          <a href="#common" className="flex-1 border-b-2 border-line py-3 text-center text-sm font-medium text-muted">공통 점검</a>
        </nav>
      </section>

      <section id="issues" className="flex scroll-mt-20 flex-col gap-3 p-5">
        <h2 className="text-lg font-bold">알려진 고질병</h2>
        {car.issues.length === 0 && <Card className="p-4 text-sm text-body">아직 등록된 고질병이 없어요. 아래 공통 점검은 꼭 해보세요.</Card>}
        {car.issues.map((issue) => (
          <article key={issue.id} className={`flex flex-col gap-2 rounded-[14px] bg-white p-4 ${issue.status === "VERIFIED" ? "border border-line" : "border border-dashed border-[#D4A55A]"}`}>
            <div className="flex items-center gap-2">
              <SeverityText severity={issue.severity} />
              <span className="text-xs text-muted">{issue.part}{issue.engine && ` · ${issue.engine}`}</span>
              <span className="ml-auto"><StatusBadge status={issue.status} /></span>
            </div>
            <h3 className="text-base font-bold">{issue.title}</h3>
            <p className="text-sm leading-relaxed text-body">{issue.description}</p>
            <div className="rounded-[10px] bg-accent-soft p-3 text-sm leading-relaxed text-accent-dark">
              <strong>살 때 확인할 것</strong> {issue.checkHow}
            </div>
            {issue.status === "VERIFIED" && issue.sourceUrl ? (
              <a href={issue.sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-accent underline">출처 보기</a>
            ) : (
              <p className="text-xs text-[#92400E]">아직 확인 중인 정보예요. 정비소에서 한 번 더 물어보세요.</p>
            )}
          </article>
        ))}
      </section>

      <ReportChecklist carId={car.id} items={checklist} />

      <section id="common" className="flex scroll-mt-20 flex-col gap-2.5 px-5 pt-2 pb-5">
        <h2 className="text-lg font-bold">모든 중고차 공통 점검</h2>
        <Card className="flex flex-col gap-2.5 p-4 text-sm leading-relaxed text-body">
          {car.generalChecks.map((c) => (
            <p key={c.title}><strong className="text-ink">{c.title}</strong> {c.checkHow}</p>
          ))}
        </Card>
      </section>

      <section className="flex flex-col gap-2.5 px-5 pt-3 pb-8">
        <Link href="/guide" className={primaryBtn}>AI에게 더 물어보기</Link>
        <Link href={back} className={secondaryBtn}>다른 연식 보기</Link>
      </section>
    </>
  );
}
