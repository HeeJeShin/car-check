// 메인 화면의 폰 목업. 실제 화면을 작게 옮긴 그림이라 눌리지 않고, 스크린리더에는 label 한 줄만 읽힙니다.
// 내용은 지어내지 않고 실제 데이터(올 뉴 투싼 고질병, 공통 점검 포인트, 체크리스트 항목)를 그대로 씁니다.
import { EngineBay } from "@/components/bonnet-diagram";

export function Phone({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div role="img" aria-label={label} className={`relative w-[272px] flex-none rounded-[44px] bg-phone p-[9px] shadow-phone ${className}`}>
      <div aria-hidden="true" className="relative flex h-[560px] flex-col overflow-hidden rounded-[35px] bg-ground text-left text-ink">
        <div className="absolute top-2.5 left-1/2 h-[22px] w-[78px] -translate-x-1/2 rounded-full bg-phone" />
        <div className="flex h-11 flex-none items-center bg-white px-6 text-[11px] font-bold">9:41</div>
        {children}
      </div>
    </div>
  );
}

function Bar({ title, step }: { title: string; step?: string }) {
  return (
    <div className="grid flex-none grid-cols-[1fr_auto_1fr] items-center border-b border-line bg-white px-3 py-2.5">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
      <span className="text-[12px] font-bold">
        {title}
        {step && <span className="ml-1 text-[9px] font-medium text-muted">{step}</span>}
      </span>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="justify-self-end"><path d="M6 6l12 12M18 6L6 18" /></svg>
    </div>
  );
}

const TUCSON_ISSUES = [
  { part: "변속기", title: "7단 DCT 저속 변속 충격", check: "시운전 때 막히는 길처럼 저속에서 가다 서다를 반복해 보세요." },
  { part: "엔진", title: "단거리 위주 디젤의 DPF·EGR 문제", check: "계기판에 DPF 경고등이 뜬 적이 있는지 확인하세요." },
];

export function ReportScreen() {
  return (
    <>
      <Bar title="고질병 리포트" step="3/3" />
      <div className="flex flex-none flex-col gap-1.5 bg-white px-3.5 pt-3 pb-3">
        <span className="text-[10px] font-medium text-muted">현대 · 투싼</span>
        <span className="text-[17px] leading-tight font-bold tracking-tight">올 뉴 투싼 (2015~2018)</span>
        <span className="self-start rounded-md bg-caution-soft px-2 py-1 text-[10px] font-bold text-caution-strong">주의 2</span>
        <div className="mt-0.5 rounded-lg border border-danger-line bg-danger-tint p-2.5">
          <p className="text-[11px] font-bold">매장 점검 가이드</p>
          <p className="text-[10px] text-body">본넷 열고 볼 곳 · 이 차 시운전 포인트</p>
        </div>
      </div>
      <div className="flex flex-col gap-2 p-3">
        <p className="text-[13px] font-bold">알려진 고질병</p>
        {TUCSON_ISSUES.map((i) => (
          <div key={i.title} className="flex flex-col gap-1.5 rounded-[10px] border border-dashed border-warning-line bg-white p-2.5">
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="font-bold text-caution">주의</span>
              <span className="text-muted">{i.part}</span>
              <span className="ml-auto rounded bg-warning-soft px-1.5 py-0.5 font-bold text-warning">참고</span>
            </div>
            <p className="text-[12px] leading-snug font-bold">{i.title}</p>
            <p className="rounded-md bg-chip p-2 text-[10px] leading-relaxed text-body"><strong>살 때 확인할 것</strong> {i.check}</p>
          </div>
        ))}
      </div>
    </>
  );
}

const TUCSON_GENERATIONS = [
  { name: "더 뉴 투싼", years: "2023~현재" },
  { name: "디 올 뉴 투싼", years: "2020~2023" },
  { name: "더 뉴 투싼", years: "2018~2020" },
  { name: "올 뉴 투싼", years: "2015~2018", on: true },
  { name: "투싼ix", years: "2009~2015" },
];

export function GenerationScreen() {
  return (
    <>
      <Bar title="연식 선택" step="2/3" />
      <div className="flex flex-none flex-col gap-2 bg-white px-3.5 pt-3.5 pb-3.5">
        <span className="text-[17px] font-bold tracking-tight">몇 년식 투싼인가요?</span>
        <div className="rounded-lg border border-field px-3 py-2.5 text-[11px] text-faint">예: 2017</div>
      </div>
      <div className="flex flex-col gap-2 p-3">
        {TUCSON_GENERATIONS.map((g) => (
          <div key={g.name + g.years} className={`flex items-center justify-between rounded-[10px] border bg-white p-3 ${g.on ? "border-primary ring-1 ring-primary" : "border-line"}`}>
            <span className="text-[12px] font-bold">{g.name}</span>
            <span className="text-[10px] text-muted">{g.years}</span>
          </div>
        ))}
      </div>
    </>
  );
}

/** 공통 점검 포인트의 실제 좌표(%)와 이름 */
export const BONNET_POINTS = [
  { no: 1, x: 25.5, y: 33.8, title: "엔진오일" },
  { no: 2, x: 52.5, y: 68.8, title: "엔진 누유" },
  { no: 3, x: 6.3, y: 43.8, title: "냉각수" },
  { no: 4, x: 76.5, y: 41.7, title: "배터리" },
  { no: 5, x: 15.5, y: 53.3, title: "벨트" },
  { no: 6, x: 64.8, y: 27.9, title: "브레이크액" },
  { no: 7, x: 95.5, y: 30, title: "휀더·본넷 볼트" },
];

export function InspectScreen() {
  return (
    <>
      <Bar title="매장 점검 가이드" />
      <div className="flex flex-none flex-col gap-1 bg-white px-3.5 pt-3 pb-2.5">
        <span className="text-[16px] font-bold tracking-tight">매장에서 이 순서로 보세요</span>
        <span className="text-[10px] text-muted">동그라미를 누르면 보는 법이 나와요</span>
      </div>
      <div className="flex flex-col gap-2 p-2.5">
        <div className="relative w-full overflow-hidden rounded-lg" style={{ aspectRatio: "400 / 240" }}>
          <EngineBay />
          {BONNET_POINTS.map((p) => (
            <span
              key={p.no}
              className={`absolute flex h-[19px] w-[19px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-danger text-[9px] font-bold ${p.no === 1 ? "bg-danger text-white" : "bg-white/85 text-danger"}`}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            >
              {p.no}
            </span>
          ))}
        </div>
        {BONNET_POINTS.slice(0, 5).map((p) => (
          <div key={p.no} className={`flex items-center gap-2 rounded-lg border bg-white p-2.5 ${p.no === 1 ? "border-danger" : "border-line"}`}>
            <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white">{p.no}</span>
            <span className="text-[12px] font-bold">{p.title}</span>
          </div>
        ))}
      </div>
    </>
  );
}

const CHECKS = [
  { text: "카히스토리로 사고·침수 이력 조회", done: true },
  { text: "리콜 조치 완료 여부 확인", done: true },
  { text: "7단 DCT 저속 변속 충격 확인", done: true },
  { text: "단거리 위주 디젤의 DPF·EGR 문제 확인" },
  { text: "성능·상태점검기록부 받기" },
  { text: "본넷 열고 점검하기" },
  { text: "타이어 연식·마모 확인 (네고 근거)" },
  { text: "시운전 (저속·고속·급제동)" },
];

export function ChecklistScreen() {
  return (
    <>
      <Bar title="매장 체크리스트" step="3/8" />
      <div className="h-1 flex-none bg-line"><div className="h-full w-[37.5%] bg-primary" /></div>
      <div className="flex flex-col gap-1.5 p-3">
        {CHECKS.map((c) => (
          <div key={c.text} className="flex items-center gap-2.5 rounded-[10px] border border-line bg-white p-2.5">
            <span className={`flex h-[18px] w-[18px] flex-none items-center justify-center rounded-[5px] border ${c.done ? "border-primary bg-primary text-white" : "border-field"}`}>
              {c.done && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>}
            </span>
            <span className={`text-[11px] leading-snug ${c.done ? "text-muted line-through" : "font-medium"}`}>{c.text}</span>
          </div>
        ))}
      </div>
    </>
  );
}

const QUESTIONS = ["첫 중고차, 뭐부터 알아봐요?", "딜러한테 뭘 물어봐야 해요?", "디젤 vs 가솔린, 뭐가 나아요?"];
const PURPOSES = ["출퇴근", "가족", "캠핑·여행", "첫 차", "장거리"];

export function GuideScreen() {
  return (
    <>
      <Bar title="AI 가이드" />
      <div className="flex flex-none flex-col gap-1.5 bg-white px-3.5 pt-3.5">
        <span className="text-[17px] leading-snug font-bold tracking-tight">아직 차를 못 정했어도 괜찮아요</span>
        <div className="mt-1.5 flex">
          <span className="flex-1 border-b-2 border-ink py-2 text-center text-[11px] font-bold">무엇부터 볼까요?</span>
          <span className="flex-1 border-b-2 border-line py-2 text-center text-[11px] text-muted">용도별 추천</span>
        </div>
      </div>
      <div className="flex flex-col gap-2 p-3">
        {QUESTIONS.map((q) => (
          <div key={q} className="rounded-[10px] border border-line bg-white p-3 text-[12px] font-medium">{q}</div>
        ))}
        <p className="mt-2 text-[12px] font-bold">어디에 많이 타세요?</p>
        <div className="flex flex-wrap gap-1.5">
          {PURPOSES.map((p, i) => (
            <span key={p} className={`rounded-full border px-3 py-1.5 text-[11px] ${i === 3 ? "border-ink bg-ink font-bold text-white" : "border-field bg-white font-medium"}`}>{p}</span>
          ))}
        </div>
      </div>
    </>
  );
}
