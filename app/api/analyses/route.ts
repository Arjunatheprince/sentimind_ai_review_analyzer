import { NextResponse } from "next/server";

import { createFallbackAnalysis } from "@/lib/analysis/fallback";
import { analyzeWithGemini } from "@/lib/analysis/gemini";
import { checkRateLimit, rateLimitHeaders } from "@/lib/api/rate-limit";
import {
  analyzeRequestSchema,
  type AnalyzeResponse,
  type ApiError,
} from "@/lib/analysis/schema";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse<AnalyzeResponse | ApiError>> {
  const rateLimit = await checkRateLimit(request, "analysis");
  if (!rateLimit.success) {
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMITED",
          message: "Terlalu banyak permintaan analisis. Silakan coba lagi sebentar lagi.",
        },
      },
      { status: 429, headers: rateLimitHeaders(rateLimit) },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Body permintaan harus berupa JSON yang valid.",
        },
      },
      { status: 422 },
    );
  }

  const parsed = analyzeRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Masukkan minimal satu ulasan yang valid.",
        },
      },
      { status: 422 },
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      data: createFallbackAnalysis(parsed.data.reviews),
      meta: { source: "local-fallback" },
    });
  }

  try {
    const analysis = await analyzeWithGemini(parsed.data.reviews, apiKey);
    return NextResponse.json({ data: analysis, meta: { source: "gemini" } });
  } catch (error) {
    console.error("Gemini analysis failed", error);
    return NextResponse.json({
      data: createFallbackAnalysis(parsed.data.reviews),
      meta: { source: "local-fallback" },
    });
  }
}
