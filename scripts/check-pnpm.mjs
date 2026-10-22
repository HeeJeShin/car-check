// npm·yarn으로 설치하려고 하면 막고 pnpm 쓰는 법을 알려줍니다. (package.json의 preinstall)
const agent = process.env.npm_config_user_agent ?? "";
if (!agent.startsWith("pnpm/")) {
  console.error(`
  ✋ 이 프로젝트는 pnpm으로 설치합니다. (npm·yarn은 잠금 파일이 달라 버전이 어긋나요)

     corepack enable     # Node에 들어 있는 pnpm 자동 설치 도구 켜기 (한 번만)
     pnpm install        # 저장소 맨 위 폴더에서. api·web이 한 번에 설치됩니다.

  IntelliJ: Settings → Languages & Frameworks → Node.js → Package manager를 pnpm으로.
`);
  process.exit(1);
}
