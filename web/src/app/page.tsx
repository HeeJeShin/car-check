// 1. 첫 화면: 사이트 소개 (기획 캔버스 "1. 첫 화면")
// 데이터가 필요 없는 정적 화면이라 서버 컴포넌트로 둡니다("use client" 없음).
import Link from "next/link";
import { Card, primaryBtn, secondaryBtn } from "@/components/ui";

const PAINS = [
  { no: "01", title: "어떤 차를 사야 할지 모르겠어요", body: "용도와 예산만 알려주시면 맞는 차종을 추천하고, 무엇부터 알아보면 되는지 순서대로 안내해요." },
  { no: "02", title: "매장에서 뭘 봐야 할지 모르겠어요", body: "본넷 열고 볼 곳부터 시운전까지, 현장에서 하나씩 체크할 수 있는 목록을 드려요." },
  { no: "03", title: "이 차, 이 연식에 고질병은 없을까요?", body: "차종과 연식을 고르면 알려진 고질병과, 살 때 어떻게 확인하는지 알려드려요." },
];

const STEPS = [
  { title: "차종 고르기", body: "싼타페, 투싼, K5처럼 차 이름을 골라요" },
  { title: "세대·연식 고르기", body: "'올 뉴 투싼 (2015~2018)'처럼 연식 구간을 골라요" },
  { title: "고질병·체크리스트 확인", body: "매장에 가서 하나씩 체크하면 끝" },
];

export default function MainPage() {
  return (
    <>
      <header className="flex items-center justify-between border-b border-line bg-white px-5 py-4">
        <div className="flex items-baseline gap-2">
          <span className="text-[22px] font-bold tracking-tight">중구</span>
          <span className="text-xs text-muted">중고차 구매가이드</span>
        </div>
        <Link href="/cars" className="px-1 py-2.5 text-sm font-medium text-accent">차종 찾기</Link>
      </header>

      <section className="flex flex-col gap-4 bg-white px-5 pt-10 pb-8">
        <span className="self-start rounded-full bg-accent-soft px-2.5 py-1.5 text-xs font-medium text-accent">처음 사는 중고차도 안심하고</span>
        <h1 className="text-[30px] leading-[1.3] font-bold tracking-tight">
          중고차, 사러 가기 전에
          <br />
          중구에서 먼저 확인하세요
        </h1>
        <p className="text-[15px] leading-relaxed text-body">
          어떤 차를 골라야 할지, 매장에서 무엇을 봐야 할지, 내가 사려는 차의 연식별 고질병까지 한곳에서 알려드려요.
        </p>
        <div className="mt-2 flex flex-col gap-2.5">
          <Link href="/cars" className={primaryBtn}>내 차 고질병 확인하기</Link>
          <Link href="/guide" className={secondaryBtn}>아직 차를 못 정했어요</Link>
        </div>
      </section>

      <section className="flex flex-col gap-3.5 px-5 py-8">
        <h2 className="mb-1 text-xl font-bold">중고차, 이런 게 어렵죠</h2>
        {PAINS.map((p) => (
          <Card key={p.no} className="flex flex-col gap-2 p-[18px]">
            <span className="text-[13px] font-bold text-accent">{p.no}</span>
            <h3 className="text-[17px] font-bold">{p.title}</h3>
            <p className="text-sm leading-relaxed text-body">{p.body}</p>
          </Card>
        ))}
      </section>

      <section className="flex flex-col gap-3.5 px-5 pt-2 pb-8">
        <h2 className="mb-1 text-xl font-bold">이렇게 쓰세요</h2>
        {STEPS.map((s, i) => (
          <div key={s.title} className="flex items-start gap-3.5">
            <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-ink text-sm font-bold text-white">{i + 1}</span>
            <div>
              <p className="text-[15px] font-bold">{s.title}</p>
              <p className="mt-1 text-sm text-muted">{s.body}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="mx-5">
        <Card className="flex flex-col gap-2.5 p-5">
          <h2 className="text-[17px] font-bold">믿을 수 있는 정보만 표시해요</h2>
          <p className="flex items-center gap-2 text-sm text-body">
            <span className="rounded-md bg-[#DCFCE7] px-2 py-1 text-xs font-bold text-[#166534]">검증됨</span>출처를 직접 확인한 정보
          </p>
          <p className="flex items-center gap-2 text-sm text-body">
            <span className="rounded-md bg-[#FEF3C7] px-2 py-1 text-xs font-bold text-[#92400E]">참고</span>아직 확인 중인 정보
          </p>
          <p className="text-[13px] leading-relaxed text-muted">고질병 정보는 AI가 지어내지 않아요. 사람이 모으고 확인한 데이터만 보여드려요.</p>
        </Card>
      </section>

      <section className="flex flex-col gap-3 px-5 py-8">
        <p className="text-center text-[17px] font-bold">사러 가기 전, 3분이면 충분해요</p>
        <Link href="/cars" className={primaryBtn}>내 차 고질병 확인하기</Link>
      </section>

      <footer className="mt-auto border-t border-line p-5 text-xs leading-relaxed text-muted">
        중구 · 중고차 구매가이드
        <br />
        정보는 참고용이며, 구매 전 정비 전문가의 점검을 권장해요. ·{" "}
        <Link href="/admin" className="underline">데이터 관리</Link>
      </footer>
    </>
  );
}
