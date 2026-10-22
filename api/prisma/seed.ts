// ─────────────────────────────────────────────────────────────
// 샘플 데이터. `pnpm db:seed`로 넣습니다. (기존 데이터는 지우고 다시 넣음)
//
// ⚠️ 아래 고질병·세대 이름·엔진/미션 정보는 전부 Claude가 작성한 "초안"입니다. 사실과 다를 수 있습니다.
//    직접 출처를 찾아 확인한 뒤 관리 화면에서 "검증됨"으로 바꾸고 sourceUrl을 채워주세요.
// ─────────────────────────────────────────────────────────────
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { HYUNDAI_MODELS } from "./seed-data/hyundai";
import { GENESIS_MODELS } from "./seed-data/genesis";
import { IMPORT_MODELS } from "./seed-data/imports";
import { KIA_MODELS } from "./seed-data/kia";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const DRAFT_NOTE = "Claude 초안 — 출처 확인 필요";

// 본넷 그림의 모든 차 공통 포인트. x, y는 그림 크기에 대한 퍼센트.
const COMMON_POINTS = [
  { order: 1, x: 25.5, y: 33.8, title: "엔진오일", iceOnly: true, look: "딥스틱을 뽑아 닦고 다시 꽂아 양을 보고, 오일 주입구 캡 안쪽도 봐요.", bad: "양이 너무 적거나, 캡 안쪽에 우유처럼 뿌연 게 묻어 있어요." },
  { order: 2, x: 52.5, y: 68.8, title: "엔진 누유", iceOnly: true, look: "엔진 옆면과 아래쪽에 기름이 번진 자국이 있는지 봐요.", bad: "먼지가 기름에 엉겨 붙어 시커멓게 굳어 있어요." },
  { order: 3, x: 6.3, y: 43.8, title: "냉각수", look: "반투명 통의 MIN~MAX 눈금 사이에 있는지, 색이 맑은지 봐요.", bad: "양이 많이 줄었거나 기름이 떠 있어요." },
  { order: 4, x: 76.5, y: 41.7, title: "배터리", look: "단자 주변과 배터리에 적힌 제조 날짜를 봐요.", bad: "단자에 하얀 가루(부식)가 잔뜩 끼어 있어요." },
  { order: 5, x: 15.5, y: 53.3, title: "벨트", iceOnly: true, look: "엔진 옆 고무 벨트 표면을 봐요.", bad: "갈라짐이 보이거나 시동 걸 때 끼익 소리가 나요." },
  { order: 6, x: 64.8, y: 27.9, title: "브레이크액", look: "작은 통의 양과 색을 봐요.", bad: "진한 갈색이에요. 교체 시기가 지났을 수 있어요." },
  { order: 7, x: 95.5, y: 30, title: "휀더·본넷 볼트", look: "양옆 볼트 머리의 페인트가 깨졌는지 봐요.", bad: "공구 자국이 있어요. 부품을 떼어낸 흔적이니 사고 이력을 확인하세요." },
];

// 세타2 GDi 엔진은 여러 차종이 같이 써서, 같은 내용을 차종마다 붙입니다.
const theta2 = {
  engine: "세타2 GDi",
  part: "엔진",
  title: "세타2 GDi 엔진 결함 리콜·보증 연장",
  description:
    "세타2 GDi 엔진은 커넥팅로드 베어링 손상(소착) 문제로 리콜과 엔진 보증 연장이 시행된 것으로 알려져 있습니다. 조치 여부에 따라 위험도가 크게 달라집니다.",
  checkHow:
    "자동차리콜센터(car.go.kr)에서 차대번호로 리콜 조치 완료 여부를 조회하세요. 시운전 때 엔진 소음(노킹)·떨림을 확인하고, 엔진오일이 빨리 줄어든다는 정비 기록이 있는지 보세요.",
  severity: "HIGH" as const,
  note: DRAFT_NOTE,
};

const dieselDpf = {
  engine: "디젤",
  part: "엔진",
  title: "단거리 위주 디젤의 DPF·EGR 문제",
  description: "디젤차를 짧은 거리 위주로 타면 매연 필터(DPF)가 막히거나 EGR에 카본이 쌓이기 쉽습니다. 수리비가 큰 편입니다.",
  checkHow: "계기판에 DPF 경고등이 뜬 적이 있는지, 가속할 때 힘이 빠지거나 검은 매연이 나오는지 확인하세요. 전 차주의 운행 패턴(출퇴근 단거리 vs 장거리)을 물어보세요.",
  severity: "MEDIUM" as const,
  note: DRAFT_NOTE,
};

async function main() {
  await prisma.inspectionPoint.deleteMany();
  await prisma.carIssue.deleteMany();
  await prisma.powertrain.deleteMany();
  await prisma.carModel.deleteMany();

  await prisma.inspectionPoint.createMany({ data: COMMON_POINTS });

  await prisma.carModel.create({
    data: {
      maker: "현대", name: "투싼", displayName: "투싼ix", generation: "LM", segment: "준중형 SUV", bodyType: "SUV",
      yearFrom: 2009, yearTo: 2015, aliases: ["투싼ix", "ix35", "tucson"],
      powertrains: { create: [{ engine: "2.0 디젤", fuel: "DIESEL", transmission: "AT", gearbox: "자동" }] },
      issues: { create: [dieselDpf] },
    },
  });
  await prisma.carModel.create({
    data: {
      maker: "현대", name: "투싼", displayName: "올 뉴 투싼", generation: "TL", segment: "준중형 SUV", bodyType: "SUV",
      yearFrom: 2015, yearTo: 2018, aliases: ["올뉴투싼", "tucson"],
      powertrains: {
        create: [
          { engine: "1.7 디젤", fuel: "DIESEL", transmission: "DCT", gearbox: "7단 DCT" },
          { engine: "2.0 디젤", fuel: "DIESEL", transmission: "AT", gearbox: "6단 자동" },
        ],
      },
      issues: {
        create: [
          {
            engine: "1.7 디젤",
            part: "변속기",
            title: "7단 DCT 저속 변속 충격",
            description: "1.7 디젤에 들어간 7단 DCT(듀얼 클러치)는 정체 구간 저속에서 울컥거림·변속 충격이 자주 언급됩니다.",
            checkHow: "시운전 때 막히는 길처럼 저속에서 가다 서다를 반복해 보세요. 정비 기록에 클러치·DCT 관련 수리가 있는지 확인하세요.",
            severity: "MEDIUM",
            note: DRAFT_NOTE,
          },
          dieselDpf,
        ],
      },
    },
  });
  await prisma.carModel.create({
    data: {
      maker: "현대", name: "쏘나타", displayName: "YF 쏘나타", generation: "YF", segment: "중형 세단", bodyType: "SEDAN",
      yearFrom: 2009, yearTo: 2014, aliases: ["yf쏘나타", "sonata"],
      powertrains: {
        create: [
          { engine: "2.0 가솔린", fuel: "GASOLINE", transmission: "AT", gearbox: "자동" },
          { engine: "2.4 GDi", fuel: "GASOLINE", transmission: "AT", gearbox: "자동" },
        ],
      },
      issues: { create: [theta2] },
    },
  });
  await prisma.carModel.create({
    data: {
      maker: "기아", name: "K5", displayName: "K5 1세대", generation: "TF", segment: "중형 세단", bodyType: "SEDAN",
      yearFrom: 2010, yearTo: 2015, aliases: ["k5"],
      powertrains: {
        create: [
          { engine: "2.0 가솔린", fuel: "GASOLINE", transmission: "AT", gearbox: "자동" },
          { engine: "2.4 GDi", fuel: "GASOLINE", transmission: "AT", gearbox: "자동" },
        ],
      },
      issues: { create: [theta2] },
    },
  });
  await prisma.carModel.create({
    data: {
      maker: "현대", name: "그랜저", displayName: "그랜저 HG", generation: "HG", segment: "준대형 세단", bodyType: "SEDAN",
      yearFrom: 2011, yearTo: 2016, aliases: ["그랜저hg", "grandeur"],
      powertrains: {
        create: [
          { engine: "2.4 GDi", fuel: "GASOLINE", transmission: "AT", gearbox: "자동" },
          { engine: "3.0 GDi", fuel: "GASOLINE", transmission: "AT", gearbox: "자동" },
        ],
      },
      issues: { create: [{ ...theta2, engine: "세타2 GDi 2.4" }] },
    },
  });
  await prisma.carModel.create({
    data: {
      maker: "BMW", name: "5시리즈", displayName: "5시리즈 F10", generation: "F10", segment: "중형 세단", bodyType: "SEDAN",
      yearFrom: 2010, yearTo: 2016, aliases: ["520d", "bmw5", "5series"],
      powertrains: { create: [{ engine: "520d 2.0 디젤", fuel: "DIESEL", transmission: "AT", gearbox: "8단 자동" }] },
      issues: {
        create: [
          {
            engine: "2.0 디젤 (520d 등)",
            part: "엔진",
            title: "EGR 쿨러 결함 화재 리콜",
            description: "2018년 BMW 디젤 차량 주행 중 화재가 잇따르면서 EGR 쿨러 관련 대규모 리콜이 있었던 것으로 알려져 있습니다.",
            checkHow: "자동차리콜센터(car.go.kr) 또는 BMW 서비스센터에서 리콜 조치 완료 여부를 꼭 확인하세요. 조치 기록이 없으면 구매 전 조치를 조건으로 거세요.",
            severity: "HIGH",
            note: DRAFT_NOTE,
          },
          dieselDpf,
        ],
      },
    },
  });

  // 나머지 차종(세대) + 엔진·미션 (+ 있으면 고질병 초안)
  for (const { powertrains, issues, ...model } of [...HYUNDAI_MODELS, ...KIA_MODELS, ...GENESIS_MODELS, ...IMPORT_MODELS]) {
    await prisma.carModel.create({
      data: { ...model, powertrains: { create: [...powertrains] }, ...(issues && { issues: { create: issues } }) },
    });
  }

  console.log(
    `차종 ${await prisma.carModel.count()}개, 고질병 ${await prisma.carIssue.count()}건, 본넷 공통 포인트 ${await prisma.inspectionPoint.count()}개를 넣었습니다(전부 초안).`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
