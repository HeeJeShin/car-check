// 방문 통계: 사용자가 차종 리포트를 보면 기록되고, 관리 화면 "방문 통계"의 차트·TOP 10에 나온다
import { type Page, expect, test } from "@playwright/test";
import { ADMIN } from "../playwright.config";

async function login(page: Page, email: string) {
  await page.goto("/admin");
  await page.getByPlaceholder(/ADMIN_EMAILS/).fill(email);
  await page.getByRole("button", { name: "이메일로 로그인" }).click();
  await expect(page.getByText(email)).toBeVisible();
}

test("차종 리포트를 보면 관리 화면 방문 통계 TOP 10에 나온다", async ({ page }) => {
  // 사용자: 아이오닉 5 리포트 보기 (화면이 뜨면 브라우저가 기록을 보냄)
  await page.goto("/cars");
  await page.getByPlaceholder("예: 투싼, K5, 520d").fill("아이오닉5");
  await page.getByRole("link", { name: /^아이오닉 5/ }).click();
  const viewed = page.waitForResponse((r) => r.url().endsWith("/stats/view") && r.request().method() === "POST");
  await page.getByRole("link", { name: /아이오닉 5 \(2021~2024\)/ }).click();
  expect((await viewed).status()).toBe(204);

  // 관리자: 방문 통계
  await login(page, ADMIN);
  const stats = page.locator("section", { has: page.getByRole("heading", { name: "방문 통계" }) });
  await expect(stats.getByRole("img", { name: /일별 방문자와 페이지뷰/ })).toBeVisible();
  await expect(stats.getByText("아이오닉 5 (2021~2024)")).toBeVisible();

  // 기간 바꾸기
  await stats.getByRole("button", { name: "7일" }).click();
  await expect(stats.getByRole("img", { name: /최근 7일/ })).toBeVisible();
});

test("로그인 없이는 방문 통계를 볼 수 없다", async ({ request }) => {
  expect((await request.get("http://localhost:3290/stats")).status()).toBe(401);
});
