// 모든 화면의 공통 푸터 (app/layout.tsx에서 한 번만 붙입니다).
import Link from "next/link";
import { Logo } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-white py-8 text-[13px] leading-relaxed text-muted">
      <div className="mx-auto max-w-6xl px-5">
        <p className="flex items-baseline gap-2">
          <Logo className="text-xl" />
          <span className="font-bold text-body">중고차 구매가이드</span>
        </p>
        <p className="mt-2 break-keep">
          정보는 참고용이며, 구매 전 정비 전문가의 점검을 권장해요. · <Link href="/admin" className="underline hover:text-primary">데이터 관리</Link>
        </p>
      </div>
    </footer>
  );
}
