// 관리 화면은 검색 결과에 나오지 않게 (robots.txt에서도 막음).
// PC에서는 넓게 쓰도록 .admin-wide 표시를 붙입니다 (app/layout.tsx가 보고 틀을 넓힘).
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "관리 화면 | 중구",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin-wide flex flex-1 flex-col">{children}</div>;
}
