import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

// Devanagari is served by the OS font (Nirmala UI / Kohinoor / system Noto) —
// see globals.css. The Google-subsetted Noto webfont mis-shaped the ष्ट्र
// conjunct (र detached), so we intentionally do NOT load it.
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "महसूल संकेत | Mahasul Sanket",
  description:
    "महाराष्ट्र महसूल विभाग — AI ज्ञान सहाय्यक | Maharashtra Revenue Department AI Knowledge Assistant",
  applicationName: "Mahasul Sanket",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#1a5c38",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="mr" suppressHydrationWarning
      className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
