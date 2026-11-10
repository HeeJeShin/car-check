// ─────────────────────────────────────────────────────────────
// AI(Gemini)에게 주는 역할과 규칙.
//
// ⭐ 이 서비스에서 AI의 역할은 "차량 추천"뿐입니다. 사실의 출처가 아닙니다.
//    - 하는 일: 사용자가 말한 조건에 맞는 차종과 연식을 등록된 차 안에서 고르기
//    - 안 하는 일: 특정 차종의 고질병을 단정해서 말하기 → 그건 출처를 모은 DB에서만 보여줍니다.
//    AI는 그럴듯한 거짓말(환각)을 할 수 있어서, 고른 차의 번호와 연식은 서버가 DB와 다시 맞춰 봅니다.
// ─────────────────────────────────────────────────────────────

export const RECOMMEND_SYSTEM = `당신은 사용자가 말한 조건에 맞는 중고차를 골라 주는 추천 담당입니다. 한국 중고차 시장 기준으로, 짧고 쉬운 한국어로 답하세요.
- 아래 "등록된 차" 목록 안에서만 고르고, 고른 차의 맨 앞 번호를 carModelId에 그대로 적으세요. 목록에 없는 차는 추천하지 마세요.
- 조건에 맞는 차를 1~5개 고르세요. 맞는 차가 없으면 cars를 빈 배열로 두고 summary에 이유를 적으세요.
- yearFrom·yearTo에는 그 차의 판매 연식 안에서 사기 좋은 연식 범위를 적으세요.
- "돈이 적게", "저렴한 차"처럼 구매가인지 유지비인지 애매하면 둘 다 고려하고, why에 어느 쪽에 유리한지 적으세요.
- 현재 시세를 모르므로 금액은 적지 마세요. "구매가가 낮은 편", "연비가 좋아 유지비가 적은 편"처럼 이유로 설명하세요.
- 특정 차종의 고질병·결함을 단정해서 말하지 마세요. watchOut에는 주행거리·소모품 이력처럼 일반적인 확인 사항만 적으세요.
- 중고차 추천과 관계없는 요청이면 cars를 빈 배열로 두고 summary에 원하는 조건을 말해 달라고 적으세요.`;

// 구조화된 출력(JSON) 스키마. 모델이 이 모양으로만 답하게 강제합니다.
// 자유 텍스트로 받으면 화면에 카드로 나눠 그리기 어렵고, 파싱이 깨지기 쉽습니다.
export const RECOMMEND_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string", description: "추천 방향 한두 문장" },
    cars: {
      type: "array",
      items: {
        type: "object",
        properties: {
          carModelId: { type: "integer", description: "등록된 차 목록의 맨 앞 번호" },
          yearFrom: { type: "integer" },
          yearTo: { type: "integer" },
          why: { type: "string" },
          watchOut: { type: "string" },
        },
        required: ["carModelId", "yearFrom", "yearTo", "why", "watchOut"],
      },
    },
  },
  required: ["summary", "cars"],
};
