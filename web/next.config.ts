import path from "node:path";
import type { NextConfig } from "next";

// 저장소 맨 위(pnpm 워크스페이스)를 프로젝트 루트로 알려줍니다. 잠금 파일이 두 군데라 Next.js가 헷갈려 하는 경고를 없앱니다.
const root = path.join(__dirname, "..");

const nextConfig: NextConfig = {
  // E2E 테스트는 다른 API 주소로 따로 빌드하므로, 개발용 빌드(.next)를 덮어쓰지 않게 폴더를 나눕니다.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  outputFileTracingRoot: root,
  turbopack: { root },
};

export default nextConfig;
