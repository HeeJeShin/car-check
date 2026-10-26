// 3. 세대·연식 선택 (기획 캔버스 "3. 세대·연식 선택")
// "올 뉴 투싼 (2015~2018)"처럼 사람이 아는 이름 + 연식 구간으로 고릅니다.
// 서버 컴포넌트: 차종마다 화면을 처음 방문 때 만들어 두고 재사용합니다(ISR). 연식 입력은 GenerationList(브라우저)에서.
import { notFound } from "next/navigation";
import { GenerationList } from "@/components/generation-list";
import type { CarModel } from "@/lib/api";
import { cachedApi } from "@/lib/cached";

export const revalidate = 3600;

// 빌드 때는 아무 차종도 미리 만들지 않고(빌드에 API가 필요 없게), 첫 방문 때 만들어 저장합니다.
export async function generateStaticParams() {
  return [];
}

export default async function GenerationsPage({ params }: { params: Promise<{ maker: string; name: string }> }) {
  const { maker, name } = await params;
  const [m, n] = [safeDecode(maker), safeDecode(name)];
  const gens = await cachedApi<CarModel[]>(`/cars/generations?${new URLSearchParams({ maker: m, name: n })}`);
  if (gens.length === 0) notFound();
  return <GenerationList maker={m} name={n} gens={gens} />;
}

// 경로의 한글은 %EC%..로 인코딩돼 들어올 수 있습니다. 이미 풀려 있으면 그대로.
function safeDecode(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}
