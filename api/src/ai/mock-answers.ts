// USE_MOCK_AI=true일 때 돌려주는 샘플 답변. 키 없이 화면 흐름을 확인하는 용도입니다.
// 실제 AI처럼 요청을 이해하지는 못하고, 등록된 차 앞쪽 3개를 항상 같은 모양으로 돌려줍니다.
import type { AiRecommendation, RecommendCandidate } from "./ai.service";

export const mockRecommendation = (candidates: RecommendCandidate[]): AiRecommendation => ({
  summary: "[목 모드 샘플] 구매가와 유지비의 균형이 좋은 차 위주로 골랐어요.",
  cars: candidates.slice(0, 3).map((car) => ({
    carModelId: car.id,
    yearFrom: car.yearFrom,
    yearTo: car.yearTo ?? car.yearFrom,
    why: "매물이 많아 고르기 쉽고 정비비 부담이 적은 편이에요.",
    watchOut: "주행거리와 소모품 교체 이력을 확인하세요.",
  })),
});
