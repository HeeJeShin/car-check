// 설치 직후(postinstall) .env가 없으면 .env.example을 복사해 둡니다. 이미 있으면 건드리지 않아요.
import { copyFileSync, existsSync } from "node:fs";

for (const dir of ["api", "web"]) {
  const env = `${dir}/.env`;
  if (existsSync(env) || !existsSync(`${dir}/.env.example`)) continue;
  copyFileSync(`${dir}/.env.example`, env);
  console.log(`${env}를 만들었습니다 (.env.example 복사).`);
}
