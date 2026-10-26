import { NextResponse } from "next/server";

import { createReplyWithGemini } from "@/lib/analysis/gemini";
import { replyRequestSchema, type ApiError, type ReviewAnalysis } from "@/lib/analysis/schema";
import { checkRateLimit, rateLimitHeaders } from "@/lib/api/rate-limit";

type ReplyResponse = {
  data: { reply: string };
  meta: { source: "gemini" | "local-fallback" };
};

function createLocalReply(review: ReviewAnalysis): string {
  const topic = review.topic.toLowerCase();
  if (review.sentiment === "POSITIVE") {
    return `Terima kasih banyak, Kak, sudah membagikan pengalaman positif mengenai ${topic}. Senang mengetahui produk dan layanan kami sesuai harapan. Kami tunggu pesanan berikutnya!`;
  }

  if (review.sentiment === "NEUTRAL") {
    return `Halo Kak, terima kasih atas masukan mengenai ${topic}. Catatan Kakak akan kami gunakan sebagai bahan evaluasi agar pengalaman berikutnya bisa lebih baik.`;
  }

  return `Halo Kak, terima kasih sudah menyampaikan masukan mengenai ${topic}. Kami mohon maaf atas pengalaman yang kurang nyaman dan akan meneruskan detail ini kepada tim terkait untuk ditinjau. Silakan hubungi admin melalui chat pesanan agar kami dapat membantu memeriksa kasusnya lebih lanjut.`;
}

export async function POST(request: Request): Promise<NextResponse<ReplyResponse | ApiError>> {
  const rateLimit = await checkRateLimit(request, "reply");
  if (!rateLimit.success) {
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMITED",
          message: "Terlalu banyak permintaan balasan. Silakan coba lagi sebentar lagi.",
        },
      },
      { status: 429, headers: rateLimitHeaders(rateLimit) },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    payload = null;
  }

  const parsed = replyRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Data ulasan tidak valid.",
        },
      },
      { status: 422 },
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      data: { reply: createLocalReply(parsed.data.review) },
      meta: { source: "local-fallback" },
    });
  }

  try {
    const reply = await createReplyWithGemini(parsed.data.review, apiKey);
    return NextResponse.json({ data: { reply }, meta: { source: "gemini" } });
  } catch (error) {
    console.error("Gemini reply generation failed", error);
    return NextResponse.json({
      data: { reply: createLocalReply(parsed.data.review) },
      meta: { source: "local-fallback" },
    });
  }
}
