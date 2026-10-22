// 제네시스 차종(세대) + 엔진·미션 초안. seed.ts와 add-missing.ts가 같이 씁니다.
// ⚠️ Claude가 기억으로 쓴 초안입니다. 세대 이름·연식 경계·엔진 구성은 공식 자료나 중고차 매물 정보로 확인해 주세요.
import { iccu } from "./ev-issues";
import { diesel, ev, gasoline } from "./helpers";
import type { SeedCarModel } from "./types";

export const GENESIS_MODELS: SeedCarModel[] = [
  { maker: "제네시스", name: "G80", displayName: "제네시스 G80", generation: "DH", segment: "대형 세단", bodyType: "SEDAN", yearFrom: 2016, yearTo: 2020,
    aliases: ["g80", "genesis", "제네시스dh"], powertrains: [gasoline("3.3", "8단 자동"), gasoline("3.8", "8단 자동"), gasoline("3.3 터보", "8단 자동"), diesel("2.2", "8단 자동")] },
  { maker: "제네시스", name: "G80", displayName: "디 올 뉴 G80", generation: "RG3", segment: "대형 세단", bodyType: "SEDAN", yearFrom: 2020, yearTo: null,
    aliases: ["g80", "genesis", "rg3", "디올뉴g80"], powertrains: [gasoline("2.5 터보", "8단 자동"), gasoline("3.5 터보", "8단 자동")] },
  { maker: "제네시스", name: "G80", displayName: "G80 전동화 모델", generation: "RG3 EV", segment: "대형 세단", bodyType: "SEDAN", yearFrom: 2021, yearTo: null,
    aliases: ["g80", "g80ev", "g80전동화", "일렉트리파이드g80"], powertrains: [ev("87.2~94.5kWh", "AWD")] },

  { maker: "제네시스", name: "GV70", displayName: "GV70", generation: "JK1", segment: "중형 SUV", bodyType: "SUV", yearFrom: 2020, yearTo: null,
    aliases: ["gv70"], powertrains: [gasoline("2.5 터보", "8단 자동"), gasoline("3.5 터보", "8단 자동"), diesel("2.2", "8단 자동")] },
  { maker: "제네시스", name: "GV70", displayName: "GV70 전동화 모델", generation: "JK1 EV", segment: "중형 SUV", bodyType: "SUV", yearFrom: 2022, yearTo: null,
    aliases: ["gv70", "gv70ev", "gv70전동화"], powertrains: [ev("77.4~84kWh", "AWD")], issues: [iccu] },

  { maker: "제네시스", name: "GV80", displayName: "GV80", generation: "JX1", segment: "대형 SUV", bodyType: "SUV", yearFrom: 2020, yearTo: null,
    aliases: ["gv80"], powertrains: [gasoline("2.5 터보", "8단 자동"), gasoline("3.5 터보", "8단 자동"), diesel("3.0", "8단 자동")] },

  { maker: "제네시스", name: "GV60", displayName: "GV60", generation: "JW1", segment: "준중형 SUV", bodyType: "SUV", yearFrom: 2021, yearTo: null,
    aliases: ["gv60"], powertrains: [ev("77.4kWh", "2WD"), ev("77.4kWh", "AWD")], issues: [iccu] },
];
