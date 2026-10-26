// Prisma 7부터는 DB 접속 정보를 schema.prisma가 아니라 이 설정 파일에 둡니다.
// 그리고 .env를 자동으로 읽어주지 않으므로 dotenv를 직접 불러옵니다.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "ts-node prisma/seed.ts",
  },
  // 마이그레이션(prisma CLI)용 주소. Neon처럼 연결 풀(pooler) 주소와 직접 주소가 따로 있으면
  // DIRECT_URL에 직접 주소를 넣습니다(풀을 거치면 마이그레이션이 실패할 수 있음). 없으면 DATABASE_URL.
  // 앱(PrismaService)은 항상 DATABASE_URL을 씁니다.
  datasource: {
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"],
  },
});
