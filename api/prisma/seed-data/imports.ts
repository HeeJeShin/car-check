// 수입차 차종(세대) + 구동계 초안. seed.ts와 add-missing.ts가 같이 씁니다.
// ⚠️ Claude가 기억으로 쓴 초안입니다. 국내 출시 연도·트림 구성은 공식 자료나 중고차 매물 정보로 확인해 주세요.
import { batteryFireRecall } from "./ev-issues";
import { ev } from "./helpers";
import type { SeedCarModel } from "./types";

export const IMPORT_MODELS: SeedCarModel[] = [
  // 테슬라 (연식은 국내 출고 기준)
  { maker: "테슬라", name: "모델 3", displayName: "모델 3", generation: "초기형", segment: "중형 세단", bodyType: "SEDAN", yearFrom: 2019, yearTo: 2023,
    aliases: ["model3", "모델3", "tesla", "테슬라"], powertrains: [ev("스탠다드 레인지 플러스", "RWD"), ev("롱레인지", "AWD"), ev("퍼포먼스", "AWD")] },
  { maker: "테슬라", name: "모델 3", displayName: "모델 3 하이랜드", generation: "하이랜드", segment: "중형 세단", bodyType: "SEDAN", yearFrom: 2024, yearTo: null,
    aliases: ["model3", "모델3", "하이랜드", "tesla", "테슬라"], powertrains: [ev("RWD", "RWD"), ev("롱레인지", "AWD"), ev("퍼포먼스", "AWD")] },
  { maker: "테슬라", name: "모델 Y", displayName: "모델 Y", generation: "초기형", segment: "중형 SUV", bodyType: "SUV", yearFrom: 2021, yearTo: 2025,
    aliases: ["modely", "모델y", "tesla", "테슬라"], powertrains: [ev("RWD", "RWD"), ev("롱레인지", "AWD"), ev("퍼포먼스", "AWD")] },
  { maker: "테슬라", name: "모델 Y", displayName: "뉴 모델 Y (주니퍼)", generation: "주니퍼", segment: "중형 SUV", bodyType: "SUV", yearFrom: 2025, yearTo: null,
    aliases: ["modely", "모델y", "주니퍼", "tesla", "테슬라"], powertrains: [ev("RWD", "RWD"), ev("롱레인지", "AWD")] },

  // 쉐보레
  { maker: "쉐보레", name: "볼트 EV", displayName: "볼트 EV", generation: "1세대", segment: "소형 해치백", bodyType: "SEDAN", yearFrom: 2017, yearTo: 2023,
    aliases: ["bolt", "볼트", "볼트ev", "boltev"], powertrains: [ev("60~66kWh")],
    issues: [batteryFireRecall("배터리 셀 제조 결함으로 화재가 잇따라, 2017~2022년식 대부분을 대상으로 배터리 모듈(사실상 전체)을 교체하는 리콜이 있었던 것으로 알려져 있습니다.")] },
];
