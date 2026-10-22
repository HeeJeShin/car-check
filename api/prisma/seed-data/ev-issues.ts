// 여러 전기차가 같이 쓰는 고질병 초안. 같은 부품을 쓰는 차종마다 붙입니다.
// ⚠️ Claude가 기억으로 쓴 초안입니다. 리콜 대상 생산 기간·조치 내용은 자동차리콜센터(car.go.kr)에서 확인해 주세요.
import type { SeedIssue } from "./types";

export const DRAFT_NOTE = "Claude 초안 — 출처 확인 필요";

// E-GMP(아이오닉 5·6, EV6, GV60 …)가 같이 쓰는 통합충전제어장치
export const iccu: SeedIssue = {
  part: "전장",
  title: "ICCU(통합충전제어장치) 고장 리콜",
  description:
    "ICCU가 고장 나면 12V 보조배터리가 충전되지 않아 주행 중 경고등이 뜨고 동력이 끊길 수 있다고 알려져 있습니다. 2024년 국내 리콜(소프트웨어 업데이트, 필요 시 부품 교체)이 있었고 이후 추가 조치도 있었습니다.",
  checkHow:
    "자동차리콜센터(car.go.kr)에서 차대번호로 ICCU 리콜 조치가 끝났는지 조회하세요. 정비 기록에 ICCU 교체 이력이 있는지, 계기판에 '전기차 시스템 점검' 경고가 뜨지 않는지 확인하세요.",
  severity: "HIGH",
  note: DRAFT_NOTE,
};

// 초기형 전기차 배터리 화재 리콜 (코나 일렉트릭 등)
export const batteryFireRecall = (desc: string): SeedIssue => ({
  part: "배터리",
  title: "구동 배터리 화재 위험 리콜",
  description: desc,
  checkHow:
    "자동차리콜센터(car.go.kr)에서 차대번호로 리콜 조치 완료 여부를 조회하세요. 배터리를 새것으로 바꾼 차라면 교체 확인서(정비 기록)를 달라고 하세요. 교체 안 된 차는 사지 않는 게 좋아요.",
  severity: "HIGH",
  note: DRAFT_NOTE,
});
