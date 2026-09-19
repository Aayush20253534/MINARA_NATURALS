import { test, expect } from "@playwright/test";

test("homepage, root categories and search form navigate into real routes", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Good things.",
  );
  await expect(page.locator("#categories h3")).toHaveCount(6);
  await page.getByRole("searchbox", { name: "Search products" }).fill("mango");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL(/\/search\?q=mango/);
  await expect(
    page.getByRole("heading", { name: "Classic Mango Pickle", exact: true }),
  ).toBeVisible();
});

test("pack/price/stock filters combine, sort preserves filters, and Back restores state", async ({
  page,
}) => {
  await page.goto("/category/minara-pickles");
  await expect(page.getByRole("link", { name: "Mango Pickles" })).toBeVisible();
  await page.getByRole("checkbox", { name: "500g", exact: true }).check();
  await page
    .getByRole("spinbutton", { name: "Maximum", exact: true })
    .fill("260");
  await page.getByRole("radio", { name: "In stock", exact: true }).check();
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page).toHaveURL(/max=260/);
  await expect(
    page.getByRole("heading", { name: "Classic Mango Pickle", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Mixed Vegetable Pickle", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Sort by", exact: true })
    .selectOption("price-desc");
  await expect(page).toHaveURL(/sort=price-desc/);
  await expect(page).toHaveURL(/pack=500g/);
  await page.goBack();
  await expect(
    page.getByRole("combobox", { name: "Sort by", exact: true }),
  ).toHaveValue("featured");
  await expect(
    page.getByRole("checkbox", { name: "500g", exact: true }),
  ).toBeChecked();
  await page.getByRole("link", { name: "Remove 500g" }).click();
  await expect(page).not.toHaveURL(/pack=/);
});

test("pagination and no matches are meaningful; filtered/search pages are noindex", async ({
  page,
}) => {
  await page.goto("/shop");
  await expect(page.locator('main a[href^="/product/"]')).toHaveCount(12);
  await page.getByRole("link", { name: "Next →", exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.locator('main a[href^="/product/"]')).toHaveCount(4);
  await page.goto("/shop?page=999");
  await expect(page).toHaveURL(/page=2/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /shop\?page=2$/,
  );
  await page.goto("/search?q=zzzznomatches");
  await expect(
    page.getByRole("heading", { name: "No matches just yet." }),
  ).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
  await page.getByRole("link", { name: "Clear search", exact: true }).click();
  await expect(page).not.toHaveURL(/q=/);
});

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`no horizontal overflow at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of [
      "/",
      "/shop",
      "/category/minara-pickles",
      "/search?q=rice",
    ]) {
      await page.goto(path);
      await expect(page.locator("main h1")).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      expect(overflow, `${path} overflows at ${width}px`).toBe(false);
      if (
        process.env.CAPTURE_UI &&
        [390, 1440].includes(width) &&
        ["/", "/shop"].includes(path)
      ) {
        await page.waitForLoadState("networkidle");
        await page.screenshot({
          path: testInfo.outputPath(
            path === "/" ? "homepage.png" : "catalogue.png",
          ),
          fullPage: true,
        });
      }
    }
  });
}

test("mobile drawer traps focus, supports Escape and applies filters", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/shop");
  await page.getByRole("button", { name: "Filters", exact: true }).click();
  const drawer = page.getByRole("dialog", { name: "Refine your search" });
  await expect(drawer).toBeVisible();
  await drawer.getByRole("button", { name: "Close panel" }).press("Shift+Tab");
  const focusInside = await drawer.evaluate((el) =>
    el.contains(document.activeElement),
  );
  expect(focusInside).toBe(true);
  await page.keyboard.press("Escape");
  await expect(drawer).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Filters", exact: true }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Filters", exact: true }).click();
  await drawer.getByLabel("500g", { exact: true }).check();
  await drawer.getByRole("button", { name: "Apply filters" }).click();
  await expect(page).toHaveURL(/pack=500g/);
  await expect(drawer).not.toBeVisible();
  await expect(page.getByRole("link", { name: "Remove 500g" })).toBeVisible();
});

test("nested category links resolve and missing categories are 404s", async ({
  page,
}) => {
  await page.goto("/category/fresh-produce");
  await page.getByRole("link", { name: "Vegetables", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Vegetables", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Farm Fresh Tomatoes", exact: true }),
  ).toBeVisible();
  await page.goto("/category/this-category-does-not-exist");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "isn’t on the shelf",
  );
});
