"use client";

import { Check, Copy, MessageCircleReply, Search } from "lucide-react";
import { useMemo, useState } from "react";

import type { Analysis, ReviewAnalysis } from "@/lib/analysis/schema";

type ReviewsSectionProps = {
  reviews: Analysis["reviews"];
  replies: Record<number, string>;
  generatingId: number | null;
  onGenerateReply: (review: ReviewAnalysis) => void;
};

const LABELS = { POSITIVE: "Positif", NEUTRAL: "Netral", NEGATIVE: "Negatif" } as const;

export function ReviewsSection({ reviews, replies, generatingId, onGenerateReply }: ReviewsSectionProps) {
  const [filter, setFilter] = useState<"ALL" | ReviewAnalysis["sentiment"]>("ALL");
  const [query, setQuery] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const filtered = useMemo(() => reviews.filter((review) => {
    const matchesFilter = filter === "ALL" || review.sentiment === filter;
    const needle = query.trim().toLowerCase();
    return matchesFilter && (!needle || `${review.text} ${review.topic}`.toLowerCase().includes(needle));
  }), [filter, query, reviews]);

  async function copyReply(id: number, reply: string) {
    try {
      await navigator.clipboard.writeText(reply);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1_500);
    } catch {
      setCopiedId(null);
    }
  }

  return (
    <section aria-labelledby="reviews-title" className="surface card-border rounded-2xl p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div><p className="text-xs font-bold uppercase tracking-widest text-[var(--teal)]">Review explorer</p><h2 id="reviews-title" className="font-display mt-1 text-2xl font-semibold">Bedah ulasan satu per satu</h2></div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative"><span className="sr-only">Cari ulasan</span><Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari topik atau kata…" className="w-full rounded-lg border border-[var(--line)] bg-white/70 py-2 pl-9 pr-3 text-sm outline-none focus:border-[var(--teal)] sm:w-52" /></label>
          <div className="flex rounded-lg border border-[var(--line)] bg-white/70 p-1" aria-label="Filter sentimen">
            {(["ALL", "NEGATIVE", "NEUTRAL", "POSITIVE"] as const).map((value) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={`rounded-md px-2.5 py-1.5 text-xs font-bold ${filter === value ? "bg-[var(--ink)] text-white" : "text-[var(--muted)] hover:bg-black/5"}`}>{value === "ALL" ? "Semua" : LABELS[value]}</button>)}
          </div>
        </div>
      </div>

      <p role="status" className="mt-4 text-xs text-[var(--muted)]">Menampilkan {filtered.length} dari {reviews.length} ulasan</p>
      <div className="mt-3 divide-y divide-[var(--line)]">
        {filtered.length === 0 && <p className="py-10 text-center text-sm text-[var(--muted)]">Tidak ada ulasan yang cocok dengan filter.</p>}
        {filtered.map((review) => {
          const reply = replies[review.id];
          return (
            <article key={review.id} className="py-5 first:pt-2">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-xs text-[var(--muted)]">#{review.id}</span><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${review.sentiment === "POSITIVE" ? "bg-[var(--teal-soft)] text-[var(--teal)]" : review.sentiment === "NEGATIVE" ? "bg-[var(--orange-soft)] text-[var(--orange)]" : "bg-[#f5eab9] text-[#6d5811]"}`}>{LABELS[review.sentiment]}</span><span className="rounded-full border border-[var(--line)] px-2.5 py-1 text-[10px] font-bold">{review.topic}</span><span className="text-[10px] text-[var(--muted)]">{review.confidence === null ? "Heuristik" : `${review.confidence}% yakin`}</span></div>
                <button type="button" disabled={generatingId === review.id} onClick={() => onGenerateReply(review)} className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-[var(--line)] bg-white/70 px-3 py-2 text-xs font-bold hover:border-[var(--teal)] hover:text-[var(--teal)] disabled:opacity-50"><MessageCircleReply aria-hidden="true" className="size-4" />{generatingId === review.id ? "Menyusun…" : reply ? "Buat ulang" : "Buat balasan"}</button>
              </div>
              <p className="mt-3 text-sm leading-6">“{review.text}”</p>
              {reply && <div className="mt-3 rounded-xl border-l-4 border-[var(--teal)] bg-[var(--teal-soft)]/60 p-4"><div className="flex items-center justify-between gap-3"><strong className="text-xs uppercase tracking-wider text-[var(--teal)]">Draf balasan</strong><button type="button" onClick={() => copyReply(review.id, reply)} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-bold text-[var(--teal)] hover:bg-white/60">{copiedId === review.id ? <Check aria-hidden="true" className="size-3.5" /> : <Copy aria-hidden="true" className="size-3.5" />}{copiedId === review.id ? "Tersalin" : "Salin"}</button></div><p className="mt-2 text-sm leading-6 text-[#24443b]">{reply}</p></div>}
            </article>
          );
        })}
      </div>
    </section>
  );
}
