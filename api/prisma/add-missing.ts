// ─────────────────────────────────────────────────────────────
// `pnpm db:add-missing`: prisma/seed-data의 차종 중 DB에 없는 것만 추가합니다.
// seed와 달리 기존 데이터를 지우지 않으므로, 직접 넣은 고질병·검증 기록이 그대로 남습니다.
// "같은 차종"의 기준: 제조사 + 차종 이름 + 세대 코드
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

async function main() {
  let added = 0;
  for (const { powertrains, issues, ...model } of [...HYUNDAI_MODELS, ...KIA_MODELS, ...GENESIS_MODELS, ...IMPORT_MODELS]) {
    const exists = await prisma.carModel.findFirst({
      where: { maker: model.maker, name: model.name, generation: model.generation },
    });
    if (exists) continue;
    await prisma.carModel.create({
      data: { ...model, powertrains: { create: [...powertrains] }, ...(issues && { issues: { create: issues } }) },
    });
    added += 1;
  }
  console.log(`새 차종(세대) ${added}개를 추가했습니다. 이미 있던 것은 건너뜀.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
