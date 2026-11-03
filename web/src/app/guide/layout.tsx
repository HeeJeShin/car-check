// AI 가이드 화면은 브라우저 컴포넌트라 제목·설명을 여기서 붙입니다.
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "중고차, 무엇부터 알아볼까? AI 가이드 | 중구",
  description: "처음 중고차를 사는데 무엇부터 봐야 할지, 용도·예산에 맞는 차종은 무엇인지 물어보세요.",
};

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return children;
}
