import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "ArcheryFi",
  description: "Next-gen Web3 Archery Game",
  other: {
    "base:app_id": "6a620a2f078f6baf9ef304a9"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // We lock the theme to 'dark' for the MVP to fit the Cyberpunk/Fantasy theme
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${outfit.variable}`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
