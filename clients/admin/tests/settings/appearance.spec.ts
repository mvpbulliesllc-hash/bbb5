import { expect, test } from "@playwright/test";
import { seedAuthedSession, TEST_USER } from "../helpers/auth-seed";
import { installAdminShellMocks, ADMIN_PERMS } from "../helpers/shell-mocks";

// The admin ships a single dark, liquid-glass theme (see theme-provider.tsx —
// the light theme was retired with the WebGL backdrop). AppearanceSettings is
// a statement of that, not a picker: it renders the one Dark card marked
// Active, and <html> keeps the pinned "dark" class.

test.beforeEach(async ({ page }) => {
  await seedAuthedSession(page, { ...TEST_USER, permissions: [...ADMIN_PERMS] });
  await installAdminShellMocks(page);
});

test.describe("settings · appearance", () => {
  test("renders the single Dark theme card marked active", async ({ page }) => {
    await page.goto("/settings/appearance");

    const main = page.getByRole("main");
    // "Theme" prose appears in the section description AND the settings nav
    // link ("Theme and visual preferences"); anchor to the SettingsSection <h2>.
    await expect(main.getByRole("heading", { name: "Theme" })).toBeVisible({ timeout: 10_000 });
    await expect(main.getByText("Dark", { exact: true })).toBeVisible();
    await expect(main.getByText("Active", { exact: true })).toBeVisible();
    // No light option exists anymore.
    await expect(main.getByRole("button", { name: /Light/ })).toHaveCount(0);
  });

  test("theme is pinned to dark", async ({ page }) => {
    await page.goto("/settings/appearance");

    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { name: "Theme" })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("html")).toHaveClass(/dark/);
  });
});
