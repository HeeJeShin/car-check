// 2. 차종 선택 (기획 캔버스 "2. 차종 선택"): 여기서는 차 이름만 고릅니다. 연식은 다음 화면에서.
// 서버 컴포넌트: 차종 목록을 서버에서 받아 화면을 미리 만들어 둡니다(ISR). 검색·필터는 CarSelect(브라우저)에서.
import { CarSelect } from "@/components/car-select";
import type { ModelCard } from "@/lib/api";
import { cachedApi } from "@/lib/cached";

export const revalidate = 3600; // lib/cached.ts의 REVALIDATE와 같게 (Next.js가 숫자를 직접 읽어야 해서 따로 씀)

export default async function CarSelectPage() {
  const models = await cachedApi<ModelCard[]>("/cars/models");
  return <CarSelect models={models} />;
}
