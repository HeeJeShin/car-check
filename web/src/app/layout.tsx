import type { Metadata } from "next";
import { IBM_Plex_Sans_KR } from "next/font/google";
import { PageViewTracker } from "@/components/page-view-tracker";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

// next/font: 폰트 파일을 빌드 때 받아 우리 서버에서 제공합니다(외부 요청·레이아웃 흔들림 없음).
// subsets는 "미리 불러올" 글자 범위일 뿐, 한글 글자 파일도 함께 포함됩니다.
const plex = IBM_Plex_Sans_KR({ weight: ["400", "500", "700"], subsets: ["latin"], variable: "--font-plex" });

const DESCRIPTION = "중고차 추천부터 차종·연식별 중고차 고질병 확인, 매장 점검까지. 매장에서 바로 찾아보는 중고차 구매가이드예요.";

// 검색엔진 소유 확인 코드: 네이버 서치어드바이저·구글 서치 콘솔에서 받은 값을 환경변수에 넣으면 <meta>로 붙습니다.
const naverVerification = process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "중구 — 중고차 고질병 확인·중고차 추천",
  description: DESCRIPTION,
  keywords: ["중고차 추천", "중고차 고질병", "중고차 구매가이드", "중고차 체크리스트", "연식별 고질병", "중고차 구매 요령"],
  // 파비콘을 쓰지 않습니다. 브라우저가 /favicon.ico를 찾다가 404를 내지 않게 빈 값으로 둡니다.
  icons: { icon: "data:," },
  openGraph: { type: "website", siteName: "중구 — 중고차 구매가이드", locale: "ko_KR", description: DESCRIPTION },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    ...(naverVerification && { other: { "naver-site-verification": naverVerification } }),
  },
};

// 헤더·푸터는 모든 화면에서 같은 전체 너비. 본문만 모바일 기준으로, 넓은 화면에서는 가운데 한 줄로 보여줍니다.
// 예외: .admin-wide가 들어 있으면 PC 너비까지 넓힘 (app/admin/layout.tsx), .landing-wide는 메인 화면용 전체 너비, .page-card는 차종·연식 고르기·로그인 카드 화면(components/page-card.tsx)
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={plex.variable}>
      <body className="group/site flex min-h-dvh flex-col antialiased">
        <SiteHeader />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col bg-ground shadow-[0_0_0_1px_var(--color-line)] md:bg-white md:shadow-none has-[.admin-wide]:max-w-6xl has-[.landing-wide]:max-w-none has-[.landing-wide]:shadow-none has-[.page-card]:max-w-none has-[.page-card]:bg-white has-[.page-card]:shadow-none">
          {children}
        </div>
        <SiteFooter />
        {/* 방문 통계: 화면을 볼 때마다 우리 API에 기록 (관리 화면 → 방문 통계 차트) */}
        <PageViewTracker />
      </body>
    </html>
  );
}
