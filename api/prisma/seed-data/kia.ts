// 기아 차종(세대) + 엔진·미션 초안. seed.ts와 add-missing.ts가 같이 씁니다.
// ⚠️ Claude가 기억으로 쓴 초안입니다. 세대 이름·연식 경계(페이스리프트 시점)·엔진·미션 구성은
//    기아 공식 자료나 중고차 매물 정보로 확인해 주세요. 주요 엔진만 넣었고 일부 트림은 빠져 있습니다.
import { iccu } from "./ev-issues";
import { diesel, ev, gasoline, hybrid, lpg } from "./helpers";
import type { SeedCarModel } from "./types";

export const KIA_MODELS: SeedCarModel[] = [
  // 스포티지
  { maker: "기아", name: "스포티지", displayName: "스포티지R", generation: "SL", segment: "준중형 SUV", bodyType: "SUV", yearFrom: 2010, yearTo: 2013,
    aliases: ["스포티지r", "sportage"], powertrains: [diesel("2.0", "6단 자동"), gasoline("2.0", "6단 자동")] },
  { maker: "기아", name: "스포티지", displayName: "더 뉴 스포티지R", generation: "SL 부분변경", segment: "준중형 SUV", bodyType: "SUV", yearFrom: 2013, yearTo: 2015,
    aliases: ["더뉴스포티지r", "스포티지r", "sportage"], powertrains: [diesel("2.0", "6단 자동"), gasoline("2.0", "6단 자동")] },
  { maker: "기아", name: "스포티지", displayName: "스포티지 4세대", generation: "QL", segment: "준중형 SUV", bodyType: "SUV", yearFrom: 2015, yearTo: 2018,
    aliases: ["sportage", "스포티지ql", "더suv스포티지", "스포티지4세대"], powertrains: [diesel("2.0", "6단 자동"), diesel("1.7", "7단 DCT", "DCT")] },
  { maker: "기아", name: "스포티지", displayName: "스포티지 더 볼드", generation: "QL 부분변경", segment: "준중형 SUV", bodyType: "SUV", yearFrom: 2018, yearTo: 2021,
    aliases: ["sportage", "더볼드", "스포티지더볼드"], powertrains: [diesel("2.0", "8단 자동"), diesel("1.6", "7단 DCT", "DCT")] },
  { maker: "기아", name: "스포티지", displayName: "스포티지 5세대", generation: "NQ5", segment: "준중형 SUV", bodyType: "SUV", yearFrom: 2021, yearTo: null,
    aliases: ["sportage", "nq5", "디올뉴스포티지", "스포티지5세대"], powertrains: [gasoline("1.6 터보", "8단 자동"), diesel("2.0", "8단 자동")] },
  // 엔카처럼 하이브리드는 별도 모델로 나눕니다.
  { maker: "기아", name: "스포티지", displayName: "스포티지 5세대 하이브리드", generation: "NQ5 하이브리드", segment: "준중형 SUV", bodyType: "SUV", yearFrom: 2021, yearTo: 2024,
    aliases: ["sportage", "nq5", "스포티지하이브리드", "스포티지5세대하이브리드"], powertrains: [hybrid("1.6 터보", "6단 자동")] },

  // 쏘렌토
  { maker: "기아", name: "쏘렌토", displayName: "쏘렌토R", generation: "XM", segment: "중형 SUV", bodyType: "SUV", yearFrom: 2009, yearTo: 2014,
    aliases: ["쏘렌토r", "sorento"], powertrains: [diesel("2.0", "6단 자동"), diesel("2.2", "6단 자동")] },
  { maker: "기아", name: "쏘렌토", displayName: "올 뉴 쏘렌토", generation: "UM", segment: "중형 SUV", bodyType: "SUV", yearFrom: 2014, yearTo: 2017,
    aliases: ["sorento", "올뉴쏘렌토"], powertrains: [diesel("2.0", "6단 자동"), diesel("2.2", "6단 자동")] },
  { maker: "기아", name: "쏘렌토", displayName: "더 뉴 쏘렌토", generation: "UM 부분변경", segment: "중형 SUV", bodyType: "SUV", yearFrom: 2017, yearTo: 2020,
    aliases: ["sorento", "더뉴쏘렌토"], powertrains: [diesel("2.0", "8단 자동"), diesel("2.2", "8단 자동")] },
  { maker: "기아", name: "쏘렌토", displayName: "쏘렌토 4세대", generation: "MQ4", segment: "중형 SUV", bodyType: "SUV", yearFrom: 2020, yearTo: 2023,
    aliases: ["sorento", "mq4"], powertrains: [diesel("2.2", "8단 DCT", "DCT"), hybrid("1.6 터보", "6단 자동"), gasoline("2.5 터보", "8단 DCT", "DCT")] },
  { maker: "기아", name: "쏘렌토", displayName: "더 뉴 쏘렌토", generation: "MQ4 부분변경", segment: "중형 SUV", bodyType: "SUV", yearFrom: 2023, yearTo: null,
    aliases: ["sorento", "더뉴쏘렌토"], powertrains: [diesel("2.2", "8단 DCT", "DCT"), hybrid("1.6 터보", "6단 자동"), gasoline("2.5 터보", "8단 DCT", "DCT")] },

  // 니로 (하이브리드)
  { maker: "기아", name: "니로", displayName: "니로 1세대", generation: "DE", segment: "소형 SUV", bodyType: "SUV", yearFrom: 2016, yearTo: 2022,
    aliases: ["niro"], powertrains: [hybrid("1.6", "6단 DCT", "DCT")] },
  { maker: "기아", name: "니로", displayName: "디 올 뉴 니로", generation: "SG2", segment: "소형 SUV", bodyType: "SUV", yearFrom: 2022, yearTo: null,
    aliases: ["niro", "디올뉴니로"], powertrains: [hybrid("1.6", "6단 DCT", "DCT")] },

  // 모닝
  { maker: "기아", name: "모닝", displayName: "뉴 모닝", generation: "TA", segment: "경차", bodyType: "LIGHT", yearFrom: 2011, yearTo: 2017,
    aliases: ["morning", "뉴모닝"], powertrains: [gasoline("1.0", "4단 자동")] },
  { maker: "기아", name: "모닝", displayName: "올 뉴 모닝", generation: "JA", segment: "경차", bodyType: "LIGHT", yearFrom: 2017, yearTo: 2020,
    aliases: ["morning", "올뉴모닝"], powertrains: [gasoline("1.0", "4단 자동")] },
  { maker: "기아", name: "모닝", displayName: "모닝 어반", generation: "JA 부분변경", segment: "경차", bodyType: "LIGHT", yearFrom: 2020, yearTo: 2023,
    aliases: ["morning", "모닝어반"], powertrains: [gasoline("1.0", "4단 자동")] },
  { maker: "기아", name: "모닝", displayName: "더 뉴 모닝", generation: "JA 2차 부분변경", segment: "경차", bodyType: "LIGHT", yearFrom: 2023, yearTo: null,
    aliases: ["morning", "더뉴모닝"], powertrains: [gasoline("1.0", "4단 자동")] },

  // 레이
  { maker: "기아", name: "레이", displayName: "레이", generation: "TAM", segment: "경차", bodyType: "LIGHT", yearFrom: 2011, yearTo: 2017,
    aliases: ["ray"], powertrains: [gasoline("1.0", "4단 자동")] },
  { maker: "기아", name: "레이", displayName: "더 뉴 레이", generation: "TAM 부분변경", segment: "경차", bodyType: "LIGHT", yearFrom: 2017, yearTo: 2022,
    aliases: ["ray", "더뉴레이"], powertrains: [gasoline("1.0", "4단 자동")] },
  { maker: "기아", name: "레이", displayName: "더 뉴 기아 레이", generation: "TAM 2차 부분변경", segment: "경차", bodyType: "LIGHT", yearFrom: 2022, yearTo: null,
    aliases: ["ray", "더뉴기아레이"], powertrains: [gasoline("1.0", "4단 자동")] },

  // 셀토스
  { maker: "기아", name: "셀토스", displayName: "셀토스", generation: "SP2", segment: "소형 SUV", bodyType: "SUV", yearFrom: 2019, yearTo: 2022,
    aliases: ["seltos"], powertrains: [gasoline("1.6 터보", "7단 DCT", "DCT"), diesel("1.6", "7단 DCT", "DCT")] },
  { maker: "기아", name: "셀토스", displayName: "더 뉴 셀토스", generation: "SP2 부분변경", segment: "소형 SUV", bodyType: "SUV", yearFrom: 2022, yearTo: null,
    aliases: ["seltos", "더뉴셀토스"], powertrains: [gasoline("1.6 터보", "8단 자동"), gasoline("2.0", "IVT(무단)", "CVT")] },

  // K3
  { maker: "기아", name: "K3", displayName: "올 뉴 K3", generation: "BD", segment: "준중형 세단", bodyType: "SEDAN", yearFrom: 2018, yearTo: 2021,
    aliases: ["k3", "올뉴k3"], powertrains: [gasoline("1.6", "IVT(무단)", "CVT")] },
  { maker: "기아", name: "K3", displayName: "더 뉴 K3", generation: "BD 부분변경", segment: "준중형 세단", bodyType: "SEDAN", yearFrom: 2021, yearTo: 2024,
    aliases: ["k3", "더뉴k3"], powertrains: [gasoline("1.6", "IVT(무단)", "CVT")] },

  // K5 (1세대 TF는 seed.ts에 있음)
  { maker: "기아", name: "K5", displayName: "K5 2세대", generation: "JF", segment: "중형 세단", bodyType: "SEDAN", yearFrom: 2015, yearTo: 2019,
    aliases: ["k5", "jf", "k5jf"], powertrains: [gasoline("2.0", "6단 자동"), gasoline("1.6 터보", "7단 DCT", "DCT"), diesel("1.7", "7단 DCT", "DCT"), hybrid("2.0", "6단 자동"), lpg("2.0", "6단 자동")] },
  { maker: "기아", name: "K5", displayName: "K5 3세대", generation: "DL3", segment: "중형 세단", bodyType: "SEDAN", yearFrom: 2019, yearTo: 2023,
    aliases: ["k5", "dl3", "k5dl3"], powertrains: [gasoline("2.0", "6단 자동"), gasoline("1.6 터보", "8단 자동"), hybrid("2.0", "6단 자동"), lpg("2.0", "6단 자동")] },
  { maker: "기아", name: "K5", displayName: "더 뉴 K5", generation: "DL3 부분변경", segment: "중형 세단", bodyType: "SEDAN", yearFrom: 2023, yearTo: null,
    aliases: ["k5", "더뉴k5"], powertrains: [gasoline("2.0", "6단 자동"), gasoline("1.6 터보", "8단 자동"), hybrid("2.0", "6단 자동"), lpg("2.0", "6단 자동")] },

  // K8
  { maker: "기아", name: "K8", displayName: "K8", generation: "GL3", segment: "준대형 세단", bodyType: "SEDAN", yearFrom: 2021, yearTo: 2024,
    aliases: ["k8"], powertrains: [gasoline("2.5", "8단 자동"), gasoline("3.5", "8단 자동"), hybrid("1.6 터보", "6단 자동"), lpg("3.5", "8단 자동")] },
  { maker: "기아", name: "K8", displayName: "더 뉴 K8", generation: "GL3 부분변경", segment: "준대형 세단", bodyType: "SEDAN", yearFrom: 2024, yearTo: null,
    aliases: ["k8", "더뉴k8"], powertrains: [gasoline("2.5", "8단 자동"), gasoline("3.5", "8단 자동"), hybrid("1.6 터보", "6단 자동"), lpg("3.5", "8단 자동")] },

  // 카니발 (승합·미니밴)
  { maker: "기아", name: "카니발", displayName: "올 뉴 카니발", generation: "YP", segment: "미니밴", bodyType: "VAN", yearFrom: 2014, yearTo: 2018,
    aliases: ["carnival", "올뉴카니발"], powertrains: [diesel("2.2", "6단 자동"), gasoline("3.3", "6단 자동")] },
  { maker: "기아", name: "카니발", displayName: "더 뉴 카니발", generation: "YP 부분변경", segment: "미니밴", bodyType: "VAN", yearFrom: 2018, yearTo: 2020,
    aliases: ["carnival", "더뉴카니발"], powertrains: [diesel("2.2", "8단 자동"), gasoline("3.3", "8단 자동")] },
  { maker: "기아", name: "카니발", displayName: "카니발 4세대", generation: "KA4", segment: "미니밴", bodyType: "VAN", yearFrom: 2020, yearTo: 2023,
    aliases: ["carnival", "ka4", "카니발4세대"], powertrains: [diesel("2.2", "8단 자동"), gasoline("3.5", "8단 자동")] },
  { maker: "기아", name: "카니발", displayName: "더 뉴 카니발", generation: "KA4 부분변경", segment: "미니밴", bodyType: "VAN", yearFrom: 2023, yearTo: null,
    aliases: ["carnival", "더뉴카니발"], powertrains: [diesel("2.2", "8단 자동"), gasoline("3.5", "8단 자동"), hybrid("1.6 터보", "6단 자동")] },

  // 모하비
  { maker: "기아", name: "모하비", displayName: "모하비 더 마스터", generation: "HM 2차 부분변경", segment: "대형 SUV", bodyType: "SUV", yearFrom: 2019, yearTo: null,
    aliases: ["mohave", "모하비더마스터"], powertrains: [diesel("3.0", "8단 자동")] },

  // ── 전기차 ──
  { maker: "기아", name: "니로 EV", displayName: "니로 EV 1세대", generation: "DE EV", segment: "소형 SUV", bodyType: "SUV", yearFrom: 2018, yearTo: 2022,
    aliases: ["niro", "니로ev", "니로전기차"], powertrains: [ev("39.2kWh"), ev("64kWh")] },
  { maker: "기아", name: "니로 EV", displayName: "디 올 뉴 니로 EV", generation: "SG2 EV", segment: "소형 SUV", bodyType: "SUV", yearFrom: 2022, yearTo: null,
    aliases: ["niro", "니로ev", "디올뉴니로ev"], powertrains: [ev("64.8kWh")] },

  { maker: "기아", name: "EV6", displayName: "EV6", generation: "CV", segment: "준중형 SUV", bodyType: "SUV", yearFrom: 2021, yearTo: 2024,
    aliases: ["ev6"], powertrains: [ev("스탠다드 58kWh", "2WD"), ev("롱레인지 77.4kWh", "2WD"), ev("롱레인지 77.4kWh", "AWD")],
    issues: [iccu] },
  { maker: "기아", name: "EV6", displayName: "더 뉴 EV6", generation: "CV 부분변경", segment: "준중형 SUV", bodyType: "SUV", yearFrom: 2024, yearTo: null,
    aliases: ["ev6", "더뉴ev6"], powertrains: [ev("스탠다드 63kWh", "2WD"), ev("롱레인지 84kWh", "2WD"), ev("롱레인지 84kWh", "AWD")],
    issues: [iccu] },

  { maker: "기아", name: "EV9", displayName: "EV9", generation: "MV", segment: "대형 SUV", bodyType: "SUV", yearFrom: 2023, yearTo: null,
    aliases: ["ev9"], powertrains: [ev("스탠다드 76.1kWh", "2WD"), ev("롱레인지 99.8kWh", "2WD"), ev("롱레인지 99.8kWh", "AWD")] },

  { maker: "기아", name: "EV3", displayName: "EV3", generation: "SV1", segment: "소형 SUV", bodyType: "SUV", yearFrom: 2024, yearTo: null,
    aliases: ["ev3"], powertrains: [ev("스탠다드 58.3kWh"), ev("롱레인지 81.4kWh")] },

  { maker: "기아", name: "레이 EV", displayName: "더 뉴 기아 레이 EV", generation: "TAM EV", segment: "경차", bodyType: "LIGHT", yearFrom: 2023, yearTo: null,
    aliases: ["ray", "레이ev", "레이전기차"], powertrains: [ev("35.2kWh")] },
];
