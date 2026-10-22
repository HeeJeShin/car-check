import type { Metadata } from "next";
import { IBM_Plex_Sans_KR } from "next/font/google";
import "./globals.css";

// next/font: 폰트 파일을 빌드 때 받아 우리 서버에서 제공합니다(외부 요청·레이아웃 흔들림 없음).
// subsets는 "미리 불러올" 글자 범위일 뿐, 한글 글자 파일도 함께 포함됩니다.
const plex = IBM_Plex_Sans_KR({ weight: ["400", "500", "700"], subsets: ["latin"], variable: "--font-plex" });

export const metadata: Metadata = {
  title: "중구 — 중고차 구매가이드",
  description: "어떤 차를 골라야 할지, 매장에서 무엇을 봐야 할지, 내가 사려는 차의 연식별 고질병까지 알려드려요.",
};

// 기획대로 모바일 화면 기준. 넓은 화면에서는 가운데 한 줄로 보여줍니다.
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={plex.variable}>
      <body className="antialiased">
        <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-ground shadow-[0_0_0_1px_var(--color-line)]">{children}</div>
      </body>
    </html>
  );
}
