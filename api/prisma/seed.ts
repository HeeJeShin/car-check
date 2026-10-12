// ─────────────────────────────────────────────────────────────
// 샘플 데이터. `pnpm db:seed`로 넣습니다. (기존 데이터는 지우고 다시 넣음)
//
// ⚠️ 아래 고질병은 전부 Claude가 작성한 "초안(DRAFT)"입니다. 사실과 다를 수 있습니다.
//    직접 출처를 찾아 확인한 뒤 관리 화면에서 "검증됨"으로 바꾸고 sourceUrl을 채워주세요.
// ─────────────────────────────────────────────────────────────
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const DRAFT_NOTE = "Claude 초안 — 출처 확인 필요";

// 세타2 GDi 엔진은 여러 차종이 같이 써서, 같은 내용을 차종마다 붙입니다.
const theta2 = {
  engine: "세타2 GDi (2.0/2.4)",
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
  description:
    "디젤차를 짧은 거리 위주로 타면 매연 필터(DPF)가 막히거나 EGR에 카본이 쌓이기 쉽습니다. 수리비가 큰 편입니다.",
  checkHow:
    "계기판에 DPF 경고등이 뜬 적이 있는지, 가속할 때 힘이 빠지거나 검은 매연이 나오는지 확인하세요. 전 차주의 운행 패턴(출퇴근 단거리 vs 장거리)을 물어보면 좋습니다.",
  severity: "MEDIUM" as const,
  note: DRAFT_NOTE,
};

async function main() {
  await prisma.carIssue.deleteMany();
  await prisma.carModel.deleteMany();

  await prisma.carModel.create({
    data: {
      maker: "현대", name: "투싼", generation: "LM (투싼ix)", yearFrom: 2009, yearTo: 2015,
      aliases: ["투싼ix", "ix35", "tucson"],
      issues: { create: [dieselDpf] },
    },
  });
  await prisma.carModel.create({
    data: {
      maker: "현대", name: "투싼", generation: "TL (올뉴투싼)", yearFrom: 2015, yearTo: 2020,
      aliases: ["올뉴투싼", "tucson"],
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
      maker: "현대", name: "쏘나타", generation: "YF", yearFrom: 2009, yearTo: 2014,
      aliases: ["yf쏘나타", "sonata"],
      issues: { create: [theta2] },
    },
  });
  await prisma.carModel.create({
    data: {
      maker: "기아", name: "K5", generation: "TF (1세대)", yearFrom: 2010, yearTo: 2015,
      aliases: ["k5"],
      issues: { create: [theta2] },
    },
  });
  await prisma.carModel.create({
    data: {
      maker: "현대", name: "그랜저", generation: "HG", yearFrom: 2011, yearTo: 2016,
      aliases: ["그랜저hg", "grandeur"],
      issues: { create: [{ ...theta2, engine: "세타2 GDi 2.4" }] },
    },
  });
  await prisma.carModel.create({
    data: {
      maker: "BMW", name: "5시리즈", generation: "F10", yearFrom: 2010, yearTo: 2016,
      aliases: ["520d", "bmw5", "5series"],
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
        ],
      },
    },
  });

  console.log(`차종 ${await prisma.carModel.count()}개, 고질병 ${await prisma.carIssue.count()}건(전부 초안)을 넣었습니다.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
