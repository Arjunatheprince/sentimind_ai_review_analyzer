import { expect, test } from "@playwright/test";

import { mkdir } from "node:fs/promises";

test("analyzes reviews, creates a reply, and exports the report", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  await expect(page).toHaveTitle(/Sentimind/);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /sentimind-og\.png/);

  await page.getByLabel("Satu ulasan per baris").fill([
    "Produknya bagus dan pengirimannya cepat.",
    "Barang retak saat diterima dan kemasannya kurang aman.",
  ].join("\n"));
  await page.getByRole("button", { name: "Analisis ulasan" }).click();

  await expect(page.getByRole("heading", { name: "Suara pelanggan, diringkas." })).toBeVisible();
  await expect(page.getByText("Analisis lokal · heuristik")).toBeVisible();
  await expect(page.getByText("Menampilkan 2 dari 2 ulasan")).toBeVisible();

  await page.getByRole("button", { name: "Buat balasan" }).first().click();
  await expect(page.getByText("Draf balasan").first()).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Ekspor CSV" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("sentimind-reviews.csv");

  if (process.env.CAPTURE_PORTFOLIO) {
    await mkdir("docs", { recursive: true });
    await page.screenshot({ path: "docs/sentimind-dashboard.png", fullPage: true });
  }
});
