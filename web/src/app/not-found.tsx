// 없는 차종·세대 주소로 들어왔을 때 (API가 404를 주면 lib/cached.ts가 이 화면으로 보냅니다)
import Link from "next/link";
import { TopBar, primaryBtn } from "@/components/ui";

export default function NotFound() {
  return (
    <>
      <TopBar back="/cars" backLabel="차종 고르기" />
      <section className="flex flex-col gap-4 p-5 pt-10">
        <h1 className="text-xl font-bold">찾는 차가 없어요</h1>
        <p className="text-sm leading-relaxed text-body">주소가 바뀌었거나 아직 등록되지 않은 차종이에요.</p>
        <Link href="/cars" className={primaryBtn}>차종 다시 고르기</Link>
      </section>
    </>
  );
}
