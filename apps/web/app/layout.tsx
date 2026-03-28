import type { Metadata } from "next";
import { DM_Sans, Libre_Baskerville } from "next/font/google";

import "./globals.css";

const serif = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-atlas-serif",
});

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-atlas-sans",
});

export const metadata: Metadata = {
  title: "Better Forge",
  description:
    "Better Forge is a single-page Hypixel SkyBlock forge profit helper.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={`${serif.variable} ${sans.variable}`} lang="en">
      <body className="min-h-screen bg-[var(--bg)] font-[family-name:var(--font-atlas-sans)] text-[var(--text-main)] antialiased">
        {children}
      </body>
    </html>
  );
}
