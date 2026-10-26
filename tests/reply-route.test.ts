import { afterEach, describe, expect, it } from "vitest";

import { POST } from "@/app/api/replies/route";

const originalApiKey = process.env.GEMINI_API_KEY;

afterEach(() => {
  if (originalApiKey === undefined) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = originalApiKey;
});

describe("POST /api/replies", () => {
  it("returns a useful local reply when Gemini is not configured", async () => {
    delete process.env.GEMINI_API_KEY;
    const response = await POST(
      new Request("http://localhost/api/replies", {
        method: "POST",
        body: JSON.stringify({
          review: {
            id: 1,
            text: "Pengiriman lama",
            sentiment: "NEGATIVE",
            topic: "Pengiriman",
            confidence: 92,
          },
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.meta.source).toBe("local-fallback");
    expect(body.data.reply).toContain("pengiriman");
  });

  it.each([
    ["POSITIVE", "Terima kasih"],
    ["NEUTRAL", "terima kasih"],
    ["NEGATIVE", "mohon maaf"],
  ] as const)("returns a sentiment-appropriate %s fallback", async (sentiment, expected) => {
    delete process.env.GEMINI_API_KEY;
    const response = await POST(
      new Request("http://localhost/api/replies", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": `reply-${sentiment.toLowerCase()}`,
        },
        body: JSON.stringify({
          review: {
            id: 1,
            text: "Contoh ulasan pelanggan",
            sentiment,
            topic: "Kualitas produk",
            confidence: null,
          },
        }),
      }),
    );
    const body = await response.json();

    expect(body.data.reply).toContain(expected);
  });
});
