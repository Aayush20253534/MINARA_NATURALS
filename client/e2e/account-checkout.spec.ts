import {
  test,
  expect,
  type Page,
  type APIRequestContext,
} from "@playwright/test";
const password = "A long test password 42!";
const control = (request: APIRequestContext, body: unknown) =>
  request.post("http://127.0.0.1:9101/__qa/account-control", { data: body });
async function register(page: Page, next = "/account") {
  const email = `qa-${Date.now()}-${Math.random().toString(16).slice(2)}@example.test`;
  await page.goto(`/account/register?next=${encodeURIComponent(next)}`);
  await page.getByLabel("First name", { exact: true }).fill("Anaya");
  await page.getByLabel("Last name", { exact: true }).fill("Shah");
  await page.getByLabel("Email address", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page).toHaveURL(new RegExp(`${next}$`));
  return email;
}
async function address(page: Page) {
  await page.getByLabel("First name", { exact: true }).fill("Anaya");
  await page.getByLabel("Last name", { exact: true }).fill("Shah");
  await page.getByLabel("Address", { exact: true }).fill("12 Garden Road");
  await page.getByLabel("City", { exact: true }).fill("Pune");
  await page
    .getByLabel("State / union territory", { exact: true })
    .fill("Maharashtra");
  await page.getByLabel("PIN code", { exact: true }).fill("411001");
  await page.getByLabel("Phone number", { exact: true }).fill("9876543210");
}
async function bag(page: Page) {
  await page.goto("/product/classic-mango-pickle");
  await page.getByRole("button", { name: "Add to bag", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Your shopping bag" }),
  ).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "View your bag" })
    .click();
}
async function checkout(page: Page) {
  await bag(page);
  await page.getByRole("link", { name: "Continue to checkout" }).click();
  await expect(
    page.getByRole("heading", { name: "Make it yours." }),
  ).toBeVisible();
  await address(page);
  await page.getByRole("button", { name: "Save delivery address" }).click();
  await page.getByRole("radio", { name: /Standard delivery/ }).click();
  await expect(
    page.getByRole("radio", { name: /Standard delivery/ }),
  ).toBeChecked();
  await expect(
    page.getByRole("button", { name: "Pay ₹198.00", exact: true }),
  ).toBeEnabled();
}
async function gateway(page: Page, dismiss = false) {
  await page.route("https://checkout.razorpay.com/v1/checkout.js", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: `window.Razorpay=class{constructor(o){this.o=o;}on(){}open(){setTimeout(()=>${dismiss ? "this.o.modal.ondismiss()" : "(this.o.handler(), this.o.handler(), this.o.modal.ondismiss())"},50);}};`,
    }),
  );
}
test.beforeEach(async ({ request }) => {
  await control(request, {
    enabled: true,
    shipping: true,
    gatewayMode: "captured",
    failComplete: false,
  });
});
test("registration, private cookies, profile and logout", async ({
  page,
  context,
}) => {
  await register(page);
  await expect(
    page.getByRole("heading", { name: "Your details" }),
  ).toBeVisible();
  const cookie = (await context.cookies()).find(
    (c) => c.name === "minara_auth",
  );
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.secure).toBe(true);
  expect(cookie?.sameSite).toBe("Lax");
  expect(await page.evaluate(() => document.cookie)).not.toContain(
    "minara_auth",
  );
  await page.getByLabel("First name", { exact: true }).fill("Anya");
  await page.getByRole("button", { name: "Save details" }).click();
  await expect(page.getByRole("status")).toContainText("saved");
  await page.reload();
  await expect(page.getByLabel("First name", { exact: true })).toHaveValue(
    "Anya",
  );
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/account\/login$/);
  await page.goto("/account/orders");
  await expect(page).toHaveURL(/\/account\/login$/);
});
test("saved addresses can be created, edited and removed", async ({ page }) => {
  await register(page);
  await page
    .getByRole("navigation", { name: "Your account" })
    .getByRole("link", { name: "Addresses", exact: true })
    .click();
  await page.getByRole("button", { name: "Add an address" }).click();
  await address(page);
  await page.getByRole("button", { name: "Save address", exact: true }).click();
  await expect(
    page
      .getByText("12 Garden Road", { exact: false })
      .filter({ visible: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Edit address" }).click();
  await page.getByLabel("Address", { exact: true }).fill("18 Garden Road");
  await page.getByRole("button", { name: "Save address", exact: true }).click();
  await expect(
    page
      .getByText("18 Garden Road", { exact: false })
      .filter({ visible: true }),
  ).toBeVisible();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Remove", exact: true }).click();
  await expect(
    page.getByText("A place for your good things.").filter({ visible: true }),
  ).toBeVisible();
});
test("wishlist persists after signing out and back in", async ({ page }) => {
  const email = await register(page);
  await page.goto("/product/classic-mango-pickle");
  await page.getByRole("button", { name: "Save to wishlist" }).click();
  await expect(
    page.getByRole("button", { name: "Saved to your wishlist" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.goto("/account/wishlist");
  await expect(
    page.getByRole("heading", { name: "Classic Mango Pickle", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.getByLabel("Email address", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/account$/);
  await page.goto("/account/wishlist");
  await expect(
    page.getByRole("heading", { name: "Classic Mango Pickle", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Remove", exact: true }).click();
  await expect(
    page.getByText("A little list of good things.").filter({ visible: true }),
  ).toBeVisible();
});
test("password reset hides token, is single-use and accepts new password", async ({
  page,
  request,
}) => {
  const email = await register(page);
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.getByRole("link", { name: "Forgot your password?" }).click();
  await page.getByLabel("Email address", { exact: true }).fill(email);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByRole("status")).toContainText("If an account");
  const { resets } = await (await control(request, {})).json();
  const token = resets.find((r: { email: string }) => r.email === email).token;
  await page.goto(`/account/reset-password#token=${token}`);
  await expect(page).toHaveURL(/\/account\/reset-password$/);
  await page
    .getByLabel("Password", { exact: true })
    .fill("A different secure password 73!");
  await page.getByRole("button", { name: "Save new password" }).click();
  await expect(page.getByRole("status")).toContainText("changed");
  await page.goto(`/account/reset-password#token=${token}`);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Save new password" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toBeVisible();
  await page.getByRole("link", { name: "Back to sign in" }).click();
  await page.getByLabel("Email address", { exact: true }).fill(email);
  await page
    .getByLabel("Password", { exact: true })
    .fill("A different secure password 73!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/account$/);
});
test("guest bag survives registration and leads back to checkout", async ({
  page,
}) => {
  await bag(page);
  await page.getByRole("link", { name: "Continue to checkout" }).click();
  await expect(page).toHaveURL(/\/account\/login\?next=/);
  await register(page, "/checkout");
  await expect(
    page.getByRole("heading", { name: "Order review" }),
  ).toBeVisible();
  await expect(
    page
      .getByText("Classic Mango Pickle", { exact: true })
      .filter({ visible: true }),
  ).toBeVisible();
});
test("full prepaid journey produces one order and private confirmation", async ({
  page,
  request,
  browser,
}) => {
  await register(page);
  await checkout(page);
  await gateway(page);
  await page.getByRole("button", { name: "Pay ₹198.00", exact: true }).click();
  await expect(page).toHaveURL(/\/checkout\/confirmation\/order_/);
  await expect(
    page.getByRole("heading", { name: "Good things are on their way." }),
  ).toBeVisible();
  const confirmation = page.url();
  const result = await page.evaluate(async () => {
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete" }),
    });
    return { status: response.status, data: await response.json() };
  });
  expect(result.status).toBe(200);
  expect(confirmation).toContain(result.data.order_id);
  await page.getByRole("link", { name: "Your orders", exact: true }).click();
  await expect(page.getByRole("link", { name: "View order" })).toHaveCount(1);
  const second = await browser.newPage();
  await register(second);
  await second.goto(confirmation);
  await expect(
    second.getByRole("heading", { name: "Good things are on their way." }),
  ).toHaveCount(0);
  await second.close();
  expect((await request.get("/api/account?view=orders")).status()).toBe(401);
});
test("payment dismissal and pending authorization never show success", async ({
  page,
  request,
}) => {
  await control(request, { gatewayMode: "pending" });
  await register(page);
  await checkout(page);
  await gateway(page, true);
  await page.getByRole("button", { name: "Pay ₹198.00", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Resume payment" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Check payment status" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "not confirmed",
  );
  expect(page.url()).toMatch(/\/checkout$/);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Resume payment" }),
  ).toBeEnabled();
  await control(request, { gatewayMode: "captured" });
  await page.getByRole("button", { name: "Check payment status" }).click();
  await expect(page).toHaveURL(/\/checkout\/confirmation\//);
});
test("lost completion response reconciles without a second order", async ({
  page,
  request,
}) => {
  await register(page);
  await checkout(page);
  await gateway(page);
  await control(request, { failComplete: true });
  await page.getByRole("button", { name: "Pay ₹198.00", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toBeVisible();
  await page.getByRole("button", { name: "View order confirmation" }).click();
  await expect(page).toHaveURL(/\/checkout\/confirmation\//);
  await page.getByRole("link", { name: "Your orders", exact: true }).click();
  await expect(page.getByRole("link", { name: "View order" })).toHaveCount(1);
});
test("checkout closed and uncovered delivery are explicit blocking states", async ({
  page,
  request,
}) => {
  await register(page);
  await control(request, { enabled: false, shipping: false });
  await bag(page);
  await page.getByRole("link", { name: "Continue to checkout" }).click();
  await expect(page.getByRole("status")).toContainText("not open yet");
  await address(page);
  await page.getByRole("button", { name: "Save delivery address" }).click();
  await expect(
    page
      .getByText("No delivery options are available", { exact: false })
      .filter({ visible: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /^Pay ₹/ })).toBeDisabled();
});
test("account and checkout reject cross-origin mutations and unsafe addresses", async ({
  page,
}) => {
  await register(page);
  expect(
    (
      await page.request.post("/api/account", {
        headers: { origin: "https://evil.example" },
        data: {
          action: "profile",
          first_name: "Wrong",
          last_name: "Name",
          phone: "",
        },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await page.request.post("/api/checkout", {
        headers: { origin: "https://evil.example" },
        data: { action: "complete" },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await page.request.post("/api/auth", {
        headers: { origin: "https://evil.example" },
        data: { action: "logout" },
      })
    ).status(),
  ).toBe(403);
  expect(
    await page.evaluate(async () => {
      const response = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "address-save",
          address: { country_code: "us" },
        }),
      });
      return response.status;
    }),
  ).toBe(400);
});
test("mobile account and checkout fit the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await register(page);
  await expect(
    page.getByRole("navigation", { name: "Your account" }),
  ).toBeVisible();
  await checkout(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  if (process.env.CAPTURE_UI)
    await page.screenshot({
      path: "test-results/phase18-mobile-checkout.png",
      fullPage: true,
    });
});
