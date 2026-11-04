import type { Metadata } from "next";
import { IBM_Plex_Sans_KR } from "next/font/google";
import { PageViewTracker } from "@/components/page-view-tracker";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

// next/font: 폰트 파일을 빌드 때 받아 우리 서버에서 제공합니다(외부 요청·레이아웃 흔들림 없음).
// subsets는 "미리 불러올" 글자 범위일 뿐, 한글 글자 파일도 함께 포함됩니다.
const plex = IBM_Plex_Sans_KR({ weight: ["400", "500", "700"], subsets: ["latin"], variable: "--font-plex" });

const DESCRIPTION = "어떤 차를 골라야 할지, 매장에서 무엇을 봐야 할지, 내가 사려는 차의 연식별 고질병까지 알려드려요.";

// 검색엔진 소유 확인 코드: 네이버 서치어드바이저·구글 서치 콘솔에서 받은 값을 환경변수에 넣으면 <meta>로 붙습니다.
const naverVerification = process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "중구 — 중고차 구매가이드",
  description: DESCRIPTION,
  openGraph: { type: "website", siteName: "중구 — 중고차 구매가이드", locale: "ko_KR", description: DESCRIPTION },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    ...(naverVerification && { other: { "naver-site-verification": naverVerification } }),
  },
};

// 기획대로 모바일 화면 기준. 넓은 화면에서는 가운데 한 줄로 보여줍니다.
// 관리 화면만 예외: .admin-wide가 들어 있으면 PC 너비까지 넓힘 (app/admin/layout.tsx)
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={plex.variable}>
      <body className="antialiased">
        <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-ground shadow-[0_0_0_1px_var(--color-line)] has-[.admin-wide]:max-w-6xl">{children}</div>
        {/* 방문 통계: 화면을 볼 때마다 우리 API에 기록 (관리 화면 → 방문 통계 차트) */}
        <PageViewTracker />
      </body>
    </html>
  );
}
