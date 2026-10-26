import { z } from "zod";

export const sentimentSchema = z.enum(["POSITIVE", "NEUTRAL", "NEGATIVE"]);
export const impactSchema = z.enum(["HIGH", "MEDIUM", "LOW"]);
export const prioritySchema = z.enum(["HIGH", "MEDIUM", "LOW"]);

export const reviewAnalysisSchema = z.object({
  id: z.number().int().positive(),
  text: z.string().min(1).max(3_000),
  sentiment: sentimentSchema,
  topic: z.string().min(1).max(120),
  confidence: z.number().min(0).max(100).nullable(),
});

export const analysisSchema = z
  .object({
    executiveSummary: z.string().min(1).max(2_000),
    healthScore: z.number().int().min(0).max(100),
    sentiment: z.object({
      positive: z.number().int().min(0).max(100),
      neutral: z.number().int().min(0).max(100),
      negative: z.number().int().min(0).max(100),
    }),
    complaints: z.array(
      z.object({
        topic: z.string().min(1).max(120),
        mentions: z.number().int().nonnegative(),
        impact: impactSchema,
        quote: z.string().min(1).max(500),
      }),
    ).max(6),
    praises: z.array(
      z.object({
        topic: z.string().min(1).max(120),
        mentions: z.number().int().nonnegative(),
        quote: z.string().min(1).max(500),
      }),
    ).max(6),
    recommendations: z.array(
      z.object({
        title: z.string().min(1).max(160),
        description: z.string().min(1).max(800),
        priority: prioritySchema,
        expectedImpact: z.string().min(1).max(300),
      }),
    ).max(6),
    reviews: z.array(reviewAnalysisSchema).min(1).max(100),
  })
  .strict()
  .refine(
    ({ sentiment }) =>
      sentiment.positive + sentiment.neutral + sentiment.negative === 100,
    {
      message: "Persentase sentimen harus berjumlah 100",
      path: ["sentiment"],
    },
  );

export const analyzeRequestSchema = z.object({
  reviews: z
    .array(z.string().max(3_000))
    .transform((reviews) => reviews.map((review) => review.trim()).filter(Boolean))
    .refine((reviews) => reviews.length >= 1, "Minimal satu ulasan diperlukan")
    .refine((reviews) => reviews.length <= 100, "Maksimal 100 ulasan per analisis"),
});

export const replyRequestSchema = z.object({
  review: reviewAnalysisSchema,
});

export type Analysis = z.infer<typeof analysisSchema>;
export type ReviewAnalysis = z.infer<typeof reviewAnalysisSchema>;
export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;

export type ApiError = {
  error: {
    code: "VALIDATION_ERROR" | "RATE_LIMITED" | "AI_UNAVAILABLE" | "SERVER_ERROR";
    message: string;
  };
};

export type AnalyzeResponse = {
  data: Analysis;
  meta: {
    source: "gemini" | "local-fallback";
  };
};
