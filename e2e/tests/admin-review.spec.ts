// 관리자 흐름: 에디터가 초안 작성·검토 요청 → 관리자가 승인 → 사용자 리포트에 "검증됨"으로 바로 보임(ISR 갱신)
import { type Page, expect, test } from "@playwright/test";
import { ADMIN, EDITOR } from "../playwright.config";

const TITLE = `[E2E] 충전구 덮개 파손 ${Date.now()}`;

async function login(page: Page, email: string) {
  await page.goto("/admin");
  await page.getByPlaceholder(/ADMIN_EMAILS/).fill(email);
  await page.getByRole("button", { name: "이메일로 로그인" }).click();
  await expect(page.getByText(email)).toBeVisible();
}

// 관리 화면에서 아이오닉 5 (NE) 고르기. 차종 id는 DB마다 다르니 보이는 이름으로 찾음
async function selectIoniq5(page: Page) {
  const option = page.locator("option", { hasText: "· 아이오닉 5 (2021~2024)" });
  await page.locator("select").first().selectOption((await option.getAttribute("value"))!);
}

// 사용자 화면에서 아이오닉 5 (NE) 리포트 열기
async function openIoniq5Report(page: Page) {
  await page.goto("/cars");
  await page.getByPlaceholder("예: 투싼, K5, 520d").fill("아이오닉5");
  await page.getByRole("link", { name: /^아이오닉 5/ }).click();
  await page.getByRole("link", { name: /아이오닉 5 \(2021~2024\)/ }).click();
  await expect(page.getByRole("heading", { name: "아이오닉 5 (2021~2024)", level: 1 })).toBeVisible();
}

const issueCard = (page: Page) => page.locator("div.rounded-\\[14px\\]", { hasText: TITLE }).first();

test("에디터 초안 → 검토 요청 → 관리자 승인 → 사용자 화면에 검증됨", async ({ page }) => {
  // 0. 리포트를 먼저 한 번 열어 저장(ISR)시켜 둠. 승인 뒤 이 저장본이 만료되지 않으면 3번에서 실패해야 함
  await openIoniq5Report(page);
  const reportUrl = page.url();
  await page.goto(reportUrl); // 주소로 한 번 더 열어 서버 저장본(HIT)이 확실히 생기게
  await expect(page.locator("article", { hasText: TITLE })).toHaveCount(0);

  // 1. 에디터: 초안 작성 후 검토 요청. 승인 버튼은 안 보임
  await login(page, EDITOR);
  await expect(page.getByText(/에디터: 초안 작성·수정만/)).toBeVisible();
  await selectIoniq5(page);
  await page.getByPlaceholder("제목 (예: 7단 DCT 저속 변속 충격)").fill(TITLE);
  await page.getByPlaceholder("어떤 문제인지").fill("충전구 덮개 걸쇠가 잘 부러진다는 얘기가 있습니다.");
  await page.getByPlaceholder("살 때 어떻게 확인하는지").fill("충전구 덮개를 여러 번 열고 닫아 보세요.");
  await page.getByRole("button", { name: "초안으로 추가" }).click();

  const card = issueCard(page);
  await expect(card.getByText("초안", { exact: true })).toBeVisible();
  await card.getByRole("button", { name: "검토 요청" }).click();
  await expect(card.getByText("검토 중", { exact: true })).toBeVisible();
  await expect(card.getByRole("button", { name: /승인/ })).toHaveCount(0);
  await page.getByRole("button", { name: "로그아웃" }).click();

  // 2. 관리자: 승인 (출처 URL을 물어보는 창에 입력)
  await login(page, ADMIN);
  await selectIoniq5(page);
  page.once("dialog", (d) => d.accept("https://www.car.go.kr/e2e-source"));
  await issueCard(page).getByRole("button", { name: "승인 (검증됨)" }).click();
  await expect(issueCard(page).getByText("검증됨", { exact: true })).toBeVisible();

  // 이력: 작성 → 검토 요청 → 승인, 누가 했는지
  await issueCard(page).getByText(/변경 이력 3건/).click();
  await expect(issueCard(page).getByText("검토 중 → 검증됨")).toBeVisible();

  // 3. 사용자 리포트: 저장돼 있던 화면(ISR)이 만료돼, 주소를 새로 열면 바로 "검증됨"으로 보임
  //    (화면 안 링크 이동은 만료 직후 첫 번째만 옛 화면일 수 있어 주소로 엶 → web/src/lib/cached.ts)
  await page.goto(reportUrl);
  const published = page.locator("article", { hasText: TITLE });
  await expect(published.getByText("검증됨", { exact: true })).toBeVisible();
  await expect(published.getByRole("link", { name: "출처 보기" })).toHaveAttribute("href", "https://www.car.go.kr/e2e-source");
});

test("로그인 안 한 채로는 관리 기능을 쓸 수 없다", async ({ page, request }) => {
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "관리자 로그인" })).toBeVisible();
  // 화면을 거치지 않고 API를 직접 불러도 막힘
  const res = await request.post("http://localhost:3290/issues", { data: { carModelId: 1, part: "기타", title: "x", description: "x", checkHow: "x" } });
  expect(res.status()).toBe(401);
});
