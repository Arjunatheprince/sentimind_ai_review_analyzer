import { ArrowUpRight, MessageSquareWarning, ThumbsUp } from "lucide-react";

import type { Analysis } from "@/lib/analysis/schema";

export function InsightsGrid({ analysis }: { analysis: Analysis }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section aria-labelledby="complaints-title" className="surface card-border rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-[var(--orange-soft)] p-2 text-[var(--orange)]"><MessageSquareWarning aria-hidden="true" className="size-5" /></span>
          <div><p className="text-xs font-bold uppercase tracking-widest text-[var(--orange)]">Friction</p><h2 id="complaints-title" className="font-display text-xl font-semibold">Keluhan utama</h2></div>
        </div>
        <div className="mt-4 divide-y divide-[var(--line)]">
          {analysis.complaints.length === 0 ? <p className="py-5 text-sm text-[var(--muted)]">Belum ada keluhan dominan.</p> : analysis.complaints.map((item) => (
            <article key={`${item.topic}-${item.quote}`} className="py-4 first:pt-1">
              <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-bold">{item.topic}</h3><span className="shrink-0 rounded-full bg-[var(--orange-soft)] px-2 py-1 text-[10px] font-bold">{item.mentions} sebutan · {item.impact}</span></div>
              <blockquote className="mt-2 border-l-2 border-[var(--orange)] pl-3 text-sm italic leading-6 text-[var(--muted)]">“{item.quote}”</blockquote>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="praises-title" className="surface card-border rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-[var(--teal-soft)] p-2 text-[var(--teal)]"><ThumbsUp aria-hidden="true" className="size-5" /></span>
          <div><p className="text-xs font-bold uppercase tracking-widest text-[var(--teal)]">Momentum</p><h2 id="praises-title" className="font-display text-xl font-semibold">Hal yang disukai</h2></div>
        </div>
        <div className="mt-4 divide-y divide-[var(--line)]">
          {analysis.praises.length === 0 ? <p className="py-5 text-sm text-[var(--muted)]">Belum ada pujian dominan.</p> : analysis.praises.map((item) => (
            <article key={`${item.topic}-${item.quote}`} className="py-4 first:pt-1">
              <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-bold">{item.topic}</h3><span className="shrink-0 rounded-full bg-[var(--teal-soft)] px-2 py-1 text-[10px] font-bold">{item.mentions} sebutan</span></div>
              <blockquote className="mt-2 border-l-2 border-[var(--teal)] pl-3 text-sm italic leading-6 text-[var(--muted)]">“{item.quote}”</blockquote>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="actions-title" className="card-border rounded-2xl bg-[var(--ink)] p-5 text-white lg:col-span-2">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-[var(--yellow)]">Action board</p><h2 id="actions-title" className="font-display mt-1 text-2xl font-semibold">Dari insight menjadi tindakan</h2></div><p className="max-w-md text-xs leading-5 text-white/60">Prioritas dibuat dari pola ulasan. Validasi dengan data operasional sebelum mengambil keputusan besar.</p></div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {analysis.recommendations.map((item, index) => (
            <article key={item.title} className="rounded-xl border border-white/15 bg-white/5 p-4">
              <div className="flex justify-between gap-3"><span className="text-xs font-bold text-[var(--yellow)]">0{index + 1}</span><span className="text-[10px] font-bold uppercase tracking-wider text-white/60">{item.priority}</span></div>
              <h3 className="mt-4 font-bold">{item.title}</h3><p className="mt-2 text-sm leading-6 text-white/65">{item.description}</p>
              <p className="mt-4 flex items-start gap-1.5 border-t border-white/10 pt-3 text-xs text-[var(--yellow)]"><ArrowUpRight aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />{item.expectedImpact}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
