// E2E용 구글 로그인 대역. 실제 구글 창을 열 수 없어서 버튼 스크립트와 /auth/google 응답만 바꾸고, 그 뒤 화면 흐름은 실제 코드 그대로 확인합니다.
// 로그인 토큰은 테스트 전용 POST /auth/dev(AUTH_DEV_LOGIN=true, 운영에서는 항상 404)로 받습니다.
import { type Page, expect } from "@playwright/test";
import { API_URL, WEB_URL } from "../playwright.config";

type GoogleCallback = (r: { credential: string }) => void;
type FakeWindow = Window & { google?: unknown; __googleLogin?: GoogleCallback };
const CORS = { "access-control-allow-origin": WEB_URL };

/** 화면을 열기 전에 호출합니다. */
export async function stubGoogle(page: Page) {
  await page.addInitScript(() => {
    (window as FakeWindow).google = {
      accounts: {
        id: {
          initialize: (o: { callback: GoogleCallback }) => {
            (window as FakeWindow).__googleLogin = o.callback;
          },
          renderButton: () => {},
        },
      },
    };
  });
  await page.route(`${API_URL}/auth/config`, (route) => route.fulfill({ json: { googleClientId: "e2e" }, headers: CORS }));
}

/** 구글 버튼을 눌러 이 이메일로 로그인한 것처럼 처리합니다. */
export async function signInAs(page: Page, email: string, { unregistered = false } = {}) {
  await page.unroute(`${API_URL}/auth/google{,/signup}`);
  await page.route(`${API_URL}/auth/google{,/signup}`, async (route) => {
    if (unregistered) return route.fulfill({ status: 404, json: { message: "가입된 계정이 없어요." }, headers: CORS });
    const response = await page.request.post(`${API_URL}/auth/dev`, { data: { email } });
    await route.fulfill({ response, headers: { ...response.headers(), ...CORS } });
  });
  await page.waitForFunction(() => Boolean((window as FakeWindow).__googleLogin));
  await page.evaluate(() => (window as FakeWindow).__googleLogin?.({ credential: "e2e" }));
}

/** 관리 화면에 로그인합니다. */
export async function loginToAdmin(page: Page, email: string) {
  await stubGoogle(page);
  await page.goto("/admin");
  await signInAs(page, email);
  await expect(page.getByText(email)).toBeVisible();
}
