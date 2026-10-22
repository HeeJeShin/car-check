// ─────────────────────────────────────────────────────────────
// 미션·연료 종류별 "공통 규칙". 차마다 따로 쓰지 않고, 스펙(Powertrain)만 넣으면 자동으로 붙습니다.
//   예) 미션이 DCT → "시운전 때 저속 꿀렁거림 확인" + 시운전 2단계(가다 서다)를 강조
//
// ⚠️ Claude 초안입니다. 일반적인 정비 상식 수준이지만, 정비사에게 한 번 확인받고 다듬어 주세요.
// ─────────────────────────────────────────────────────────────

type Fuel = "GASOLINE" | "DIESEL" | "LPG" | "HYBRID" | "EV";
type Transmission = "AT" | "DCT" | "CVT" | "MT" | "REDUCER";
type PowertrainLike = { engine: string; fuel: Fuel; transmission: Transmission; gearbox?: string | null };

export const TRANSMISSION_LABEL: Record<Transmission, string> = { AT: "자동", DCT: "DCT", CVT: "CVT", MT: "수동", REDUCER: "감속기" };

// 매장 점검 가이드 하단 표: 미션 종류별로 시운전 때 느껴볼 것
export const TRANSMISSION_GUIDE: { transmission: Transmission; label: string; feel: string }[] = [
  { transmission: "DCT", label: "DCT", feel: "저속에서 꿀렁거림·울컥거림, 출발할 때 덜컥" },
  { transmission: "CVT", label: "CVT", feel: "가속할 때 '윙' 소리, 미끄러지는 듯한 느낌" },
  { transmission: "AT", label: "자동", feel: "변속할 때 '쿵' 충격, 변속이 늦게 됨" },
  { transmission: "MT", label: "수동", feel: "클러치가 미끄러지거나 기어가 잘 안 들어감" },
  { transmission: "REDUCER", label: "전기차", feel: "변속 충격은 없어요. 가속할 때 '윙'·'웅' 소리, 출발·정지 때 '덜컥'" },
];

const TRANSMISSION_TIP: Record<Transmission, string> = {
  DCT: "DCT(듀얼 클러치) 미션이에요. 시운전 때 천천히 가다 서다를 반복하면서 꿀렁거림·울컥거림이 있는지 느껴보세요.",
  CVT: "CVT(무단 변속) 미션이에요. 가속할 때 '윙' 소리가 크거나 미끄러지는 느낌이 드는지 보세요.",
  AT: "일반 자동 미션이에요. 속도를 올릴 때 변속 충격('쿵')이나 변속이 늦게 되는지 느껴보세요.",
  MT: "수동 미션이에요. 클러치가 미끄러지거나 기어가 뻑뻑하게 들어가지 않는지 보세요.",
  REDUCER: "전기차라 변속기 대신 1단 감속기예요. 가속·감속할 때 '윙'·'웅' 하는 소리가 커지거나, 출발·정지할 때 '덜컥' 하는 충격이 있는지 느껴보세요.",
};

// 연료 종류마다 여러 개 붙을 수 있습니다.
const FUEL_TIP: Partial<Record<Fuel, string[]>> = {
  DIESEL: [
    "디젤이에요. 짧은 거리 위주로 탄 차인지 물어보고, 가속할 때 힘이 빠지거나 검은 연기가 나는지 보세요.",
    "엔진 위 플라스틱 커버(CRDi 등이 적힌 판)는 딜러에게 떼 달라고 하세요. 커버 아래 인젝터 둘레에 검은 그을음이 굳어 있는지, 헤드커버(엔진 맨 윗뚜껑) 둘레에 오일이 샌 자국이 있는지 봐야 해요. 원래 딜러가 먼저 보여줘야 하는 부분이라, 떼 주지 않으면 그 차는 거르는 게 좋아요.",
  ],
  LPG: ["LPG예요. 렌터카·택시 출신이 많으니 사용 이력을 꼭 확인하고, 시동이 한 번에 걸리는지 보세요."],
  HYBRID: ["하이브리드예요. 구동 배터리 보증 기간이 남았는지, 계기판에 경고등이 없는지 확인하세요."],
  EV: [
    "전기차예요. 배터리 상태(SOH, 새것 대비 몇 %)를 꼭 확인하세요. 제조사 서비스센터나 배터리 진단을 해주는 정비소에서 볼 수 있고, 딜러가 진단서를 주면 더 좋아요.",
    "구동 배터리 보증 기간·주행거리가 남았는지, 중고로 넘어가도 보증이 그대로 이어지는지 확인하세요. 리콜(배터리·충전 장치) 조치 여부는 자동차리콜센터(car.go.kr)에서 차대번호로 조회돼요.",
    "차 밑 배터리 팩에 긁히거나 찍힌 자국이 있는지 봐 달라고 하세요(리프트가 있으면 가장 좋아요). 충전구 단자가 그을리거나 녹슬지 않았는지, 실제로 충전이 시작되는지도 확인하세요.",
  ],
};

/** 리포트·점검 가이드의 "그래서 이 차는 이런 걸 조심하세요". 같은 종류는 한 번만. */
export function powertrainTips(powertrains: PowertrainLike[]) {
  const tips: { tag: "미션" | "엔진"; text: string }[] = [];
  for (const t of new Set(powertrains.map((p) => p.transmission))) tips.push({ tag: "미션", text: TRANSMISSION_TIP[t] });
  for (const f of new Set(powertrains.map((p) => p.fuel))) {
    for (const text of FUEL_TIP[f] ?? []) tips.push({ tag: "엔진", text });
  }
  return tips;
}

// 시운전 순서. focus에 해당하는 미션이면 화면에서 "이 차 포인트"로 강조합니다.
const DRIVE_STEPS: { title: string; how: string; focus: Transmission[] }[] = [
  { title: "차가운 상태에서 시동", how: "시동 직후 떨림·쇳소리가 심한지 들어보세요.", focus: [] },
  { title: "천천히 가다 서다 반복", how: "막히는 길처럼 10~20km/h로 출발·정지를 여러 번 해보세요. DCT는 이때 꿀렁거림이 잘 드러나요.", focus: ["DCT"] },
  { title: "속도 내서 달리기", how: "변속이 매끄러운지, 핸들·차체 떨림이나 바람·바퀴 소음이 큰지 보세요. 전기차는 엔진 소리가 없어 모터·감속기 소리가 잘 들려요.", focus: ["AT", "CVT", "REDUCER"] },
  { title: "브레이크 세게 밟기", how: "한쪽으로 쏠리거나 핸들이 떨리는지 보세요. (안전한 곳에서)", focus: [] },
  { title: "핸들 끝까지 돌리기", how: "정차 상태에서 좌우 끝까지 돌릴 때 '뚝뚝'·'끼익' 소리가 나는지 들어보세요.", focus: [] },
];

export function driveSteps(powertrains: PowertrainLike[]) {
  const mine = new Set(powertrains.map((p) => p.transmission));
  return DRIVE_STEPS.map((s) => ({ title: s.title, how: s.how, focus: s.focus.some((t) => mine.has(t)) }));
}
