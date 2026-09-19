import { test, expect, type Page } from "@playwright/test";
const mango = "/product/classic-mango-pickle";
const bag = (page: Page) =>
  page.getByRole("dialog", { name: "Your shopping bag" });
async function addMango(page: Page, pack = "500g") {
  await page.goto(mango);
  await page.getByRole("radio", { name: pack, exact: true }).check();
  await page.getByRole("button", { name: "Add to bag", exact: true }).click();
  await expect(bag(page)).toBeVisible();
}
test("pack selection changes price, survives refresh and blocks sold-out packs", async ({
  page,
}) => {
  await page.goto(mango);
  await expect(
    page.getByTestId("variant-price").filter({ visible: true }),
  ).toHaveText("₹149.00");
  await page.getByRole("radio", { name: "500g", exact: true }).check();
  await expect(
    page.getByTestId("variant-price").filter({ visible: true }),
  ).toHaveText("₹279.00");
  await expect(page).toHaveURL(/variant=variant_0_1/);
  await page.reload();
  await expect(
    page.getByRole("radio", { name: "500g", exact: true }),
  ).toBeChecked();
  await page.getByRole("radio", { name: "1kg Out of stock" }).check();
  await expect(
    page.getByTestId("variant-price").filter({ visible: true }),
  ).toHaveText("₹519.00");
  await expect(
    page.getByRole("button", { name: "Out of stock", exact: true }),
  ).toBeDisabled();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /product\/classic-mango-pickle$/,
  );
  const schema = JSON.parse(
    await page.locator('script[type="application/ld+json"]').innerText(),
  );
  expect(schema.offers).toHaveLength(3);
  expect(schema.offers[2].availability).toBe("https://schema.org/OutOfStock");
  expect(schema).not.toHaveProperty("aggregateRating");
});
test("selected pack and quantity persist, update totals, and remove to empty", async ({
  page,
  context,
}) => {
  await page.goto(`${mango}?variant=variant_0_1`);
  await page
    .getByRole("combobox", { name: "Quantity", exact: true })
    .selectOption("2");
  await page.getByRole("button", { name: "Add to bag", exact: true }).click();
  await expect(bag(page)).toBeVisible();
  await expect(
    bag(page).getByText("Pack: 500g", { exact: true }),
  ).toBeVisible();
  await expect(
    bag(page).getByTestId("cart-total").filter({ visible: true }),
  ).toHaveText("₹558.00");
  const cookie = (await context.cookies()).find(
    (c) => c.name === "minara_cart",
  );
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.secure).toBe(true);
  expect(cookie?.sameSite).toBe("Lax");
  expect(await page.evaluate(() => document.cookie)).not.toContain(
    "minara_cart",
  );
  await bag(page).getByRole("link", { name: "View your bag" }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await page.reload();
  await expect(
    page.getByTestId("cart-total").filter({ visible: true }),
  ).toHaveText("₹558.00");
  await page
    .getByLabel("Quantity for Classic Mango Pickle, 500g")
    .selectOption("3");
  await expect(
    page.getByTestId("cart-total").filter({ visible: true }),
  ).toHaveText("₹837.00");
  await page
    .getByRole("button", { name: "Remove Classic Mango Pickle, 500g" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Good things belong here." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Shopping bag, 0 items" }),
  ).toBeVisible();
});
test("same pack merges while different packs remain distinct", async ({
  page,
}) => {
  await addMango(page, "250g");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Add to bag", exact: true }).click();
  await expect(
    bag(page).getByLabel("Quantity for Classic Mango Pickle, 250g"),
  ).toHaveValue("2");
  await page.keyboard.press("Escape");
  await page.getByRole("radio", { name: "500g", exact: true }).check();
  await page.getByRole("button", { name: "Add to bag", exact: true }).click();
  await expect(bag(page).locator("li")).toHaveCount(2);
  await expect(
    bag(page).getByTestId("cart-total").filter({ visible: true }),
  ).toHaveText("₹577.00");
});
test("stock changes after viewing a product are rejected and cart stock is refreshed", async ({
  page,
  request,
}) => {
  await page.goto(mango);
  await page
    .getByRole("combobox", { name: "Quantity", exact: true })
    .selectOption("3");
  await request.post("http://127.0.0.1:9101/__qa/control", {
    data: { variantId: "variant_0_0", stock: 1 },
  });
  try {
    await page.getByRole("button", { name: "Add to bag", exact: true }).click();
    await expect(page.locator("main").getByRole("alert")).toContainText(
      "no longer available",
    );
    await page
      .getByRole("combobox", { name: "Quantity", exact: true })
      .selectOption("1");
    await page.getByRole("button", { name: "Add to bag", exact: true }).click();
    await expect(
      bag(page).getByTestId("cart-total").filter({ visible: true }),
    ).toHaveText("₹149.00");
    await request.post("http://127.0.0.1:9101/__qa/control", {
      data: { variantId: "variant_0_0", stock: 0 },
    });
    await bag(page).getByRole("link", { name: "View your bag" }).click();
    await expect(page).toHaveURL(/\/cart$/);
    await page.reload();
    await expect(
      page.getByText("Currently unavailable. Please remove this item."),
    ).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: "Increase quantity of Classic Mango Pickle, 250g",
      }),
    ).toBeDisabled();
  } finally {
    await request.post("http://127.0.0.1:9101/__qa/control", {
      data: { variantId: "variant_0_0", stock: 42 },
    });
  }
});
test("failed mutations preserve confirmed totals; responses lost after commit are not replayed", async ({
  page,
  request,
}) => {
  await addMango(page);
  await bag(page).getByRole("link", { name: "View your bag" }).click();
  await request.post("http://127.0.0.1:9101/__qa/control", {
    data: { failNextMutation: true },
  });
  await page
    .getByRole("button", {
      name: "Increase quantity of Classic Mango Pickle, 500g",
    })
    .click();
  await expect(page.locator("main").getByRole("alert")).toBeVisible();
  await expect(
    page.getByTestId("cart-total").filter({ visible: true }),
  ).toHaveText("₹279.00");
  await page.getByRole("button", { name: "Refresh bag" }).click();
  await request.post("http://127.0.0.1:9101/__qa/control", {
    data: { failAfterWrite: true },
  });
  await page
    .getByRole("button", {
      name: "Increase quantity of Classic Mango Pickle, 500g",
    })
    .click();
  await expect(page.locator("main").getByRole("alert")).toBeVisible();
  await expect(
    page.getByTestId("cart-total").filter({ visible: true }),
  ).toHaveText("₹558.00");
  await page.reload();
  await expect(
    page.getByTestId("cart-total").filter({ visible: true }),
  ).toHaveText("₹558.00");
});
test("expired carts recover; cross-origin mutations and injected prices are refused", async ({
  page,
  context,
  request,
}) => {
  await context.addCookies([
    {
      name: "minara_cart",
      value: "cart_expired",
      domain: "127.0.0.1",
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
    },
  ]);
  await page.goto("/cart");
  await expect(
    page.getByText("Your previous bag has expired. You can start a new one."),
  ).toBeVisible();
  const cross = await request.post("/api/cart", {
    headers: { Origin: "https://untrusted.example" },
    data: { action: "add", variantId: "variant_0_0", quantity: 1 },
  });
  expect(cross.status()).toBe(403);
  const invalid = await request.post("/api/cart", {
    headers: { Origin: "http://127.0.0.1:3101" },
    data: {
      action: "add",
      variantId: "variant_0_0",
      quantity: 1,
      unit_price: 0,
    },
  });
  expect(invalid.status()).toBe(400);
  await addMango(page);
  await expect(
    bag(page).getByTestId("cart-total").filter({ visible: true }),
  ).toHaveText("₹279.00");
});
test("a second tab sees the same bag and receives changes", async ({
  page,
  context,
}) => {
  await addMango(page);
  await page.keyboard.press("Escape");
  const other = await context.newPage();
  await other.goto("/cart");
  await expect(
    other.getByTestId("cart-total").filter({ visible: true }),
  ).toHaveText("₹279.00");
  await other
    .getByRole("button", {
      name: "Increase quantity of Classic Mango Pickle, 500g",
    })
    .click();
  await expect(
    page.getByRole("button", { name: "Shopping bag, 2 items" }),
  ).toBeVisible();
  await other.close();
});
test("missing optional product sections are omitted and unknown products have a not-found state", async ({
  page,
}) => {
  await page.goto("/product/natural-dishwash-bar");
  await expect(page.locator("details")).toHaveCount(2);
  await expect(
    page.getByText("Product photography coming soon").filter({ visible: true }),
  ).toBeVisible();
  await page.goto("/product/unknown-product");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "isn’t on the shelf",
  );
});
for (const width of [320, 390, 768, 1024, 1440]) {
  test(`product and cart stay usable at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(mango);
    await expect(
      page.getByRole("button", { name: "Add to bag", exact: true }),
    ).toBeEnabled();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
    if (process.env.CAPTURE_UI && [390, 1440].includes(width))
      await page.screenshot({
        path: testInfo.outputPath("product.png"),
        fullPage: true,
      });
    await page.getByRole("button", { name: "Add to bag", exact: true }).click();
    await expect(bag(page)).toBeVisible();
    await bag(page)
      .getByRole("button", { name: "Close panel" })
      .press("Shift+Tab");
    expect(
      await bag(page).evaluate((el) => el.contains(document.activeElement)),
    ).toBe(true);
    await bag(page).getByRole("link", { name: "View your bag" }).click();
    await expect(
      page.getByTestId("cart-total").filter({ visible: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
    if (process.env.CAPTURE_UI && [390, 1440].includes(width)) {
      await page.evaluate(() => {
        (document.activeElement as HTMLElement)?.blur();
        window.scrollTo(0, 0);
      });
      await page.screenshot({
        path: testInfo.outputPath("cart.png"),
        fullPage: true,
      });
    }
  });
}

test("gallery controls, enlarged image and pack-specific MRP use supplied data", async ({
  page,
  request,
}) => {
  await request.post("http://127.0.0.1:9101/__qa/control", {
    data: {
      productId: "product_0",
      images: ["/images/minara-market.webp", "/images/qa-unavailable.webp"],
      mrp: { "MNR-PKL-MANGO-250G": 165 },
    },
  });
  try {
    await page.goto(mango);
    await expect(
      page.getByText("MRP", { exact: false }).filter({ visible: true }),
    ).toContainText("165.00");
    await page
      .getByRole("button", { name: "Show image 2", exact: true })
      .click();
    await expect(
      page.getByText("Image unavailable").filter({ visible: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Show image 1", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Enlarge Classic Mango Pickle image 1" })
      .click();
    const zoom = page.getByRole("dialog", {
      name: "Classic Mango Pickle enlarged image",
    });
    await expect(zoom).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(zoom).not.toBeVisible();
    await page.getByRole("radio", { name: "500g", exact: true }).check();
    await expect(
      page
        .locator("main")
        .getByText("MRP", { exact: false })
        .filter({ visible: true }),
    ).toHaveCount(0);
  } finally {
    await request.post("http://127.0.0.1:9101/__qa/control", {
      data: { productId: "product_0", images: [], mrp: {} },
    });
  }
});

test("simultaneous first additions across tabs share one cart", async ({
  page,
  context,
}) => {
  await page.goto(mango);
  const other = await context.newPage();
  await other.goto("/product/mixed-vegetable-pickle");
  await expect(
    page.getByRole("button", { name: "Add to bag", exact: true }),
  ).toBeEnabled();
  await expect(
    other.getByRole("button", { name: "Add to bag", exact: true }),
  ).toBeEnabled();
  await Promise.all([
    page.getByRole("button", { name: "Add to bag", exact: true }).click(),
    other.getByRole("button", { name: "Add to bag", exact: true }).click(),
  ]);
  await expect(bag(page)).toBeVisible();
  await expect(bag(other)).toBeVisible();
  await expect(
    bag(page).getByTestId("cart-total").filter({ visible: true }),
  ).toHaveText("₹288.00");
  await expect(
    bag(other).getByTestId("cart-total").filter({ visible: true }),
  ).toHaveText("₹288.00");
  await other.close();
});
