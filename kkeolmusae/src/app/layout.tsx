import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

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
        {/* 데스크톱/태블릿/모바일에 모두 대응하는 유연한 레이아웃 */}
        <div className="w-full min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
