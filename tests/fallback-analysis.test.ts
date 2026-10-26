import { describe, expect, it } from "vitest";

import { createFallbackAnalysis } from "@/lib/analysis/fallback";
import { analysisSchema } from "@/lib/analysis/schema";

describe("createFallbackAnalysis", () => {
  it("returns a complete and internally consistent report", () => {
    const analysis = createFallbackAnalysis([
      "Bahannya bagus dan nyaman",
      "Pengiriman lama dan mengecewakan",
      "Ukuran sesuai deskripsi",
    ]);

    expect(() => analysisSchema.parse(analysis)).not.toThrow();
    expect(analysis.reviews).toHaveLength(3);
    expect(
      analysis.sentiment.positive +
        analysis.sentiment.neutral +
        analysis.sentiment.negative,
    ).toBe(100);
    expect(analysis.executiveSummary).toContain("analisis lokal");
  });

  it("does not claim model confidence for heuristic classifications", () => {
    const analysis = createFallbackAnalysis(["Produknya bagus"]);

    expect(analysis.reviews[0]?.confidence).toBeNull();
  });

  it("classifies the reported Indonesian reviews without substring collisions", () => {
    const reviews = [
      "Produknya original dan berfungsi dengan sangat baik! Bahannya kokoh, kemasan rapi, dan pengirimannya cepat sekali. Sangat direkomendasikan!",
      "Respon penjual sangat ramah dan informatif. Pertanyaan saya dijawab dengan cepat. Sukses terus untuk tokonya!",
      "Makanannya enak banget, porsinya pas, dan tempatnya bersih. Pelayanannya juga ramah dan cepat. Pasti bakal langganan di sini.",
      "Awalnya ragu buat beli, tapi setelah barangnya sampai ternyata melebihi ekspektasi. Kualitas bintang lima dengan harga ramah di kantong!",
      "Kecewa banget, barang sampai dalam kondisi retak di bagian ujungnya. Mohon diperhatikan lagi QC sebelum dikirim.",
      "Pengirimannya lama banget, lewat dari estimasi tanggal yang ditentukan. Respon chat dari admin juga slow respon saat ditanya resi.",
      "Ukuran dan warnanya tidak sesuai dengan foto yang dipajang di etalase. Kainnya juga ternyata tipis dan agak menerawang.",
      "Barang sudah diterima dengan baik. Kualitasnya standar sesuai harga, tidak ada yang spesial tapi fungsinya cukup oke.",
      "Produknya bagus dan berfungsi, tapi sayang pengemasannya agak lama. Semoga ke depannya proses pengiriman bisa dipercepat.",
      "Produknya sih bagus dan tidak ada masalah, tapi kurir ekspedisinya kurang ramah saat mengantar barang ke rumah.",
    ];

    const analysis = createFallbackAnalysis(reviews);

    expect(analysis.reviews.map((review) => review.sentiment)).toEqual([
      "POSITIVE",
      "POSITIVE",
      "POSITIVE",
      "POSITIVE",
      "NEGATIVE",
      "NEGATIVE",
      "NEGATIVE",
      "NEUTRAL",
      "NEUTRAL",
      "NEUTRAL",
    ]);
  });

  it("assigns a specific topic from the review subject", () => {
    const analysis = createFallbackAnalysis([
      "Respon penjual sangat ramah dan informatif.",
      "Pengirimannya lama dan admin slow respon saat ditanya resi.",
      "Ukuran dan warnanya tidak sesuai dengan foto.",
      "Makanannya enak dan tempatnya bersih.",
    ]);

    expect(analysis.reviews.map((review) => review.topic)).toEqual([
      "Layanan penjual",
      "Pengiriman & layanan",
      "Kesesuaian produk",
      "Makanan & tempat",
    ]);
  });});
