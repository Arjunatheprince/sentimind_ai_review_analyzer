import { describe, expect, it } from "vitest";

import { analysisSchema, analyzeRequestSchema } from "@/lib/analysis/schema";

const validAnalysis = {
  executiveSummary: "Mayoritas pelanggan menyukai kualitas produk.",
  healthScore: 82,
  sentiment: { positive: 60, neutral: 20, negative: 20 },
  complaints: [
    {
      topic: "Pengiriman",
      mentions: 2,
      impact: "HIGH",
      quote: "Pengirimannya terlalu lama.",
    },
  ],
  praises: [
    {
      topic: "Kualitas",
      mentions: 3,
      quote: "Bahannya nyaman.",
    },
  ],
  recommendations: [
    {
      title: "Evaluasi kurir",
      description: "Bandingkan performa mitra logistik setiap minggu.",
      priority: "HIGH",
      expectedImpact: "Menurunkan keluhan keterlambatan.",
    },
  ],
  reviews: [
    {
      id: 1,
      text: "Produknya bagus.",
      sentiment: "POSITIVE",
      topic: "Kualitas",
      confidence: 96,
    },
  ],
};

describe("analysisSchema", () => {
  it("accepts a complete analysis whose sentiment totals 100", () => {
    expect(analysisSchema.parse(validAnalysis)).toEqual(validAnalysis);
  });

  it("rejects sentiment percentages whose total is not 100", () => {
    const invalid = {
      ...validAnalysis,
      sentiment: { positive: 60, neutral: 20, negative: 10 },
    };

    expect(analysisSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects scores outside the supported range", () => {
    expect(
      analysisSchema.safeParse({ ...validAnalysis, healthScore: 120 }).success,
    ).toBe(false);
  });
});

describe("analyzeRequestSchema", () => {
  it("trims reviews and drops blank lines", () => {
    const result = analyzeRequestSchema.parse({
      reviews: ["  Bagus sekali  ", "   ", "Pengiriman terlambat"],
    });

    expect(result.reviews).toEqual(["Bagus sekali", "Pengiriman terlambat"]);
  });

  it("rejects requests without a usable review", () => {
    expect(
      analyzeRequestSchema.safeParse({ reviews: ["", "  "] }).success,
    ).toBe(false);
  });
});
