// 구글 로그인 버튼에 쓸 Client ID를 화면을 만들 때 미리 받아 둡니다(REVALIDATE초마다 갱신).
// 무료 API 서버가 잠들어 있으면 브라우저에서 /auth/config를 받는 데 30초 넘게 걸려 버튼이 늦게 뜨기 때문입니다.
import "server-only";
import { type AuthConfig, api } from "./api";
import { REVALIDATE } from "./cached";

/** 받지 못하면 undefined: 그때는 브라우저가 직접 받습니다(components/auth-panel.tsx). */
export async function googleClientId(): Promise<string | null | undefined> {
  try {
    return (await api<AuthConfig>("/auth/config", { next: { revalidate: REVALIDATE } })).googleClientId;
  } catch {
    return undefined;
  }
}
