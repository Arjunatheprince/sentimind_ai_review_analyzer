"use client";

import { Download, FileSpreadsheet, Leaf, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { AnalysisSummary } from "@/components/analysis-summary";
import { InputPanel } from "@/components/input-panel";
import { InsightsGrid } from "@/components/insights-grid";
import { ReviewsSection } from "@/components/reviews-section";

import type { Analysis, AnalyzeResponse, ApiError, ReviewAnalysis } from "@/lib/analysis/schema";
import { exportReviewsToCsv } from "@/lib/reviews/csv";

function downloadFile(content: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function SentimentDashboard() {
  const [reviews, setReviews] = useState<string[]>([]);

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analysisSource, setAnalysisSource] = useState<AnalyzeResponse["meta"]["source"] | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replies, setReplies] = useState<Record<number, string>>({});
  const [generatingId, setGeneratingId] = useState<number | null>(null);

  function handleReviewsChange(nextReviews: string[]) {
    setReviews(nextReviews);

    setAnalysis(null);
    setAnalysisSource(null);

    setReplies({});
    setError(null);
  }

  async function analyze() {
    const usableReviews = reviews.map((review) => review.trim()).filter(Boolean).slice(0, 100);
    setIsAnalyzing(true);
    setError(null);
    try {
      const response = await fetch("/api/analyses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reviews: usableReviews }),
      });
      const body = (await response.json()) as AnalyzeResponse | ApiError;
      if (!response.ok || "error" in body) throw new Error("error" in body ? body.error.message : "Analisis gagal diproses.");
      setAnalysis(body.data);
      setAnalysisSource(body.meta.source);

      setReplies({});
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Tidak dapat menghubungi server.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function generateReply(review: ReviewAnalysis) {
    setGeneratingId(review.id);
    setError(null);
    try {
      const response = await fetch("/api/replies", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ review }),
      });
      const body = await response.json() as { data?: { reply: string }; error?: { message: string } };
      if (!response.ok || !body.data) throw new Error(body.error?.message ?? "Balasan gagal dibuat.");
      setReplies((current) => ({ ...current, [review.id]: body.data!.reply }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Balasan gagal dibuat.");
    } finally {
      setGeneratingId(null);
    }
  }

  function exportJson() {
    if (!analysis) return;
    downloadFile(JSON.stringify(analysis, null, 2), "sentimind-report.json", "application/json");
  }

  function exportCsv() {
    if (!analysis) return;
    downloadFile(exportReviewsToCsv(analysis.reviews, replies), "sentimind-reviews.csv", "text/csv;charset=utf-8");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--line)] bg-[var(--paper)]/90 backdrop-blur md:sticky md:top-0 md:z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[var(--teal)] text-white"><Leaf aria-hidden="true" className="size-5" /></span><div><h1 className="font-display text-xl font-semibold leading-none">Sentimind</h1><p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Customer intelligence</p></div></div>
          <div className="flex items-center gap-2"><button type="button" disabled={!analysis} onClick={exportCsv} className="inline-flex items-center gap-2 rounded-lg border border-[var(--line)] bg-white/60 px-3 py-2 text-xs font-bold hover:border-[var(--teal)] disabled:opacity-40"><FileSpreadsheet aria-hidden="true" className="size-4" /><span className="hidden sm:inline">Ekspor CSV</span></button><button type="button" disabled={!analysis} onClick={exportJson} className="inline-flex items-center gap-2 rounded-lg border border-[var(--line)] bg-white/60 px-3 py-2 text-xs font-bold hover:border-[var(--teal)] disabled:opacity-40"><Download aria-hidden="true" className="size-4" />JSON</button></div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 grid gap-4 border-b border-[var(--line)] pb-7 lg:grid-cols-[1fr_420px] lg:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--orange)]">Dengar · Pahami · Bertindak</p><h2 className="font-display mt-3 max-w-3xl text-balance text-4xl font-semibold leading-[1.08] sm:text-5xl">Temukan cerita di balik setiap ulasan.</h2></div><p className="text-sm leading-6 text-[var(--muted)]">Ubah komentar marketplace menjadi pola sentimen, isu prioritas, dan draf respons yang bisa langsung digunakan tim Anda.</p></div>

        {error && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">{error}</div>}

        <div className="grid items-start gap-5 lg:grid-cols-[380px_1fr]">
          <InputPanel reviews={reviews} isAnalyzing={isAnalyzing} onReviewsChange={handleReviewsChange} onAnalyze={analyze} />
          <div className="space-y-5">
            <AnalysisSummary analysis={analysis} source={analysisSource} isLoading={isAnalyzing} />
            {analysis && <InsightsGrid analysis={analysis} />}
          </div>
        </div>

        {analysis && <div className="mt-5"><ReviewsSection reviews={analysis.reviews} replies={replies} generatingId={generatingId} onGenerateReply={generateReply} /></div>}
      </main>

      <footer className="mt-8 border-t border-[var(--line)]"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 px-4 py-6 text-xs text-[var(--muted)] sm:flex-row sm:px-6 lg:px-8"><span>Sentimind · Analisis ulasan untuk keputusan yang lebih manusiawi.</span><span className="flex items-center gap-1.5"><ShieldCheck aria-hidden="true" className="size-4 text-[var(--teal)]" /> Email dan nomor telepon disamarkan sebelum dikirim ke AI.</span></div></footer>
    </div>
  );
}
