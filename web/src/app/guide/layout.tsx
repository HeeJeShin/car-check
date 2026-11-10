// AI 차량 추천 화면은 브라우저 컴포넌트라 제목·설명을 여기서 붙입니다.
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI 중고차 추천 — 조건에 맞는 차종·연식 찾기 | 중구",
  description: "돈이 적게 드는 차, 유지비 적은 차처럼 원하는 조건을 말하면 맞는 중고차와 연식을 추천하고 고질병까지 바로 확인할 수 있어요.",
};

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return children;
}
