// 사용자 제보 흐름: 리포트에서 "틀린 내용 있어요" → 관리자가 제보함에서 답변 → 사용자 리포트에 답변이 바로 보임(ISR 갱신)
// + 검색엔진용 robots.txt · sitemap.xml
import { type Page, expect, test } from "@playwright/test";
import { ADMIN } from "../playwright.config";

const COMMENT = `[E2E] 리콜 조치가 끝난 차는 해당 없어요 ${Date.now()}`;
const ANSWER = `[E2E] 확인했어요. 조치 완료 여부를 확인하라는 문구로 고쳤습니다 ${Date.now()}`;

async function login(page: Page, email: string) {
  await page.goto("/admin");
  await page.getByPlaceholder(/ADMIN_EMAILS/).fill(email);
  await page.getByRole("button", { name: "이메일로 로그인" }).click();
  await expect(page.getByText(email)).toBeVisible();
}

async function openIoniq5Report(page: Page) {
  await page.goto("/cars");
  await page.getByPlaceholder("예: 투싼, K5, 520d").fill("아이오닉5");
  await page.getByRole("link", { name: /^아이오닉 5/ }).click();
  await page.getByRole("link", { name: /아이오닉 5 \(2021~2024\)/ }).click();
  await expect(page.getByRole("heading", { name: "아이오닉 5 (2021~2024)", level: 1 })).toBeVisible();
}

const iccuCard = (page: Page) => page.locator("article", { hasText: "ICCU" }).first();

test("틀린 내용 제보 → 관리자 답변 → 사용자 리포트에 답변 공개", async ({ page }) => {
  // 1. 사용자: 체크박스로 무엇이 틀렸는지 고르고 보냄 (로그인 없이)
  await openIoniq5Report(page);
  const reportUrl = page.url();
  const card = iccuCard(page);
  await card.getByRole("button", { name: "틀린 내용 있어요" }).click();
  const send = card.getByRole("button", { name: "제보 보내기" });
  await expect(send).toBeDisabled(); // 아무것도 안 고르면 못 보냄
  await card.getByLabel("이미 해결됐어요 (리콜·개선품)").check();
  await card.getByPlaceholder(/자세한 내용/).fill(COMMENT);
  await send.click();
  await expect(card.getByText(/고마워요!/)).toBeVisible();

  // 2. 관리자: 제보함에서 그 제보를 찾아 답변
  await login(page, ADMIN);
  const inbox = page.locator("section", { has: page.getByRole("heading", { name: /제보함/ }) });
  const reportCard = inbox.locator("div.rounded-\\[14px\\]", { hasText: COMMENT });
  await expect(reportCard.getByText("이미 해결됐어요 (리콜·개선품)")).toBeVisible();
  await reportCard.getByPlaceholder(/제보에 대한 답변/).fill(ANSWER);
  await reportCard.getByRole("button", { name: "답변 등록" }).click();
  await expect(reportCard.getByRole("button", { name: "답변 고치기" })).toBeVisible();

  // 3. 사용자 리포트: 저장해 둔 화면(ISR)이 바로 갱신되어 제보와 답변이 보임
  await page.goto(reportUrl);
  const published = iccuCard(page);
  await expect(published.getByText(COMMENT)).toBeVisible();
  await expect(published.getByText(ANSWER)).toBeVisible();
  await expect(published.getByText("운영자 답변")).toBeVisible();
});

test("검색엔진용 robots.txt는 관리 화면만 막고, sitemap.xml에 리포트 주소가 있다", async ({ request }) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /admin");
  expect(robots).toMatch(/Sitemap: .*\/sitemap\.xml/);

  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toMatch(/\/cars\/\d+<\/loc>/);
  expect(sitemap).toMatch(/\/cars\/\d+\/inspect<\/loc>/);
  expect(sitemap).toContain("/generations/");
});
