import { beforeEach, describe, expect, it, vi } from "vitest";

const { generateContent } = vi.hoisted(() => ({
  generateContent: vi.fn(),
}));

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent };
  },
}));

import { analyzeWithGemini } from "@/lib/analysis/gemini";

const validAnalysis = {
  executiveSummary: "Mayoritas pelanggan puas, dengan satu keluhan kesesuaian produk.",
  healthScore: 70,
  sentiment: { positive: 50, neutral: 0, negative: 50 },
  complaints: [
    {
      topic: "Kesesuaian produk",
      mentions: 1,
      impact: "MEDIUM",
      quote: "Ukuran tidak sesuai foto.",
    },
  ],
  praises: [
    {
      topic: "Layanan penjual",
      mentions: 1,
      quote: "Penjual ramah dan informatif.",
    },
  ],
  recommendations: [
    {
      title: "Perjelas panduan ukuran",
      description: "Perbarui panduan ukuran berdasarkan pengukuran produk.",
      priority: "HIGH",
      expectedImpact: "Mengurangi keluhan ketidaksesuaian ukuran.",
    },
  ],
  reviews: [
    {
      id: 1,
      text: "Penjual ramah dan informatif.",
      sentiment: "POSITIVE",
      topic: "Layanan penjual",
      confidence: 95,
    },
    {
      id: 2,
      text: "Ukuran tidak sesuai foto.",
      sentiment: "NEGATIVE",
      topic: "Kesesuaian produk",
      confidence: 94,
    },
  ],
};

describe("analyzeWithGemini", () => {
  beforeEach(() => {
    generateContent.mockReset();
  });

  it("uses Gemini JSON mode and validates the returned analysis", async () => {
    generateContent.mockImplementation(async ({ config }) => {
      if (config.responseJsonSchema) {
        throw Object.assign(new Error("Request contains an invalid argument"), {
          status: 400,
        });
      }

      return { text: JSON.stringify(validAnalysis) };
    });

    const analysis = await analyzeWithGemini(
      ["Penjual ramah dan informatif.", "Ukuran tidak sesuai foto."],
      "test-api-key",
    );

    expect(analysis.reviews.map((review) => review.sentiment)).toEqual([
      "POSITIVE",
      "NEGATIVE",
    ]);
    expect(generateContent).toHaveBeenCalledOnce();
    expect(generateContent.mock.calls[0]?.[0].config).toMatchObject({
      seed: 20_261_026,
      temperature: 0,
    });
  });

  it("reuses the first validated result for identical review input", async () => {
    generateContent
      .mockResolvedValueOnce({ text: JSON.stringify(validAnalysis) })
      .mockResolvedValueOnce({
        text: JSON.stringify({ ...validAnalysis, healthScore: 10 }),
      });

    const reviews = [
      "Kualitas produk baik tetapi pengiriman agak lama.",
      "Admin ramah dan informatif.",
    ];
    const first = await analyzeWithGemini(reviews, "test-api-key");
    const second = await analyzeWithGemini(reviews, "test-api-key");

    expect(second).toEqual(first);
    expect(generateContent).toHaveBeenCalledOnce();
  });
});
