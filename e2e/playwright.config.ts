// ─────────────────────────────────────────────────────────────
// E2E 테스트 설정. 테스트 전용으로 DB·API·화면을 띄운 뒤 브라우저(크롬)로 실제로 눌러봅니다.
//   DB  : car_check_e2e (개발용 car_check와 별개. 매번 샘플 데이터로 다시 채움)
//   API : http://localhost:3290  (개발 서버 3200과 안 겹치게)
//   화면: http://localhost:3291  (운영 빌드로 띄워 ISR까지 실제처럼)
// 로그인은 개발용 이메일 로그인(AUTH_DEV_LOGIN)을 씁니다. 구글 계정 없이 ADMIN·EDITOR를 오갈 수 있어요.
// ─────────────────────────────────────────────────────────────
import { defineConfig, devices } from "@playwright/test";

const DATABASE_URL = process.env.E2E_DATABASE_URL ?? "postgresql://car:car@localhost:5434/car_check_e2e?schema=public";
export const API_URL = "http://localhost:3290";
export const WEB_URL = "http://localhost:3291";
export const ADMIN = "admin@e2e.test";
export const EDITOR = "editor@e2e.test";

export default defineConfig({
  testDir: "./tests",
  // 테스트끼리 같은 DB를 쓰므로 한 번에 하나씩
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: WEB_URL,
    locale: "ko-KR",
    trace: "retain-on-failure", // 실패한 테스트는 화면·네트워크 기록을 남김 → `pnpm report`로 확인
    ...devices["Pixel 7"], // 매장에서 폰으로 보는 서비스라 모바일 화면으로
  },
  projects: [{ name: "mobile-chrome" }],
  // 아래 순서대로 띄우고, 각 url이 응답할 때까지 기다린 뒤 다음으로 넘어갑니다.
  webServer: [
    {
      name: "api",
      // 마이그레이션 → 샘플 데이터(기존 E2E 데이터는 지워짐) → 빌드 → 실행
      command: "pnpm --dir ../api exec prisma migrate deploy && pnpm --dir ../api db:seed && pnpm --dir ../api build && node ../api/dist/main.js",
      url: `${API_URL}/cars/models`,
      env: {
        DATABASE_URL,
        PORT: "3290",
        WEB_ORIGIN: WEB_URL,
        USE_MOCK_AI: "true",
        AUTH_DEV_LOGIN: "true",
        AUTH_JWT_SECRET: "e2e-secret",
        ADMIN_EMAILS: ADMIN,
        EDITOR_EMAILS: EDITOR,
        GOOGLE_CLIENT_ID: "",
      },
      timeout: 120_000,
      reuseExistingServer: false, // 항상 새 데이터로
      stdout: "ignore",
    },
    {
      name: "web",
      // 빌드할 때 /cars를 미리 만들므로 API가 먼저 떠 있어야 합니다(위에서 기다림).
      // 이전 실행의 저장본(데이터 캐시는 다시 빌드해도 남음)을 지우고 시작: DB를 새로 채워 차종 id가 바뀌기 때문
      command: "node -e \"require('fs').rmSync('../web/.next-e2e',{recursive:true,force:true})\" && pnpm --dir ../web exec next build && pnpm --dir ../web exec next start -p 3291",
      url: WEB_URL,
      env: { NEXT_PUBLIC_API_URL: API_URL, NEXT_DIST_DIR: ".next-e2e" },
      timeout: 240_000,
      reuseExistingServer: false,
      stdout: "ignore",
    },
  ],
});
