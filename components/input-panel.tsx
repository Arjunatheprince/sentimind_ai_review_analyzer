"use client";

import { Download, FileUp, Sparkles } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";


import { parseReviewFile } from "@/lib/reviews/csv";

type InputPanelProps = {
  reviews: string[];

  isAnalyzing: boolean;
  onReviewsChange: (reviews: string[]) => void;
  onAnalyze: () => void;
};

export function InputPanel({
  reviews,

  isAnalyzing,
  onReviewsChange,
  onAnalyze,
}: InputPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const parsed = parseReviewFile(await file.text());
    if (parsed.length === 0) {
      setFileError("Tidak ada kolom review atau baris ulasan yang dapat dibaca.");
      return;
    }

    setFileError(null);
    onReviewsChange(parsed);
  }

  return (
    <section aria-labelledby="input-title" className="surface card-border rounded-2xl p-5 lg:sticky lg:top-24">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-[var(--teal)]">Input data</p>
          <h2 id="input-title" className="font-display text-2xl font-semibold">Apa kata pelanggan?</h2>
        </div>
        <span className="rounded-full bg-[var(--teal-soft)] px-3 py-1 text-xs font-bold text-[var(--teal)]">
          {reviews.length} ulasan
        </span>
      </div>

      <div className="mt-5 rounded-xl border border-[var(--line)] bg-white/55 p-3 text-xs leading-5 text-[var(--muted)]">
        <p><strong className="text-[var(--ink)]">Format data:</strong> TXT berisi satu ulasan per baris, atau CSV dengan nama kolom <code className="rounded bg-black/5 px-1 py-0.5">review</code>.</p>
        <a href="/contoh-ulasan.csv" download className="mt-2 inline-flex items-center gap-1.5 font-bold text-[var(--teal)] hover:underline">
          <Download aria-hidden="true" className="size-3.5" /> Unduh contoh CSV
        </a>
      </div>

      <label htmlFor="reviews" className="mt-5 block text-sm font-bold">
        Satu ulasan per baris
      </label>
      <textarea
        id="reviews"
        rows={11}
        value={reviews.join("\n")}
        onChange={(event) => onReviewsChange(event.target.value.split(/\r?\n/))}
        placeholder="Tempel ulasan dari marketplace di sini…"
        className="mt-2 w-full resize-y rounded-xl border border-[var(--line)] bg-white/70 p-3 text-sm leading-6 shadow-inner outline-none transition focus:border-[var(--teal)]"
      />

      <div className="mt-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-bold text-[var(--teal)] hover:bg-[var(--teal-soft)]"
        >
          <FileUp aria-hidden="true" className="size-4" /> Unggah CSV/TXT
        </button>
        <input ref={fileRef} className="sr-only" type="file" accept=".csv,.txt,text/csv,text/plain" onChange={handleFile} />
        <span className="text-xs text-[var(--muted)]">Maks. 100 ulasan</span>
      </div>

      {fileError && <p role="alert" className="mt-2 text-sm font-medium text-red-700">{fileError}</p>}

      <button
        type="button"
        disabled={isAnalyzing || reviews.every((review) => review.trim().length === 0)}
        onClick={onAnalyze}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--ink)] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[var(--teal)] disabled:opacity-50"
      >
        <Sparkles aria-hidden="true" className={`size-4 ${isAnalyzing ? "animate-pulse" : ""}`} />
        {isAnalyzing ? "Membaca pola ulasan…" : "Analisis ulasan"}
      </button>
    </section>
  );
}
