// 4-1. 매장 점검 가이드 (기획 캔버스 "4-1. 매장 점검 가이드")
// ① 이 차 스펙 → 그래서 조심할 것  ② 본넷 그림 + 빨간 동그라미  ③ 시운전 순서
// 서버 컴포넌트: 세대마다 화면을 처음 방문 때 만들어 두고 재사용합니다(ISR). 본넷 그림 선택만 브라우저에서 동작.
import Link from "next/link";
import { BonnetPoints } from "@/components/bonnet-points";
import { Card, TopBar, primaryBtn } from "@/components/ui";
import { TRANSMISSION_LABEL, yearText, type Inspection } from "@/lib/api";
import { cachedApi } from "@/lib/cached";

export const revalidate = 3600;

export async function generateStaticParams() {
  return [];
}

export default async function InspectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await cachedApi<Inspection>(`/cars/${Number(id) || 0}/inspection`);
  const { car } = data;
  const back = `/cars/${car.id}`;

  return (
    <>
      <TopBar back={back} backLabel="리포트로 돌아가기" title="매장 점검 가이드" />

      <section className="flex flex-col gap-3.5 bg-white px-5 pt-6 pb-5">
        <span className="text-[13px] font-medium text-muted">{car.maker} · {car.displayName} ({yearText(car)})</span>
        <h1 className="text-2xl font-bold tracking-tight">매장에서 이 순서로 보세요</h1>

        <div className="overflow-hidden rounded-[14px] border border-line">
          {data.powertrains.map((p) => (
            <div key={p.id} className="grid grid-cols-3 border-b border-line bg-ground last:border-b-0">
              <Spec label="엔진" value={p.engine} />
              <Spec label="미션" value={p.gearbox ?? TRANSMISSION_LABEL[p.transmission]} />
              <Spec label="구동" value={p.drive ?? "-"} last />
            </div>
          ))}
          {data.tips.length > 0 && (
            <div className="flex flex-col gap-2.5 p-3.5">
              <p className="text-sm font-bold">그래서 이 차는 이런 걸 조심하세요</p>
              {data.tips.map((t) => (
                <div key={t.text} className="flex items-start gap-2.5">
                  <span className={`flex-none rounded-md px-1.5 py-0.5 text-xs font-bold text-white ${t.tag === "미션" ? "bg-danger" : "bg-[#C2410C]"}`}>{t.tag}</span>
                  <p className="text-sm leading-relaxed text-body">{t.text}</p>
                </div>
              ))}
            </div>
          )}
          {data.powertrains.length > 1 && <p className="border-t border-line px-3.5 py-2.5 text-xs text-muted">엔진이 여러 종류예요. 사려는 차의 엔진·미션에 맞는 항목을 보세요.</p>}
        </div>

        <nav aria-label="점검 순서" className="flex gap-1.5">
          <a href="#bonnet" className="flex-1 border-b-2 border-ink py-3 text-center text-sm font-bold">① 본넷 열기</a>
          <a href="#drive" className="flex-1 border-b-2 border-line py-3 text-center text-sm font-medium text-muted">② 시운전</a>
        </nav>
      </section>

      <section id="bonnet" className="flex scroll-mt-20 flex-col gap-3 p-5">
        <h2 className="text-lg font-bold">본넷 열고 볼 곳</h2>
        <p className="rounded-[10px] bg-[#FEF3C7] px-3 py-2.5 text-[13px] leading-relaxed text-[#92400E]">시동을 끄고 엔진이 식은 뒤에 보세요. 냉각수 캡은 뜨거울 때 절대 열지 마세요.</p>
        <BonnetPoints points={data.points} />
      </section>

      <section id="drive" className="flex scroll-mt-20 flex-col gap-3 px-5 pt-2 pb-5">
        <h2 className="text-lg font-bold">시운전 때 느껴볼 것</h2>
        <ol className="flex flex-col gap-2.5">
          {data.driveSteps.map((s, i) => (
            <li key={s.title} className={`flex flex-col gap-1 rounded-[14px] bg-white p-3.5 ${s.focus ? "border-2 border-danger" : "border border-line"}`}>
              <span className="flex items-center gap-2">
                <span className="text-[15px] font-bold">{i + 1}. {s.title}</span>
                {s.focus && <span className="rounded-md bg-[#FEE2E2] px-1.5 py-0.5 text-[11px] font-bold text-[#B91C1C]">이 차 포인트</span>}
              </span>
              <span className="text-sm leading-relaxed text-body">{s.how}</span>
            </li>
          ))}
        </ol>

        <Card className="overflow-hidden">
          <p className="border-b border-line px-3.5 py-3 text-sm font-bold">미션 종류별로 느껴볼 것</p>
          <dl className="grid grid-cols-[76px_minmax(0,1fr)] text-[13px] leading-normal">
            {data.transmissionGuide.map((g) => (
              <div key={g.transmission} className={`contents ${g.mine ? "[&>*]:bg-[#FEF2F2]" : ""}`}>
                <dt className={`border-b border-chip px-3.5 py-2.5 font-bold ${g.mine ? "text-[#B91C1C]" : ""}`}>{g.label}</dt>
                <dd className={`border-b border-chip px-3.5 py-2.5 ${g.mine ? "text-ink" : "text-body"}`}>{g.feel}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </section>

      <section className="px-5 pt-3 pb-8">
        <Link href={`${back}#checklist`} className={primaryBtn}>체크리스트로 돌아가기</Link>
      </section>
    </>
  );
}

function Spec({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={`flex flex-col gap-0.5 p-3 ${last ? "" : "border-r border-line"}`}>
      <span className="text-xs text-muted">{label}</span>
      <span className="text-[15px] font-bold">{value}</span>
    </div>
  );
}
