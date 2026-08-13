import { expect, test } from "@playwright/test";

test("renders an accessible personal-finance shell", async ({ page }) => {
  await page.goto("/#today");
  await expect(page.locator("main#main-content")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Good morning, Arun." })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

for (const destination of ["Flow", "Accounts", "Activity", "Bills", "Credit", "Explore"]) {
  test(`navigates to ${destination}`, async ({ page, isMobile }) => {
    await page.goto("/#today");
    if (isMobile) await page.getByRole("button", { name: "Open navigation" }).click();
    await page.getByRole("navigation", { name: "Primary navigation" }).getByRole("button", { name: new RegExp(`^${destination}`) }).click();
    await expect(page.getByRole("heading", { level: 1, name: destination, exact: true })).toBeVisible();
  });
}

test("reduced motion does not hide financial meaning", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/#credit");
  await expect(page.locator("main#main-content")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Credit" })).toBeVisible();
  await context.close();
});
