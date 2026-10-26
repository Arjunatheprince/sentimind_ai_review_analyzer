import type { Analysis, ReviewAnalysis } from "@/lib/analysis/schema";

type WeightedPhrase = readonly [phrase: string, weight: number];

const NEGATIVE_PHRASES: WeightedPhrase[] = [
  ["tidak sesuai", 3],
  ["tidak berfungsi", 3],
  ["tidak original", 3],
  ["kurang ramah", 2.5],
  ["slow respon", 2.5],
  ["lewat dari estimasi", 2.5],
  ["lewat estimasi", 2.5],
  ["mengecewakan", 2],
  ["kecewa", 2],
  ["retak", 2],
  ["rusak", 2],
  ["mati", 2],
  ["bocor", 2],
  ["penyok", 2],
  ["tipis", 1.5],
  ["menerawang", 1.5],
  ["lama", 1.5],
  ["buruk", 1.5],
  ["salah", 1.5],
  ["sayang", 0.75],
  ["dipercepat", 0.75],
];

const POSITIVE_PHRASES: WeightedPhrase[] = [
  ["melebihi ekspektasi", 2.5],
  ["bintang lima", 2.5],
  ["sangat direkomendasikan", 2.5],
  ["direkomendasikan", 2],
  ["tidak ada masalah", 2],
  ["sangat baik", 2],
  ["langganan", 2],
  ["original", 1.5],
  ["berfungsi", 1.5],
  ["bagus", 1.5],
  ["enak", 1.5],
  ["nyaman", 1.25],
  ["kokoh", 1],
  ["rapi", 1],
  ["cepat", 1],
  ["ramah", 1],
  ["informatif", 1],
  ["bersih", 1],
  ["mantap", 1],
  ["awet", 1],
  ["sesuai", 1],
  ["sukses", 1],
  ["pas", 0.75],
  ["cukup oke", 0.75],
  ["oke", 0.5],
];

const NEUTRAL_PHRASES = [
  "standar",
  "biasa saja",
  "tidak ada yang spesial",
  "cukup oke",
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^$(){}|[\]\\]/g, "\\$&");
}

function containsPhrase(text: string, phrase: string): boolean {
  const escaped = escapeRegExp(phrase).replace(/\s+/g, "\\s+");
  return new RegExp("(^|[^\\p{L}\\p{N}])" + escaped + "(?=$|[^\\p{L}\\p{N}])", "iu").test(text);
}

function scorePhrases(text: string, phrases: WeightedPhrase[]): number {
  return phrases.reduce(
    (score, [phrase, weight]) => score + (containsPhrase(text, phrase) ? weight : 0),
    0,
  );
}

function classifySentiment(text: string): ReviewAnalysis["sentiment"] {
  const normalized = text.toLocaleLowerCase("id-ID");
  const positiveText = ["tidak sesuai", "tidak berfungsi", "tidak original", "kurang ramah"]
    .reduce((value, phrase) => value.replaceAll(phrase, " "), normalized);
  const positive = scorePhrases(positiveText, POSITIVE_PHRASES);
  const negative = scorePhrases(normalized, NEGATIVE_PHRASES);
  const hasNeutralCue = NEUTRAL_PHRASES.some((phrase) => containsPhrase(normalized, phrase));

  if (hasNeutralCue && negative < 2.5 && positive <= 4) return "NEUTRAL";
  if (positive > 0 && negative > 0) {
    const difference = Math.abs(positive - negative);
    const ratio = Math.max(positive, negative) / Math.min(positive, negative);
    if (difference <= 1.5 || ratio < 1.75) return "NEUTRAL";
  }
  if (positive - negative >= 1) return "POSITIVE";
  if (negative - positive >= 1) return "NEGATIVE";
  return "NEUTRAL";
}

function classifyTopic(text: string): string {
  const normalized = text.toLocaleLowerCase("id-ID");
  const has = (...phrases: string[]) => phrases.some((phrase) => containsPhrase(normalized, phrase));
  const food = has("makanan", "makanannya", "porsi", "rasa", "menu");
  const shipping = has("pengiriman", "kurir", "ekspedisi", "resi", "diantar", "mengantar");
  const service = has("penjual", "admin", "respon", "chat", "pertanyaan", "pelayanan");

  if (food) return "Makanan & tempat";
  if (shipping && service) return "Pengiriman & layanan";
  if (shipping) return "Pengiriman & kurir";
  if (service) return "Layanan penjual";
  if (has("tidak sesuai", "ukuran", "warna", "foto", "deskripsi", "etalase")) {
    return "Kesesuaian produk";
  }
  if (has("kemasan", "packing", "segel", "box")) return "Kemasan produk";
  if (has("kualitas", "bahan", "jahitan", "produk", "barang")) return "Kualitas produk";
  return "Pengalaman pelanggan";
}

function classifyReview(text: string, id: number): ReviewAnalysis {
  return {
    id,
    text,
    sentiment: classifySentiment(text),
    topic: classifyTopic(text),
    confidence: null,
  };
}

function percentage(part: number, total: number): number {
  return Math.round((part / total) * 100);
}

export function createFallbackAnalysis(reviews: string[]): Analysis {
  const classified = reviews.map((review, index) => classifyReview(review, index + 1));
  const positiveCount = classified.filter((review) => review.sentiment === "POSITIVE").length;
  const negativeCount = classified.filter((review) => review.sentiment === "NEGATIVE").length;
  const positive = percentage(positiveCount, classified.length);
  const negative = percentage(negativeCount, classified.length);
  const neutral = 100 - positive - negative;
  const firstComplaint = classified.find((review) => review.sentiment === "NEGATIVE");
  const firstPraise = classified.find((review) => review.sentiment === "POSITIVE");

  return {
    executiveSummary:
      "Hasil ini dibuat dengan analisis lokal berbasis frasa bahasa Indonesia karena layanan AI belum tersedia. Gunakan sebagai indikasi awal, bukan keputusan final.",
    healthScore: Math.max(0, Math.min(100, positive + Math.round(neutral * 0.5))),
    sentiment: { positive, neutral, negative },
    complaints: firstComplaint
      ? [
          {
            topic: firstComplaint.topic,
            mentions: negativeCount,
            impact: negative >= 30 ? "HIGH" : "MEDIUM",
            quote: firstComplaint.text,
          },
        ]
      : [],
    praises: firstPraise
      ? [
          {
            topic: firstPraise.topic,
            mentions: positiveCount,
            quote: firstPraise.text,
          },
        ]
      : [],
    recommendations: [
      {
        title: "Verifikasi temuan dengan tim operasional",
        description:
          "Tinjau ulasan yang ditandai negatif dan kelompokkan penyebabnya sebelum menentukan tindakan perbaikan.",
        priority: negative >= 30 ? "HIGH" : "MEDIUM",
        expectedImpact: "Menghasilkan prioritas tindak lanjut yang lebih akurat.",
      },
    ],
    reviews: classified,
  };
}
