// 관리 화면은 검색 결과에 나오지 않게 (robots.txt에서도 막음)
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "관리 화면 | 중구",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
