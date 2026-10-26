import { afterEach, describe, expect, it } from "vitest";

import { POST } from "@/app/api/analyses/route";

const originalApiKey = process.env.GEMINI_API_KEY;

afterEach(() => {
  if (originalApiKey === undefined) {
    delete process.env.GEMINI_API_KEY;
  } else {
    process.env.GEMINI_API_KEY = originalApiKey;
  }
});

describe("POST /api/analyses", () => {
  it("returns a validated local fallback when Gemini is not configured", async () => {
    delete process.env.GEMINI_API_KEY;
    const request = new Request("http://localhost/api/analyses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reviews: ["Produknya bagus"] }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.meta.source).toBe("local-fallback");
    expect(body.data.reviews).toHaveLength(1);
  });

  it("returns the shared error shape for invalid input", async () => {
    const request = new Request("http://localhost/api/analyses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reviews: [] }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Masukkan minimal satu ulasan yang valid.",
      },
    });
  });

  it("limits repeated analysis requests from the same client", async () => {
    delete process.env.GEMINI_API_KEY;

    const responses = await Promise.all(
      Array.from({ length: 11 }, () => POST(
        new Request("http://localhost/api/analyses", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-forwarded-for": "rate-limit-analysis-test",
          },
          body: JSON.stringify({ reviews: ["Produknya bagus"] }),
        }),
      )),
    );

    expect(responses.slice(0, 10).every((response) => response.status === 200)).toBe(true);
    expect(responses[10]?.status).toBe(429);
    expect(responses[10]?.headers.get("retry-after")).toBeTruthy();
  });
});
