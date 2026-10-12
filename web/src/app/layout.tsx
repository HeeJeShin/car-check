import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Car Check — 중고차 고질병 체크",
  description: "차종과 연식을 넣으면 중고차 살 때 확인할 고질병과 체크 포인트를 알려줍니다.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <header className="border-b border-black/10 dark:border-white/10">
          <nav className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-3 text-sm">
            <Link href="/" className="mr-auto text-base font-bold">
              🚗 Car Check
            </Link>
            <Link href="/" className="hover:underline">
              차종 검색
            </Link>
            <Link href="/guide" className="hover:underline">
              AI 가이드
            </Link>
            <Link href="/admin" className="hover:underline">
              데이터 관리
            </Link>
          </nav>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
