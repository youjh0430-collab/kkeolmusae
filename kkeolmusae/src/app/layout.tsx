import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Link from "next/link";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "껄무새 시뮬레이터",
  description: "살 껄~ 후회되는 순간을 수익률로 보여주는 주식 시뮬레이터",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans bg-gray-50 text-foreground flex flex-col">
        <div className="w-full min-h-screen flex flex-col">
          <Navbar />
          <div className="flex-1">{children}</div>
          {/* 푸터 */}
          <footer className="bg-white border-t border-gray-100 px-6 py-6 mt-auto">
            <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
              <p>&copy; 2026 껄무새 · PM AI Lab</p>
              <div className="flex items-center gap-4">
                <span>Next.js + Supabase + Yahoo Finance</span>
                <Link href="/about" className="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors">
                  프로젝트 소개
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
