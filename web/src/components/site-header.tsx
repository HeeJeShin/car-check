// 모든 화면의 공통 헤더 (app/layout.tsx에서 한 번만 붙입니다). 모바일 안쪽 화면에서는 PageBar가 이 자리를 대신합니다.
import Link from "next/link";
import { Logo } from "@/components/logo";

const navLink = "hidden px-1 py-3 text-sm font-medium hover:text-primary md:block";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b max-md:group-has-[.page-bar]/site:hidden border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-baseline gap-2">
          <Logo />
          <span className="hidden text-xs text-muted sm:inline">중고차 구매가이드</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-5">
          <Link href="/#issues" className={navLink}>고질병</Link>
          <Link href="/#inspect" className={navLink}>매장 점검</Link>
          <Link href="/guide" className={navLink}>AI 차량 추천</Link>
          <Link href="/my-cars" className="flex min-h-11 items-center px-2 text-sm font-medium hover:text-primary">내 차량</Link>
          <Link href="/cars" className="flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-bold text-white hover:bg-primary-hover">차종 찾기</Link>
        </nav>
      </div>
    </header>
  );
}
