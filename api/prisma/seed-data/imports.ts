// 수입차 차종(세대) + 구동계 초안. seed.ts와 add-missing.ts가 같이 씁니다.
// ⚠️ Claude가 기억으로 쓴 초안입니다. 국내 출시 연도·트림 구성은 공식 자료나 중고차 매물 정보로 확인해 주세요.
import { batteryFireRecall } from "./ev-issues";
import { ev } from "./helpers";
import type { SeedCarModel, SeedIssue } from "./types";

// 테슬라 모델 3·Y: 국내 FSD(감독형)는 미국 생산 차만 쓸 수 있어요 (2026년 11월 기준, 바뀔 수 있음).
const teslaFsdChinaMade: SeedIssue = {
  part: "전장",
  title: "중국 생산 차는 국내 FSD(감독형) 사용 불가",
  description:
    "국내 테슬라는 미국 생산 차만 FSD(감독형)를 쓸 수 있습니다. 한·미 FTA로 미국 생산 차에만 예외가 인정됐고, 중국 상하이 생산 모델 3·Y는 국내 자동차안전기준에 맞지 않아 최신 하드웨어(HW4)여도 쓸 수 없다고 국토교통부가 밝혔습니다. 국내 모델 3·Y는 대부분 상하이 생산이고, 같은 모델이라도 생산 시기에 따라 미국산이 섞여 있습니다. 중국 생산 차에 언제 열릴지는 정해지지 않았습니다(2026년 11월 기준).",
  checkHow:
    "FSD가 필요하면 꼭 사기 전에 차대번호 앞 3자리를 보세요. LRW로 시작하면 중국 상하이 생산(FSD 불가), 5YJ·7SA로 시작하면 미국 생산입니다. 차대번호는 자동차등록증이나 앞유리 아래쪽에서 볼 수 있어요. FSD 옵션을 이미 산 차인지, 하드웨어 버전(HW3·HW4)도 테슬라 앱이나 판매자에게 확인하세요.",
  severity: "MEDIUM",
  note: "출처 메모: 조달경제신문 '중국산 테슬라 FSD 형평성 논란' https://www.jodaleconomy.com/news/articleView.html?idxno=3118 · 유카포스트 'FSD 가능 모델 총정리' https://www.yuccapostkorea.com/news/articleView.html?idxno=2445 · 차대번호 코드는 테슬라 서비스 매뉴얼(VIN) 기준 — 정책이 바뀌면 고쳐야 함",
};

export const IMPORT_MODELS: SeedCarModel[] = [
  // 테슬라 (연식은 국내 출고 기준)
  { maker: "테슬라", name: "모델 3", displayName: "모델 3", generation: "초기형", segment: "중형 세단", bodyType: "SEDAN", yearFrom: 2019, yearTo: 2023,
    aliases: ["model3", "모델3", "tesla", "테슬라"], powertrains: [ev("스탠다드 레인지 플러스", "RWD"), ev("롱레인지", "AWD"), ev("퍼포먼스", "AWD")],
    issues: [teslaFsdChinaMade] },
  { maker: "테슬라", name: "모델 3", displayName: "모델 3 하이랜드", generation: "하이랜드", segment: "중형 세단", bodyType: "SEDAN", yearFrom: 2024, yearTo: null,
    aliases: ["model3", "모델3", "하이랜드", "tesla", "테슬라"], powertrains: [ev("RWD", "RWD"), ev("롱레인지", "AWD"), ev("퍼포먼스", "AWD")],
    issues: [teslaFsdChinaMade] },
  { maker: "테슬라", name: "모델 Y", displayName: "모델 Y", generation: "초기형", segment: "중형 SUV", bodyType: "SUV", yearFrom: 2021, yearTo: 2025,
    aliases: ["modely", "모델y", "tesla", "테슬라"], powertrains: [ev("RWD", "RWD"), ev("롱레인지", "AWD"), ev("퍼포먼스", "AWD")],
    issues: [teslaFsdChinaMade] },
  { maker: "테슬라", name: "모델 Y", displayName: "뉴 모델 Y (주니퍼)", generation: "주니퍼", segment: "중형 SUV", bodyType: "SUV", yearFrom: 2025, yearTo: null,
    aliases: ["modely", "모델y", "주니퍼", "tesla", "테슬라"], powertrains: [ev("RWD", "RWD"), ev("롱레인지", "AWD")],
    issues: [teslaFsdChinaMade] },

  // 쉐보레
  { maker: "쉐보레", name: "볼트 EV", displayName: "볼트 EV", generation: "1세대", segment: "소형 해치백", bodyType: "SEDAN", yearFrom: 2017, yearTo: 2023,
    aliases: ["bolt", "볼트", "볼트ev", "boltev"], powertrains: [ev("60~66kWh")],
    issues: [batteryFireRecall("배터리 셀 제조 결함으로 화재가 잇따라, 2017~2022년식 대부분을 대상으로 배터리 모듈(사실상 전체)을 교체하는 리콜이 있었던 것으로 알려져 있습니다.")] },
];
