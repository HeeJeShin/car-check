// 1. 첫 화면: 사이트 소개. 이 화면만 전체 너비를 씁니다(.landing-wide → app/layout.tsx).
// 데이터가 필요 없는 정적 화면이라 서버 컴포넌트로 둡니다("use client" 없음).
import Link from "next/link";
import { BONNET_POINTS, ChecklistScreen, GenerationScreen, GuideScreen, InspectScreen, Phone, ReportScreen } from "@/components/landing-mockups";
import { Logo } from "@/components/logo";

const HERO_TAGS = [
  { text: "사고·침수 이력", className: "top-[14%] left-0" },
  { text: "DPF·EGR 문제", className: "top-[30%] right-0" },
  { text: "리콜 조치 여부", className: "top-[48%] left-0" },
  { text: "타이어 연식·마모", className: "top-[62%] right-0" },
];

// 본넷 섹션 양옆 말풍선 위치 (넓은 화면에서만 보임)
const POINT_POSITIONS = [
  "top-[8%] left-[6%]",
  "top-[30%] left-[0%]",
  "top-[54%] left-[8%]",
  "top-[78%] left-[2%]",
  "top-[12%] right-[6%]",
  "top-[42%] right-[0%]",
  "top-[70%] right-[6%]",
];

const heroBtn = "inline-flex min-h-14 items-center justify-center rounded-full px-7 text-base font-bold";
const sectionTitle = "break-keep text-[32px] leading-[1.25] font-bold tracking-tight sm:text-5xl sm:leading-[1.2]";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-[15px] font-bold text-primary sm:text-lg">{children}</p>;
}

export default function MainPage() {
  return (
    <div className="landing-wide bg-white [&_p]:text-pretty [&_p]:break-keep">
      <section className="relative overflow-hidden bg-ground">
        <div aria-hidden="true" className="blueprint absolute inset-0" />
        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-14 px-5 pt-16 lg:min-h-[calc(100dvh-65px)] lg:flex-row lg:justify-between lg:pt-0">
          <div className="w-full lg:max-w-xl lg:pb-10">
            <h1>
              <span className="block text-[34px] leading-tight font-bold tracking-tight sm:text-5xl">중고차 살 때는,</span>
              <Logo className="mt-2 inline-block text-[104px] leading-[1.15] sm:text-[148px]" />
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-body sm:text-xl">
              이 차, 이 연식의 고질병부터
              <br />
              매장에서 볼 곳까지 사러 가기 전에 확인하세요.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/cars" className={`${heroBtn} bg-primary text-white hover:bg-primary-hover`}>내 차 고질병 확인하기</Link>
              <Link href="/guide" className={`${heroBtn} border border-field bg-white text-ink hover:bg-chip`}>아직 차를 못 정했어요</Link>
            </div>
          </div>

          <div className="relative -mb-40 flex w-full max-w-[580px] flex-none justify-center self-end lg:-mb-24 lg:w-[580px]">
            <Phone label="올 뉴 투싼 고질병 리포트 화면 예시"><ReportScreen /></Phone>
            {HERO_TAGS.map((t, i) => (
              <span key={t.text} aria-hidden="true" className={`float absolute hidden whitespace-nowrap rounded-full border border-line bg-white px-4 py-2 text-sm font-medium shadow-float md:block ${t.className}`} style={{ animationDelay: `${i * -1.3}s` }}>
                {t.text}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="issues" className="scroll-mt-16 px-5 pt-24 sm:pt-32">
        <div className="reveal mx-auto max-w-5xl overflow-hidden rounded-[32px] bg-ground pt-14 text-center sm:pt-20">
          <div className="px-6">
            <Eyebrow>차종과 연식만 고르면</Eyebrow>
            <h2 className={sectionTitle}>이 차, 이 연식에<br /><span className="text-primary">고질병은 없을까요?</span></h2>
            <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-body sm:text-lg">같은 차도 세대마다 고질병이 달라요. 알려진 문제와 살 때 확인하는 방법을 함께 알려드려요.</p>
          </div>
          <div className="mt-12 flex h-[440px] justify-center gap-8 overflow-hidden sm:h-[500px]">
            <Phone label="투싼 세대 선택 화면 예시" className="hidden sm:block"><GenerationScreen /></Phone>
            <Phone label="올 뉴 투싼 고질병 목록 화면 예시" className="sm:mt-14"><ReportScreen /></Phone>
          </div>
        </div>
      </section>

      <section id="inspect" className="scroll-mt-16 pt-24 text-center sm:pt-32">
        <div className="reveal px-6">
          <Eyebrow>차 앞에 서면 막막할 때</Eyebrow>
          <h2 className={sectionTitle}>본넷 열고,<br /><span className="text-primary">번호 순서대로만.</span></h2>
          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-body sm:text-lg">어디를 어떻게 보고, 어떤 상태면 조심해야 하는지 그림 위 번호로 안내해요.</p>
        </div>
        <div className="reveal relative mx-auto mt-12 flex max-w-4xl justify-center">
          <Phone label="본넷 점검 포인트 화면 예시"><InspectScreen /></Phone>
          {BONNET_POINTS.map((p, i) => (
            <span key={p.no} aria-hidden="true" className={`float absolute hidden items-center gap-2 rounded-full border border-line bg-white px-4 py-2.5 text-[15px] font-bold shadow-float lg:flex ${POINT_POSITIONS[i]}`} style={{ animationDelay: `${i * -0.9}s` }}>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-danger text-xs text-white">{p.no}</span>
              {p.title}
            </span>
          ))}
        </div>
      </section>

      <section className="px-5 pt-24 sm:pt-32">
        <div className="reveal mx-auto flex max-w-5xl flex-col items-center gap-12 md:flex-row md:justify-between md:px-10">
          <div className="text-center md:text-left">
            <Eyebrow>빠뜨리지 않게</Eyebrow>
            <h2 className={sectionTitle}>매장에서는<br /><span className="text-primary">하나씩 체크만.</span></h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-body sm:text-lg">이력 조회부터 시운전까지, 내가 보는 차에 맞춘 목록을 만들어 드려요. 체크한 내용은 이 브라우저에 저장돼요.</p>
          </div>
          <Phone label="매장 체크리스트 화면 예시"><ChecklistScreen /></Phone>
        </div>
      </section>

      <section className="px-5 pt-24 sm:pt-32">
        <div className="reveal mx-auto flex max-w-5xl flex-col-reverse items-center gap-12 rounded-[32px] bg-primary-soft px-6 py-14 md:flex-row md:justify-between md:px-16">
          <Phone label="AI 가이드 화면 예시"><GuideScreen /></Phone>
          <div className="text-center md:text-right">
            <Eyebrow>어떤 차를 살지 고민이라면</Eyebrow>
            <h2 className={sectionTitle}>아직 차를<br />못 정했어도 괜찮아요</h2>
            <p className="mt-5 text-base leading-relaxed text-body sm:text-lg">용도와 예산만 알려주시면 AI가 맞는 차종을 추천해요.</p>
            <Link href="/guide" className={`${heroBtn} mt-8 bg-ink text-white hover:bg-ink-hover`}>AI에게 물어보기</Link>
          </div>
        </div>
      </section>

      <section className="px-5 pt-24 text-center sm:pt-32">
        <div className="reveal mx-auto max-w-3xl">
          <h2 className={sectionTitle}>확인한 정보와<br />확인 중인 정보를 나눠서 보여드려요</h2>
          <div className="mt-10 grid gap-4 text-left sm:grid-cols-2">
            <div className="rounded-2xl border border-line p-6">
              <span className="rounded-md bg-success-soft px-2.5 py-1 text-sm font-bold text-success">검증됨</span>
              <p className="mt-4 text-lg font-bold">출처를 직접 확인한 정보</p>
              <p className="mt-1 text-[15px] text-body">출처 링크를 함께 보여드려요.</p>
            </div>
            <div className="rounded-2xl border border-dashed border-warning-line p-6">
              <span className="rounded-md bg-warning-soft px-2.5 py-1 text-sm font-bold text-warning">참고</span>
              <p className="mt-4 text-lg font-bold">아직 확인 중인 정보</p>
              <p className="mt-1 text-[15px] text-body">정비소에서 한 번 더 물어보세요.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-24 bg-primary px-5 py-20 text-center text-white sm:mt-32 sm:py-28">
        <h2 className={sectionTitle}>사러 가기 전,<br />3분이면 충분해요</h2>
        <Link href="/cars" className={`${heroBtn} mt-9 bg-white text-primary hover:bg-primary-soft`}>내 차 고질병 확인하기</Link>
      </section>
    </div>
  );
}
