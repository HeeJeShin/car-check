import path from "node:path";
import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

// 저장소 맨 위(pnpm 워크스페이스)를 프로젝트 루트로 알려줍니다. 잠금 파일이 두 군데라 Next.js가 헷갈려 하는 경고를 없앱니다.
const root = path.join(__dirname, "..");

const nextConfig: NextConfig = {
  // E2E 테스트는 다른 API 주소로 따로 빌드하므로, 개발용 빌드(.next)를 덮어쓰지 않게 폴더를 나눕니다.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  outputFileTracingRoot: root,
  turbopack: { root },
};

// Sentry: 배포 빌드 때 소스맵을 올려 에러 위치를 원래 코드 줄로 보여줍니다.
// SENTRY_AUTH_TOKEN이 없으면(로컬·CI) 올리지 않고 빌드만 합니다.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  silent: !process.env.SENTRY_AUTH_TOKEN,
  telemetry: false,
});
