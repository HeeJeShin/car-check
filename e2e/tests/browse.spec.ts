// 사용자 흐름: 차종 검색 → 세대 선택 → 고질병 리포트(체크리스트 저장) → 매장 점검 가이드
import { expect, test } from "@playwright/test";

test("차종을 찾아 리포트와 점검 가이드까지 본다", async ({ page }) => {
  await page.goto("/cars");
  await expect(page.getByRole("heading", { name: "어떤 차를 사려고 하세요?" })).toBeVisible();

  // 1. 이름으로 검색 (띄어쓰기 없이 쳐도 찾음)
  await page.getByPlaceholder("예: 투싼, K5, 520d").fill("아이오닉5");
  await page.getByRole("link", { name: /^아이오닉 5/ }).click();

  // 2. 세대 고르기: 연식을 넣으면 그 해의 세대만 남음
  await expect(page.getByRole("heading", { name: "몇 년식 아이오닉 5인가요?" })).toBeVisible();
  await page.getByPlaceholder("예: 2017").fill("2022");
  await expect(page.getByText("2022년식에 해당하는 아이오닉 5 1개")).toBeVisible();
  await page.getByRole("link", { name: /아이오닉 5 \(2021~2024\)/ }).click();

  // 3. 리포트: 전기차 스펙 + 고질병
  await expect(page.getByRole("heading", { name: "아이오닉 5 (2021~2024)", level: 1 })).toBeVisible();
  await expect(page.getByText("감속기", { exact: false }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "ICCU(통합충전제어장치) 고장 리콜" })).toBeVisible();

  // 체크리스트는 새로고침해도 유지 (이 브라우저에 저장)
  const first = page.getByRole("checkbox", { name: "카히스토리로 사고·침수 이력 조회" });
  await first.check();
  await page.reload();
  await expect(first).toBeChecked();
  await expect(page.getByText(/^1 \/ \d+$/)).toBeVisible();

  // 4. 매장 점검 가이드: 전기차라 엔진오일·벨트는 빠지고 냉각수는 있음
  await page.getByRole("link", { name: /매장 점검 가이드/ }).click();
  await expect(page.getByRole("heading", { name: "매장에서 이 순서로 보세요" })).toBeVisible();
  // 본넷 그림의 빨간 동그라미("1번 냉각수" …)로 확인
  await expect(page.getByRole("button", { name: /^\d+번 냉각수$/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /^\d+번 엔진오일$/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^\d+번 벨트$/ })).toHaveCount(0);
});

test("없는 차종 주소는 '찾는 차가 없어요'", async ({ page }) => {
  const res = await page.goto("/cars/999999");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "찾는 차가 없어요" })).toBeVisible();
});
