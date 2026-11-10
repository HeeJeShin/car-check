// 내 차량: 로그인 없이 담기를 누르면 로그인 창 → 로그인 후 그대로 담김 → 내 차량에서 보고 지움. 일반 사용자는 관리 화면을 못 씀
import { expect, test } from "@playwright/test";

const USER = "driver@e2e.test";

test("담기를 누르면 로그인을 요청하고, 로그인하면 내 차량에 담겨 다시 볼 수 있다", async ({ page }) => {
  await page.goto("/cars");
  await page.getByPlaceholder("예: 투싼, K5, 520d").fill("아이오닉5");
  await page.getByRole("link", { name: /^아이오닉 5/ }).click();
  await page.getByRole("link", { name: /아이오닉 5 \(2021~2024\)/ }).click();

  await page.getByRole("button", { name: "내 차량에 담기" }).click();
  const sheet = page.getByRole("dialog", { name: "로그인하면 내 차량에 담을 수 있어요" });
  await sheet.getByPlaceholder("테스트용 이메일").fill(USER);
  await sheet.getByRole("button", { name: "이메일로 로그인" }).click();

  await expect(page.getByRole("button", { name: "내 차량에 담겼어요" })).toBeVisible();
  await expect(sheet).toBeHidden();

  await page.getByRole("link", { name: "내 차량 보기" }).click();
  await expect(page.getByRole("link", { name: /아이오닉 5 \(2021~2024\)/ })).toBeVisible();

  // 새로고침해도 서버에 저장돼 있음
  await page.reload();
  await page.getByRole("button", { name: "아이오닉 5 삭제" }).click();
  await expect(page.getByText("아직 담은 차가 없어요")).toBeVisible();

  // 계정 삭제: 로그아웃 상태로 돌아가고, 개인정보처리방침은 푸터에서 열 수 있음
  await page.getByRole("button", { name: "내 계정 삭제" }).click();
  await page.getByRole("button", { name: "계정 삭제 확인" }).click();
  await expect(page.getByRole("heading", { name: "로그인하면 내 차량을 볼 수 있어요" })).toBeVisible();
  await page.getByRole("contentinfo").getByRole("link", { name: "개인정보처리방침" }).click();
  await expect(page.getByRole("heading", { name: "개인정보처리방침", level: 1 })).toBeVisible();
});

test("일반 사용자는 관리 화면에 들어갈 수 없다", async ({ page }) => {
  await page.goto("/admin");
  await page.getByPlaceholder(/ADMIN_EMAILS/).fill(USER);
  await page.getByRole("button", { name: "이메일로 로그인" }).click();
  await expect(page.getByText("이 계정은 관리 권한이 없어요")).toBeVisible();
  await expect(page.getByRole("heading", { name: "방문 통계" })).toBeHidden();
});
