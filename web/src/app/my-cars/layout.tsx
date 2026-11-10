// 내 차량은 사람마다 다른 화면이라 검색 결과에 나오지 않게 합니다.
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "내 차량 | 중구",
  robots: { index: false, follow: false },
};

export default function MyCarsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
