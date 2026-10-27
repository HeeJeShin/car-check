// 현대 차종(세대) + 엔진·미션 초안. seed.ts와 add-missing.ts가 같이 씁니다.
// (투싼·쏘나타·그랜저는 고질병 예시와 함께 seed.ts에 있습니다)
// ⚠️ Claude가 기억으로 쓴 초안입니다. 세대 이름·연식 경계(페이스리프트 시점)·엔진·미션 구성은
//    현대 공식 자료나 중고차 매물 정보로 확인해 주세요. 주요 엔진만 넣었고 일부 트림은 빠져 있습니다.
import { batteryFireRecall, iccu } from "./ev-issues";
import { diesel, ev, gasoline, hybrid, lpg } from "./helpers";
import type { SeedCarModel } from "./types";

export const HYUNDAI_MODELS: SeedCarModel[] = [
  // 아반떼
  { maker: "현대", name: "아반떼", displayName: "아반떼 MD", generation: "MD", segment: "준중형 세단", bodyType: "SEDAN", yearFrom: 2010, yearTo: 2015,
    aliases: ["avante", "아반떼md"], powertrains: [gasoline("1.6 GDi", "6단 자동")] },
  { maker: "현대", name: "아반떼", displayName: "아반떼 AD", generation: "AD", segment: "준중형 세단", bodyType: "SEDAN", yearFrom: 2015, yearTo: 2018,
    aliases: ["avante", "아반떼ad"], powertrains: [gasoline("1.6 GDi", "6단 자동"), diesel("1.6", "7단 DCT", "DCT")] },
  { maker: "현대", name: "아반떼", displayName: "더 뉴 아반떼", generation: "AD 부분변경", segment: "준중형 세단", bodyType: "SEDAN", yearFrom: 2018, yearTo: 2020,
    aliases: ["avante", "더뉴아반떼"], powertrains: [gasoline("1.6", "IVT(무단)", "CVT")] },
  { maker: "현대", name: "아반떼", displayName: "아반떼 7세대", generation: "CN7", segment: "준중형 세단", bodyType: "SEDAN", yearFrom: 2020, yearTo: 2023,
    aliases: ["avante", "cn7", "올뉴아반떼"], powertrains: [gasoline("1.6", "IVT(무단)", "CVT"), hybrid("1.6", "6단 DCT", "DCT")] },
  { maker: "현대", name: "아반떼", displayName: "더 뉴 아반떼", generation: "CN7 부분변경", segment: "준중형 세단", bodyType: "SEDAN", yearFrom: 2023, yearTo: null,
    aliases: ["avante", "더뉴아반떼"], powertrains: [gasoline("1.6", "IVT(무단)", "CVT"), hybrid("1.6", "6단 DCT", "DCT")] },

  // 싼타페
  { maker: "현대", name: "싼타페", displayName: "싼타페 CM", generation: "CM", segment: "중형 SUV", bodyType: "SUV", yearFrom: 2005, yearTo: 2012,
    aliases: ["santafe", "싼타페cm"], powertrains: [diesel("2.0", "자동"), diesel("2.2", "자동")] },
  { maker: "현대", name: "싼타페", displayName: "싼타페 DM", generation: "DM", segment: "중형 SUV", bodyType: "SUV", yearFrom: 2012, yearTo: 2015,
    aliases: ["santafe", "싼타페dm"], powertrains: [diesel("2.0", "6단 자동"), diesel("2.2", "6단 자동")] },
  { maker: "현대", name: "싼타페", displayName: "싼타페 더 프라임", generation: "DM 부분변경", segment: "중형 SUV", bodyType: "SUV", yearFrom: 2015, yearTo: 2018,
    aliases: ["santafe", "더프라임", "싼타페더프라임"], powertrains: [diesel("2.0", "6단 자동"), diesel("2.2", "6단 자동"), gasoline("2.0 터보", "6단 자동")] },
  { maker: "현대", name: "싼타페", displayName: "싼타페 TM", generation: "TM", segment: "중형 SUV", bodyType: "SUV", yearFrom: 2018, yearTo: 2020,
    aliases: ["santafe", "싼타페tm"], powertrains: [diesel("2.0", "8단 자동"), diesel("2.2", "8단 자동"), gasoline("2.0 터보", "8단 자동")] },
  { maker: "현대", name: "싼타페", displayName: "더 뉴 싼타페", generation: "TM 부분변경", segment: "중형 SUV", bodyType: "SUV", yearFrom: 2020, yearTo: 2023,
    aliases: ["santafe", "더뉴싼타페"], powertrains: [diesel("2.2", "8단 DCT", "DCT"), gasoline("2.5 터보", "8단 DCT", "DCT"), hybrid("1.6 터보", "6단 자동")] },
  { maker: "현대", name: "싼타페", displayName: "디 올 뉴 싼타페", generation: "MX5", segment: "중형 SUV", bodyType: "SUV", yearFrom: 2023, yearTo: null,
    aliases: ["santafe", "mx5", "디올뉴싼타페"], powertrains: [gasoline("2.5 터보", "8단 DCT", "DCT"), hybrid("1.6 터보", "6단 자동")] },

  // 팰리세이드
  { maker: "현대", name: "팰리세이드", displayName: "팰리세이드", generation: "LX2", segment: "대형 SUV", bodyType: "SUV", yearFrom: 2018, yearTo: 2022,
    aliases: ["palisade", "펠리세이드"], powertrains: [diesel("2.2", "8단 자동"), gasoline("3.8", "8단 자동")] },
  { maker: "현대", name: "팰리세이드", displayName: "더 뉴 팰리세이드", generation: "LX2 부분변경", segment: "대형 SUV", bodyType: "SUV", yearFrom: 2022, yearTo: 2025,
    aliases: ["palisade", "펠리세이드", "더뉴팰리세이드"], powertrains: [diesel("2.2", "8단 자동"), gasoline("3.8", "8단 자동")] },
  { maker: "현대", name: "팰리세이드", displayName: "디 올 뉴 팰리세이드", generation: "LX3", segment: "대형 SUV", bodyType: "SUV", yearFrom: 2025, yearTo: null,
    aliases: ["palisade", "펠리세이드", "디올뉴팰리세이드"], powertrains: [gasoline("2.5 터보", "8단 자동"), hybrid("2.5 터보", "6단 자동")] },

  // 코나
  { maker: "현대", name: "코나", displayName: "코나 1세대", generation: "OS", segment: "소형 SUV", bodyType: "SUV", yearFrom: 2017, yearTo: 2020,
    aliases: ["kona"], powertrains: [gasoline("1.6 터보", "7단 DCT", "DCT"), diesel("1.6", "7단 DCT", "DCT")] },
  { maker: "현대", name: "코나", displayName: "더 뉴 코나", generation: "OS 부분변경", segment: "소형 SUV", bodyType: "SUV", yearFrom: 2020, yearTo: 2023,
    aliases: ["kona", "더뉴코나"], powertrains: [gasoline("1.6 터보", "7단 DCT", "DCT"), gasoline("2.0", "IVT(무단)", "CVT"), hybrid("1.6", "6단 DCT", "DCT")] },
  { maker: "현대", name: "코나", displayName: "디 올 뉴 코나", generation: "SX2", segment: "소형 SUV", bodyType: "SUV", yearFrom: 2023, yearTo: null,
    aliases: ["kona", "디올뉴코나"], powertrains: [gasoline("1.6 터보", "8단 자동"), gasoline("2.0", "IVT(무단)", "CVT"), hybrid("1.6", "6단 DCT", "DCT")] },

  // 캐스퍼 (경형 SUV → 경차로 분류)
  { maker: "현대", name: "캐스퍼", displayName: "캐스퍼", generation: "AX1", segment: "경형 SUV", bodyType: "LIGHT", yearFrom: 2021, yearTo: null,
    aliases: ["casper"], powertrains: [gasoline("1.0", "4단 자동"), gasoline("1.0 터보", "4단 자동")] },

  // 쏘나타 (YF는 seed.ts에 있음)
  { maker: "현대", name: "쏘나타", displayName: "LF 쏘나타", generation: "LF", segment: "중형 세단", bodyType: "SEDAN", yearFrom: 2014, yearTo: 2017,
    aliases: ["sonata", "lf쏘나타", "쏘나타lf"], powertrains: [gasoline("2.0", "6단 자동"), gasoline("1.6 터보", "7단 DCT", "DCT"), diesel("1.7", "7단 DCT", "DCT"), lpg("2.0", "6단 자동")] },
  { maker: "현대", name: "쏘나타", displayName: "쏘나타 뉴 라이즈", generation: "LF 부분변경", segment: "중형 세단", bodyType: "SEDAN", yearFrom: 2017, yearTo: 2019,
    aliases: ["sonata", "뉴라이즈", "쏘나타뉴라이즈"], powertrains: [gasoline("2.0", "6단 자동"), gasoline("1.6 터보", "7단 DCT", "DCT"), lpg("2.0", "6단 자동")] },
  { maker: "현대", name: "쏘나타", displayName: "쏘나타 8세대", generation: "DN8", segment: "중형 세단", bodyType: "SEDAN", yearFrom: 2019, yearTo: 2023,
    aliases: ["sonata", "dn8", "쏘나타dn8"], powertrains: [gasoline("2.0", "6단 자동"), gasoline("1.6 터보", "8단 자동"), hybrid("2.0", "6단 자동"), lpg("2.0", "6단 자동")] },
  { maker: "현대", name: "쏘나타", displayName: "쏘나타 디 엣지", generation: "DN8 부분변경", segment: "중형 세단", bodyType: "SEDAN", yearFrom: 2023, yearTo: null,
    aliases: ["sonata", "디엣지", "쏘나타디엣지"], powertrains: [gasoline("2.0", "6단 자동"), gasoline("1.6 터보", "8단 자동"), hybrid("2.0", "6단 자동"), lpg("2.0", "6단 자동")] },

  // 그랜저 (HG는 seed.ts에 있음)
  { maker: "현대", name: "그랜저", displayName: "그랜저 IG", generation: "IG", segment: "준대형 세단", bodyType: "SEDAN", yearFrom: 2016, yearTo: 2019,
    aliases: ["grandeur", "그랜저ig"], powertrains: [gasoline("2.4", "6단 자동"), gasoline("3.0", "8단 자동"), diesel("2.2", "8단 자동"), hybrid("2.4", "6단 자동"), lpg("3.0", "6단 자동")] },
  { maker: "현대", name: "그랜저", displayName: "더 뉴 그랜저", generation: "IG 부분변경", segment: "준대형 세단", bodyType: "SEDAN", yearFrom: 2019, yearTo: 2022,
    aliases: ["grandeur", "더뉴그랜저"], powertrains: [gasoline("2.5", "8단 자동"), gasoline("3.3", "8단 자동"), hybrid("2.4", "6단 자동"), lpg("3.0", "6단 자동")],
    issues: [{
      engine: "2.5 가솔린",
      part: "엔진",
      title: "스마트스트림 2.5 엔진오일 감소",
      description: "엔진오일이 교환 주기 전에 눈에 띄게 줄어드는 사례가 많이 보고된 엔진입니다. 2020년 오일 게이지(딥스틱) 측정 범위를 늘리는 리콜이 있었고, 오일 소모가 심한 차는 개선형 쇼트엔진(피스톤·실린더 블록 등)으로 무상 교환해 주는 조치가 있었으며, 2021년에는 국토부 결함 조사도 진행됐습니다. 설계에서 비롯된 문제라는 지적이 있어 구매는 신중히 검토하고, 그대로 탄다면 오일량을 자주 확인하며 보충해야 합니다. 개선형 부품이 나온 뒤 2022년식 무렵 후기 생산분은 나아졌다는 이야기가 있지만, 생산 적용 시점은 공식 자료로 확인되지 않았습니다.",
      checkHow: "① 딥스틱으로 오일량 확인 (MIN 근처면 주의) ② 정비 이력에서 오일 보충, 오일 게이지 교체, 쇼트엔진 교환 기록 확인 (교환했다면 개선품이 들어간 차) ③ 차대번호로 리콜·무상수리 대상과 조치 완료 여부 조회 ④ 시동 직후나 가속할 때 배기구에서 푸른 연기가 나는지 확인",
      severity: "HIGH",
      note: "출처 메모: 교통뉴스 2020.9.17 딥스틱 리콜 http://www.cartvnews.com/news/articleView.html?idxno=608054 · 뉴스투데이 2021.10.14 국토부 결함 조사·쇼트엔진 무상교환 https://www.news2day.co.kr/article/20211013500071 — 2022년식 개선 적용 시점은 미확인, 공식 리콜 공지로 검증 필요",
    }] },
  { maker: "현대", name: "그랜저", displayName: "디 올 뉴 그랜저", generation: "GN7", segment: "준대형 세단", bodyType: "SEDAN", yearFrom: 2022, yearTo: null,
    aliases: ["grandeur", "gn7", "디올뉴그랜저"], powertrains: [gasoline("2.5", "8단 자동"), gasoline("3.5", "8단 자동"), hybrid("1.6 터보", "6단 자동"), lpg("3.5", "8단 자동")] },

  // 투싼 (LM·TL은 seed.ts에 있음)
  { maker: "현대", name: "투싼", displayName: "더 뉴 투싼", generation: "TL 부분변경", segment: "준중형 SUV", bodyType: "SUV", yearFrom: 2018, yearTo: 2020,
    aliases: ["tucson", "더뉴투싼"], powertrains: [diesel("1.6", "7단 DCT", "DCT"), diesel("2.0", "8단 자동"), gasoline("2.0", "6단 자동")] },
  { maker: "현대", name: "투싼", displayName: "디 올 뉴 투싼", generation: "NX4", segment: "준중형 SUV", bodyType: "SUV", yearFrom: 2020, yearTo: 2023,
    aliases: ["tucson", "nx4", "디올뉴투싼"], powertrains: [gasoline("1.6 터보", "7단 DCT", "DCT"), diesel("2.0", "8단 자동"), hybrid("1.6 터보", "6단 자동")] },
  { maker: "현대", name: "투싼", displayName: "더 뉴 투싼", generation: "NX4 부분변경", segment: "준중형 SUV", bodyType: "SUV", yearFrom: 2023, yearTo: null,
    aliases: ["tucson", "더뉴투싼"], powertrains: [gasoline("1.6 터보", "8단 자동"), diesel("2.0", "8단 자동"), hybrid("1.6 터보", "6단 자동")] },

  // 스타렉스·스타리아 (승합)
  { maker: "현대", name: "스타렉스", displayName: "그랜드 스타렉스", generation: "TQ", segment: "승합", bodyType: "VAN", yearFrom: 2007, yearTo: 2021,
    aliases: ["starex", "그랜드스타렉스", "스타렉스"], powertrains: [diesel("2.5", "5단 자동"), lpg("2.4", "자동")] },
  { maker: "현대", name: "스타리아", displayName: "스타리아", generation: "US4", segment: "승합", bodyType: "VAN", yearFrom: 2021, yearTo: null,
    aliases: ["staria"], powertrains: [diesel("2.2", "8단 자동"), lpg("3.5", "8단 자동")] },

  // ── 전기차 ──
  { maker: "현대", name: "아이오닉 일렉트릭", displayName: "아이오닉 일렉트릭", generation: "AE EV", segment: "준중형 해치백", bodyType: "SEDAN", yearFrom: 2016, yearTo: 2021,
    aliases: ["ioniq", "아이오닉", "아이오닉ev", "아이오닉일렉트릭"], powertrains: [ev("28kWh"), ev("38.3kWh")] },

  { maker: "현대", name: "코나 일렉트릭", displayName: "코나 일렉트릭 1세대", generation: "OS EV", segment: "소형 SUV", bodyType: "SUV", yearFrom: 2018, yearTo: 2023,
    aliases: ["kona", "코나ev", "코나일렉트릭", "konaelectric"], powertrains: [ev("39.2kWh"), ev("64kWh")],
    issues: [batteryFireRecall("2018~2020년 생산분 일부에서 충전 중 화재가 잇따라, 배터리 관리 프로그램 업데이트에 이어 구동 배터리 전체를 교체하는 리콜이 있었던 것으로 알려져 있습니다.")] },
  { maker: "현대", name: "코나 일렉트릭", displayName: "디 올 뉴 코나 일렉트릭", generation: "SX2 EV", segment: "소형 SUV", bodyType: "SUV", yearFrom: 2023, yearTo: null,
    aliases: ["kona", "코나ev", "코나일렉트릭", "디올뉴코나일렉트릭"], powertrains: [ev("48.6kWh"), ev("64.8kWh")] },

  { maker: "현대", name: "아이오닉 5", displayName: "아이오닉 5", generation: "NE", segment: "준중형 SUV", bodyType: "SUV", yearFrom: 2021, yearTo: 2024,
    aliases: ["ioniq5", "아이오닉5", "아5"], powertrains: [ev("스탠다드 58kWh", "2WD"), ev("롱레인지 72.6~77.4kWh", "2WD"), ev("롱레인지 72.6~77.4kWh", "AWD")],
    issues: [iccu] },
  { maker: "현대", name: "아이오닉 5", displayName: "더 뉴 아이오닉 5", generation: "NE 부분변경", segment: "준중형 SUV", bodyType: "SUV", yearFrom: 2024, yearTo: null,
    aliases: ["ioniq5", "아이오닉5", "더뉴아이오닉5"], powertrains: [ev("스탠다드 63kWh", "2WD"), ev("롱레인지 84kWh", "2WD"), ev("롱레인지 84kWh", "AWD")],
    issues: [iccu] },

  { maker: "현대", name: "아이오닉 6", displayName: "아이오닉 6", generation: "CE", segment: "중형 세단", bodyType: "SEDAN", yearFrom: 2022, yearTo: 2025,
    aliases: ["ioniq6", "아이오닉6", "아6"], powertrains: [ev("스탠다드 53kWh", "2WD"), ev("롱레인지 77.4kWh", "2WD"), ev("롱레인지 77.4kWh", "AWD")],
    issues: [iccu] },
  { maker: "현대", name: "아이오닉 6", displayName: "더 뉴 아이오닉 6", generation: "CE 부분변경", segment: "중형 세단", bodyType: "SEDAN", yearFrom: 2025, yearTo: null,
    aliases: ["ioniq6", "아이오닉6", "더뉴아이오닉6"], powertrains: [ev("스탠다드 63kWh", "2WD"), ev("롱레인지 84kWh", "2WD"), ev("롱레인지 84kWh", "AWD")] },

  { maker: "현대", name: "아이오닉 9", displayName: "아이오닉 9", generation: "ME", segment: "대형 SUV", bodyType: "SUV", yearFrom: 2025, yearTo: null,
    aliases: ["ioniq9", "아이오닉9"], powertrains: [ev("110.3kWh", "2WD"), ev("110.3kWh", "AWD")] },

  // 캐스퍼 일렉트릭은 차체가 늘어나 경차가 아니라 소형 SUV
  { maker: "현대", name: "캐스퍼 일렉트릭", displayName: "캐스퍼 일렉트릭", generation: "AX1 EV", segment: "소형 SUV", bodyType: "SUV", yearFrom: 2024, yearTo: null,
    aliases: ["casper", "캐스퍼ev", "캐스퍼일렉트릭"], powertrains: [ev("42kWh"), ev("49kWh")] },
];
