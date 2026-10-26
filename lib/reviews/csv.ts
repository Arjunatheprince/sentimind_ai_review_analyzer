import Papa from "papaparse";

import type { ReviewAnalysis } from "@/lib/analysis/schema";

const REVIEW_HEADERS = new Set([
  "review",
  "reviews",
  "ulasan",
  "text",
  "teks",
  "comment",
  "komentar",
]);

function normalize(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function parseReviewFile(content: string): string[] {
  const parsed = Papa.parse<string[]>(content, {
    skipEmptyLines: "greedy",
  });

  if (parsed.data.length === 0) {
    return [];
  }

  const rows = parsed.data;
  const firstRow = rows[0] ?? [];
  const reviewColumn = firstRow.findIndex((cell) =>
    REVIEW_HEADERS.has(normalize(cell).toLowerCase()),
  );
  const startIndex = reviewColumn >= 0 ? 1 : 0;
  const columnIndex = reviewColumn >= 0 ? reviewColumn : 0;

  return rows
    .slice(startIndex)
    .map((row) => normalize(row[columnIndex]))
    .filter((review) => review.length >= 3)
    .slice(0, 100);
}

function neutralizeSpreadsheetFormula(value: string): string {
  return /^[\s]*[=+\-@]/.test(value) ? `'${value}` : value;
}

const SENTIMENT_LABELS: Record<ReviewAnalysis["sentiment"], string> = {
  POSITIVE: "Positif",
  NEUTRAL: "Netral",
  NEGATIVE: "Negatif",
};

export function exportReviewsToCsv(
  reviews: ReviewAnalysis[],
  replies: Record<number, string> = {},
): string {
  const table = Papa.unparse(
    reviews.map((review) => ({
      No: review.id,
      Ulasan: neutralizeSpreadsheetFormula(review.text),
      Sentimen: SENTIMENT_LABELS[review.sentiment],
      Topik: neutralizeSpreadsheetFormula(review.topic),
      "Tingkat Keyakinan": review.confidence === null
        ? "Tidak tersedia"
        : `${review.confidence}%`,
      "Draf Balasan": replies[review.id]
        ? neutralizeSpreadsheetFormula(replies[review.id])
        : "Belum dibuat",
    })),
    { delimiter: ";", newline: "\r\n" },
  );

  return `\uFEFFsep=;\r\n${table}`;
}
