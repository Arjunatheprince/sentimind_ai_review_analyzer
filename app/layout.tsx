import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";

import "./globals.css";

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Sentimind — AI Review Intelligence",
  description: "Analisis sentimen ulasan pelanggan Indonesia dengan Gemini, insight prioritas, dan draf balasan siap pakai.",
  applicationName: "Sentimind",
  openGraph: {
    title: "Sentimind — AI Review Intelligence",
    description: "Ubah ulasan pelanggan menjadi insight dan tindakan yang terukur.",
    type: "website",
    locale: "id_ID",
    images: [{ url: "/sentimind-og.png", width: 1730, height: 909, alt: "Sentimind AI Review Intelligence" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sentimind — AI Review Intelligence",
    description: "Ubah ulasan pelanggan menjadi insight dan tindakan yang terukur.",
    images: ["/sentimind-og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className={`${sans.variable} ${display.variable}`}>{children}</body>
    </html>
  );
}
