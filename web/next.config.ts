import path from "node:path";
import type { NextConfig } from "next";

// 저장소 맨 위(pnpm 워크스페이스)를 프로젝트 루트로 알려줍니다. 잠금 파일이 두 군데라 Next.js가 헷갈려 하는 경고를 없앱니다.
const root = path.join(__dirname, "..");

const nextConfig: NextConfig = {
  outputFileTracingRoot: root,
  turbopack: { root },
};

export default nextConfig;
