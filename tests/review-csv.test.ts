import { describe, expect, it } from "vitest";

import { exportReviewsToCsv, parseReviewFile } from "@/lib/reviews/csv";

describe("parseReviewFile", () => {
  it("reads the review column and preserves quoted commas", () => {
    const csv = [
      "review,rating",
      '"Bahannya adem, jahitannya rapi",5',
      '"Pengiriman lambat",2',
    ].join("\n");

    expect(parseReviewFile(csv)).toEqual([
      "Bahannya adem, jahitannya rapi",
      "Pengiriman lambat",
    ]);
  });

  it("accepts a plain-text file with one review per line", () => {
    expect(parseReviewFile("Bagus sekali\nPengiriman terlambat")).toEqual([
      "Bagus sekali",
      "Pengiriman terlambat",
    ]);
  });
});

describe("exportReviewsToCsv", () => {
  it("exports an Excel-friendly table with readable Indonesian values", () => {
    const csv = exportReviewsToCsv([
      {
        id: 1,
        text: "Produknya bagus; pengirimannya cepat",
        sentiment: "POSITIVE",
        topic: "Kepuasan produk",
        confidence: 92,
      },
      {
        id: 2,
        text: "Kualitasnya cukup sesuai harga",
        sentiment: "NEUTRAL",
        topic: "Kualitas produk",
        confidence: null,
      },
    ], {
      1: "Terima kasih sudah berbelanja bersama kami.",
    });

    expect(csv).toBe([
      "\uFEFFsep=;",
      "No;Ulasan;Sentimen;Topik;Tingkat Keyakinan;Draf Balasan",
      '1;"Produknya bagus; pengirimannya cepat";Positif;Kepuasan produk;92%;Terima kasih sudah berbelanja bersama kami.',
      "2;Kualitasnya cukup sesuai harga;Netral;Kualitas produk;Tidak tersedia;Belum dibuat",
    ].join("\r\n"));
  });

  it("neutralizes spreadsheet formulas in user-controlled cells", () => {
    const csv = exportReviewsToCsv([
      {
        id: 1,
        text: '=HYPERLINK("https://example.com")',
        sentiment: "NEGATIVE",
        topic: "+Keluhan",
        confidence: 90,
      },
    ]);

    expect(csv).toContain("'=HYPERLINK");
    expect(csv).toContain("'+Keluhan");
  });
});
