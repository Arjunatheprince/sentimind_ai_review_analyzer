"use client";

import { CheckCircle2, CircleDotDashed } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import type { Analysis } from "@/lib/analysis/schema";

type AnalysisSummaryProps = {
  analysis: Analysis | null;
  source: "gemini" | "local-fallback" | null;
  isLoading: boolean;
};

const SENTIMENT = [
  { key: "positive", label: "Positif", color: "#176b5b" },
  { key: "neutral", label: "Netral", color: "#f2c94c" },
  { key: "negative", label: "Negatif", color: "#d86635" },
] as const;

export function AnalysisSummary({ analysis, source, isLoading }: AnalysisSummaryProps) {
  if (isLoading) {
    return (
      <section aria-busy="true" aria-label="Analisis sedang berlangsung" className="surface card-border min-h-80 animate-pulse rounded-2xl p-6">
        <div className="h-4 w-32 rounded bg-black/10" />
        <div className="mt-5 h-12 w-4/5 rounded bg-black/10" />
        <div className="mt-8 h-40 rounded-xl bg-black/5" />
      </section>
    );
  }

  if (!analysis) {
    return (
      <section className="surface card-border flex min-h-80 flex-col items-center justify-center rounded-2xl p-8 text-center">
        <CircleDotDashed aria-hidden="true" className="size-10 text-[var(--teal)]" />
        <h2 className="font-display mt-4 text-2xl font-semibold">Siap membaca sinyal pelanggan</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">Masukkan ulasan secara manual atau unggah file CSV/TXT, lalu jalankan analisis.</p>
      </section>
    );
  }

  const chartData = SENTIMENT.map((item) => ({
    name: item.label,
    value: analysis.sentiment[item.key],
    color: item.color,
  }));
  const healthLabel = analysis.healthScore >= 75 ? "Sehat" : analysis.healthScore >= 55 ? "Perlu perhatian" : "Berisiko";

  return (
    <section aria-labelledby="summary-title" className="surface card-border rounded-2xl p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--line)] pb-5">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-[var(--orange)]">Ringkasan eksekutif</p>
          <h2 id="summary-title" className="font-display text-2xl font-semibold">Suara pelanggan, diringkas.</h2>
          <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${source === "gemini" ? "bg-[var(--teal-soft)] text-[var(--teal)]" : "bg-[#f5eab9] text-[#6d5811]"}`}>
            {source === "gemini" ? "Dianalisis dengan Gemini" : "Analisis lokal · heuristik"}
          </span>
        </div>
        <div className="rounded-xl bg-[var(--ink)] px-4 py-3 text-white">
          <span className="block text-[10px] font-bold uppercase tracking-widest text-white/60">Skor kesehatan</span>
          <span className="font-display text-3xl font-semibold">{analysis.healthScore}</span>
          <span className="ml-2 text-xs text-white/70">{healthLabel}</span>
        </div>
      </div>

      <p className="mt-5 max-w-3xl text-sm leading-7 text-[var(--muted)]">{analysis.executiveSummary}</p>

      <div className="mt-4 grid items-center gap-4 sm:grid-cols-[180px_1fr]">
        <div className="h-44" aria-label="Diagram distribusi sentimen">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} innerRadius={48} outerRadius={72} dataKey="value" paddingAngle={3}>
                {chartData.map((entry) => <Cell key={entry.name} fill={entry.color} stroke="none" />)}
              </Pie>
              <Tooltip formatter={(value) => [`${value}%`, "Proporsi"]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-3">
          {SENTIMENT.map((item) => (
            <div key={item.key}>
              <div className="mb-1 flex justify-between text-sm"><span>{item.label}</span><strong>{analysis.sentiment[item.key]}%</strong></div>
              <div className="h-2 overflow-hidden rounded-full bg-black/8"><div className="h-full rounded-full" style={{ width: `${analysis.sentiment[item.key]}%`, background: item.color }} /></div>
            </div>
          ))}
          <p className="flex items-center gap-1.5 pt-2 text-xs text-[var(--muted)]"><CheckCircle2 aria-hidden="true" className="size-4 text-[var(--teal)]" /> Total persentase tervalidasi 100%</p>
        </div>
      </div>
    </section>
  );
}
