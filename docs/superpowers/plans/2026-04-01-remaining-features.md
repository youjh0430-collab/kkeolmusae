# 껄무새 남은 기능 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** /ranking, /history 페이지 + 소셜 로그인 + 랜딩 랭킹 실데이터 연결을 구현한다.

**Architecture:** 모든 페이지는 Server Component에서 supabaseAdmin으로 데이터를 조회하고, 인터랙션이 필요한 부분만 Client Component로 분리한다. 소셜 로그인은 Supabase Auth OAuth (Google + Kakao)를 사용하며, 로그인 상태는 supabaseClient.auth로 관리한다.

**Tech Stack:** Next.js 16.2.2 (App Router), Supabase (Auth + PostgreSQL), TailwindCSS 4, lucide-react

**기존 파일 구조:**
```
src/
├── app/
│   ├── api/simulate/route.ts      (시뮬레이션 API)
│   ├── result/[id]/page.tsx       (결과 서버)
│   ├── result/[id]/ResultClient.tsx (결과 클라이언트)
│   ├── simulate/page.tsx          (3단계 위저드)
│   ├── layout.tsx                 (루트 레이아웃)
│   ├── page.tsx                   (랜딩)
│   └── globals.css
├── components/
│   ├── ParrotMascot.tsx
│   ├── RankingBoard.tsx           (하드코딩된 랭킹 — 수정 대상)
│   ├── LoginModal.tsx             (이미 존재 — OAuth 호출 포함)
│   └── ResultChart.tsx
├── lib/supabase.ts
└── types/index.ts
```

---

### Task 1: RLS 정책 추가 — simulations 전체 읽기 허용 (랭킹/공유 결과용)

현재 RLS는 `auth.uid() = user_id or user_id is null`이므로, 비로그인 유저가 다른 사람의 시뮬레이션(결과 공유 링크, 랭킹)을 조회할 수 없다. 랭킹 페이지와 결과 공유를 위해 select 정책을 추가한다.

**주의:** 이 작업은 Supabase MCP `execute_sql`로 실행한다.

- [ ] **Step 1: simulations 테이블에 public select 정책 추가**

```sql
-- 누구나 모든 시뮬레이션 결과를 읽을 수 있도록 허용 (랭킹, 결과 공유)
create policy "simulations_select_public" on simulations
  for select using (true);
```

Supabase MCP `execute_sql`로 실행한다.

- [ ] **Step 2: 기존 simulations_select_own 정책 제거**

public select 정책이 있으므로 기존 제한적 정책은 불필요하다.

```sql
drop policy "simulations_select_own" on simulations;
```

---

### Task 2: /ranking 페이지 — 후회 랭킹

**Files:**
- Create: `src/app/ranking/page.tsx`

이 페이지는 Server Component로, simulations 테이블에서 stock_name별로 집계해 평균 수익률이 높은 종목을 랭킹으로 보여준다.

- [ ] **Step 1: `src/app/ranking/page.tsx` 작성**

```tsx
import Link from "next/link";
import { ChevronLeft, Trophy } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";
import ParrotMascot from "@/components/ParrotMascot";

interface RankingRow {
  stock_name: string;
  stock_ticker: string;
  avg_return: number;
  total_simulations: number;
  total_profit: number;
}

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  // stock_name별 집계 — Supabase에서는 RPC나 raw SQL이 안 되므로
  // 전체 시뮬레이션을 가져와서 JS로 집계한다.
  // 데이터가 수천 건 이하라면 충분히 실용적이다.
  const { data: simulations } = await supabaseAdmin
    .from("simulations")
    .select("stock_name, stock_ticker, return_rate, profit_amount")
    .order("created_at", { ascending: false })
    .limit(1000);

  const grouped = new Map<string, { ticker: string; returns: number[]; profits: number[] }>();

  for (const sim of simulations ?? []) {
    const key = sim.stock_name;
    if (!grouped.has(key)) {
      grouped.set(key, { ticker: sim.stock_ticker, returns: [], profits: [] });
    }
    const g = grouped.get(key)!;
    g.returns.push(Number(sim.return_rate));
    g.profits.push(Number(sim.profit_amount));
  }

  const ranking: RankingRow[] = Array.from(grouped.entries())
    .map(([name, g]) => ({
      stock_name: name,
      stock_ticker: g.ticker,
      avg_return: g.returns.reduce((a, b) => a + b, 0) / g.returns.length,
      total_simulations: g.returns.length,
      total_profit: g.profits.reduce((a, b) => a + b, 0),
    }))
    .sort((a, b) => b.avg_return - a.avg_return);

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-h-screen">
      {/* 헤더 */}
      <div className="px-6 py-4 flex items-center justify-between bg-white shadow-sm z-10">
        <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </Link>
        <span className="font-bold text-gray-800 text-lg">후회 랭킹</span>
        <div className="w-10" />
      </div>

      <main className="flex-1 px-6 py-6 max-w-3xl mx-auto w-full space-y-6">
        {/* 상단 안내 */}
        <div className="flex items-center space-x-3">
          <ParrotMascot className="flex-shrink-0" />
          <div className="bg-white p-4 rounded-2xl rounded-tl-sm shadow-sm border border-emerald-100">
            <p className="text-gray-800 font-medium text-sm">
              사람들이 가장 후회한 종목들이야~ 살껄~~ 🦜
            </p>
          </div>
        </div>

        {ranking.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">아직 시뮬레이션 데이터가 없어요</p>
            <Link href="/simulate" className="text-primary font-bold mt-2 inline-block hover:underline">
              첫 시뮬레이션 해보기
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {ranking.map((stock, i) => {
              const isProfit = stock.avg_return >= 0;
              return (
                <div
                  key={stock.stock_ticker}
                  className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-emerald-200 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <span className={`font-extrabold text-lg w-8 text-center ${i < 3 ? "text-primary" : "text-gray-400"}`}>
                      {i + 1}
                    </span>
                    <div>
                      <div className="font-bold text-gray-800">{stock.stock_name}</div>
                      <div className="text-xs text-gray-400">{stock.stock_ticker} · {stock.total_simulations}회 시뮬레이션</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold text-lg ${isProfit ? "text-green-600" : "text-red-500"}`}>
                      {isProfit ? "+" : ""}{stock.avg_return.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-400">평균 수익률</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 2: 빌드 확인**

```bash
cd kkeolmusae && npx next build
```

Expected: 빌드 에러 없이 성공.

- [ ] **Step 3: Commit**

```bash
git add src/app/ranking/page.tsx
git commit -m "feat: /ranking 페이지 — 종목별 평균 수익률 랭킹"
```

---

### Task 3: /history 페이지 — 로그인 유저 시뮬레이션 기록

**Files:**
- Create: `src/app/history/page.tsx`
- Create: `src/app/history/HistoryClient.tsx`

Server Component에서는 안내만 렌더링하고, Client Component에서 supabaseClient.auth로 현재 유저를 확인 후 시뮬레이션 기록을 조회한다. 비로그인 시 로그인 유도 UI를 보여준다.

- [ ] **Step 1: `src/app/history/page.tsx` 작성**

```tsx
import HistoryClient from "./HistoryClient";

export default function HistoryPage() {
  return <HistoryClient />;
}
```

- [ ] **Step 2: `src/app/history/HistoryClient.tsx` 작성**

```tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, Clock, LogIn } from "lucide-react";
import { supabaseClient } from "@/lib/supabase";
import type { SimulationResult } from "@/types";
import ParrotMascot from "@/components/ParrotMascot";
import LoginModal from "@/components/LoginModal";

export default function HistoryClient() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<SimulationResult[]>([]);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabaseClient.auth.getSession();
      const uid = session?.user?.id ?? null;
      setUserId(uid);

      if (uid) {
        const { data } = await supabaseClient
          .from("simulations")
          .select("*")
          .eq("user_id", uid)
          .order("created_at", { ascending: false });
        setHistory((data as SimulationResult[]) ?? []);
      }
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-h-screen">
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}

      {/* 헤더 */}
      <div className="px-6 py-4 flex items-center justify-between bg-white shadow-sm z-10">
        <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </Link>
        <span className="font-bold text-gray-800 text-lg">내 시뮬레이션 기록</span>
        <div className="w-10" />
      </div>

      <main className="flex-1 px-6 py-6 max-w-3xl mx-auto w-full">
        {loading ? (
          <div className="text-center py-20 text-gray-400">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p>불러오는 중...</p>
          </div>
        ) : !userId ? (
          /* 비로그인 상태 */
          <div className="text-center py-20">
            <ParrotMascot className="mx-auto mb-4" emotion="sad" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">로그인이 필요해요!</h2>
            <p className="text-gray-500 mb-6 text-sm">로그인하면 시뮬레이션 기록을 저장하고<br />언제든 다시 볼 수 있어요</p>
            <button
              onClick={() => setShowLogin(true)}
              className="bg-primary text-white font-bold py-3 px-8 rounded-2xl inline-flex items-center space-x-2 hover:bg-primary-hover transition-colors"
            >
              <LogIn className="w-5 h-5" />
              <span>로그인하기</span>
            </button>
          </div>
        ) : history.length === 0 ? (
          /* 로그인했지만 기록 없음 */
          <div className="text-center py-20 text-gray-400">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">아직 시뮬레이션 기록이 없어요</p>
            <Link href="/simulate" className="text-primary font-bold mt-2 inline-block hover:underline">
              첫 시뮬레이션 해보기
            </Link>
          </div>
        ) : (
          /* 기록 목록 */
          <div className="space-y-3">
            {history.map((sim) => {
              const isProfit = sim.return_rate >= 0;
              return (
                <Link
                  key={sim.id}
                  href={`/result/${sim.id}`}
                  className="block p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-emerald-200 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-gray-800">
                        {sim.item_name} → {sim.stock_name}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {sim.period_start} ~ {sim.period_end}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold text-lg ${isProfit ? "text-green-600" : "text-red-500"}`}>
                        {isProfit ? "+" : ""}{sim.return_rate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-400">
                        {isProfit ? "+" : ""}{sim.profit_amount.toLocaleString()}원
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 3: 빌드 확인**

```bash
cd kkeolmusae && npx next build
```

- [ ] **Step 4: Commit**

```bash
git add src/app/history/page.tsx src/app/history/HistoryClient.tsx
git commit -m "feat: /history 페이지 — 로그인 유저 시뮬레이션 기록"
```

---

### Task 4: 소셜 로그인 연결 — 네비게이션 바 + Auth 상태 관리

**Files:**
- Create: `src/components/Navbar.tsx`
- Modify: `src/app/layout.tsx` (Navbar 추가)

LoginModal은 이미 `src/components/LoginModal.tsx`에 구현되어 있다. 여기서는 전역 네비게이션 바를 만들어 로그인/로그아웃 버튼과 페이지 이동 링크를 제공한다.

**참고:** Google/Kakao OAuth Provider 설정은 Supabase 대시보드에서 수동으로 해야 한다 (API Key, Secret 등). 여기서는 코드 측 연결만 구현한다.

- [ ] **Step 1: `src/components/Navbar.tsx` 작성**

```tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, Clock, LogIn, LogOut, Menu, X } from "lucide-react";
import { supabaseClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import LoginModal from "@/components/LoginModal";

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabaseClient.auth.getSession();
      setUser(session?.user ?? null);
    };
    getUser();

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabaseClient.auth.signOut();
    setUser(null);
    setMenuOpen(false);
  };

  const navLinks = [
    { href: "/ranking", label: "후회 랭킹", icon: <Trophy className="w-4 h-4" /> },
    { href: "/history", label: "내 기록", icon: <Clock className="w-4 h-4" /> },
  ];

  return (
    <>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      <nav className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        <Link href="/" className="font-extrabold text-xl text-primary tracking-tight">
          🦜 껄무새
        </Link>

        {/* 데스크톱 메뉴 */}
        <div className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center space-x-1.5 text-sm font-semibold transition-colors ${
                pathname === link.href ? "text-primary" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          ))}
          {user ? (
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1.5 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>로그아웃</span>
            </button>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className="flex items-center space-x-1.5 text-sm font-semibold bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary-hover transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>로그인</span>
            </button>
          )}
        </div>

        {/* 모바일 햄버거 */}
        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100">
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* 모바일 드롭다운 */}
      {menuOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 px-6 py-4 space-y-3 sticky top-[57px] z-30">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center space-x-2 py-2 font-semibold ${
                pathname === link.href ? "text-primary" : "text-gray-600"
              }`}
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          ))}
          {user ? (
            <button onClick={handleLogout} className="flex items-center space-x-2 py-2 font-semibold text-gray-600">
              <LogOut className="w-4 h-4" />
              <span>로그아웃</span>
            </button>
          ) : (
            <button
              onClick={() => { setShowLogin(true); setMenuOpen(false); }}
              className="flex items-center space-x-2 py-2 font-semibold text-primary"
            >
              <LogIn className="w-4 h-4" />
              <span>로그인</span>
            </button>
          )}
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: `src/app/layout.tsx` 수정 — Navbar 추가**

기존 layout.tsx의 `<body>` 안에 Navbar를 추가한다:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

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
          {children}
        </div>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: 빌드 확인**

```bash
cd kkeolmusae && npx next build
```

- [ ] **Step 4: Commit**

```bash
git add src/components/Navbar.tsx src/app/layout.tsx
git commit -m "feat: 전역 네비게이션 바 + 로그인/로그아웃 UI"
```

---

### Task 5: 랜딩 페이지 랭킹 실데이터 연결

**Files:**
- Modify: `src/components/RankingBoard.tsx` (하드코딩 → props 기반)
- Modify: `src/app/page.tsx` (Server Component에서 Supabase 조회 후 props 전달)

랜딩 페이지는 Server Component이므로, page.tsx에서 supabaseAdmin으로 simulations를 집계하고 RankingBoard에 props로 넘긴다.

- [ ] **Step 1: `src/components/RankingBoard.tsx` 수정 — props 기반으로 변경**

```tsx
import Link from "next/link";

interface RankingItem {
  stock_name: string;
  avg_return: number;
  total_simulations: number;
}

interface Props {
  ranking: RankingItem[];
}

export default function RankingBoard({ ranking }: Props) {
  return (
    <div className="bg-white rounded-3xl shadow-xl border border-emerald-100 p-6 md:p-8 hover:shadow-2xl transition-shadow w-full h-full">
      <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-6 flex items-center justify-between">
        <span>🏆 가장 후회한 종목</span>
        <Link href="/ranking" className="text-sm text-primary font-semibold hover:underline">
          전체보기
        </Link>
      </h2>

      {ranking.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">아직 시뮬레이션 데이터가 없어요</p>
          <p className="text-xs mt-1">첫 시뮬레이션을 해보세요!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {ranking.slice(0, 5).map((stock, i) => {
            const isProfit = stock.avg_return >= 0;
            return (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 hover:bg-emerald-50 transition-colors cursor-default">
                <div className="flex items-center space-x-4">
                  <span className={`font-extrabold text-lg w-5 ${i < 3 ? "text-primary" : "text-gray-400"}`}>
                    {i + 1}
                  </span>
                  <div>
                    <span className="font-semibold text-gray-800 md:text-lg">{stock.stock_name}</span>
                    <span className="text-xs text-gray-400 ml-2">{stock.total_simulations}회</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold md:text-lg ${isProfit ? "text-green-600" : "text-red-500"}`}>
                    {isProfit ? "+" : ""}{stock.avg_return.toFixed(1)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: `src/app/page.tsx` 수정 — 서버에서 랭킹 데이터 조회**

```tsx
import Link from "next/link";
import ParrotMascot from "@/components/ParrotMascot";
import RankingBoard from "@/components/RankingBoard";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function Home() {
  // simulations에서 종목별 평균 수익률 집계
  const { data: simulations } = await supabaseAdmin
    .from("simulations")
    .select("stock_name, return_rate")
    .order("created_at", { ascending: false })
    .limit(500);

  const grouped = new Map<string, number[]>();
  for (const sim of simulations ?? []) {
    if (!grouped.has(sim.stock_name)) grouped.set(sim.stock_name, []);
    grouped.get(sim.stock_name)!.push(Number(sim.return_rate));
  }

  const ranking = Array.from(grouped.entries())
    .map(([name, returns]) => ({
      stock_name: name,
      avg_return: returns.reduce((a, b) => a + b, 0) / returns.length,
      total_simulations: returns.length,
    }))
    .sort((a, b) => b.avg_return - a.avg_return);

  return (
    <main className="flex-1 flex flex-col pt-16 pb-8 bg-background relative overflow-hidden">
      {/* 장식용 배경 */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-light rounded-full blur-3xl opacity-20 -mr-20 -mt-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-200 rounded-full blur-3xl opacity-20 -ml-20 -mb-20 pointer-events-none" />
      
      <div className="max-w-6xl mx-auto w-full px-6 flex flex-col md:flex-row md:items-center justify-center flex-1 z-10 gap-12 mt-4 md:mt-10">
        
        {/* 좌측: 주요 텍스트 및 시작 버튼 */}
        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left space-y-8">
          <ParrotMascot emotion="excited" />

          <div className="space-y-4">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight tracking-tight break-keep">
              두쫀쿠 지난달에 안먹고<br/>
              <span className="text-primary">삼성전자</span> 샀으면<br/>
              수익률 얼마였을까?
            </h1>
            <p className="text-gray-500 font-medium md:text-xl mt-4">
              살 껄~ 후회되는 순간을 직접 수익률로 확인해보세요!
            </p>
          </div>

          <div className="w-full max-w-sm pt-4 md:pt-8">
            <Link href="/simulate" className="block w-full">
              <button className="w-full bg-primary hover:bg-primary-hover text-white md:text-xl text-lg font-bold py-4 md:py-5 rounded-2xl shadow-lg transition-transform hover:scale-[1.02] active:scale-95 flex items-center justify-center space-x-2">
                <span>얼마나 배아플지 수익률 확인하기</span>
                <span>💸</span>
              </button>
            </Link>
          </div>
        </div>

        {/* 우측: 랭킹 프리뷰 카드 */}
        <div className="flex-1 w-full max-w-md mx-auto md:max-w-lg mt-12 md:mt-0">
          <RankingBoard ranking={ranking} />
        </div>

      </div>
    </main>
  );
}
```

- [ ] **Step 3: 빌드 확인**

```bash
cd kkeolmusae && npx next build
```

- [ ] **Step 4: Commit**

```bash
git add src/components/RankingBoard.tsx src/app/page.tsx
git commit -m "feat: 랜딩 랭킹 실데이터 연결 — 하드코딩 제거"
```

---

### Task 6: Supabase OAuth Provider 설정 안내

이 작업은 코드가 아니라 Supabase 대시보드 설정이 필요하다. 코드 측 OAuth 호출은 LoginModal.tsx에 이미 구현되어 있으므로, 대시보드 설정만 하면 동작한다.

- [ ] **Step 1: Supabase 대시보드에서 Auth Provider 활성화**

Supabase 대시보드 → Authentication → Providers:

**Google:**
1. Google Cloud Console에서 OAuth 2.0 Client ID 생성
2. Authorized redirect URI: `https://nwmpmbrcuixwumkdgfug.supabase.co/auth/v1/callback`
3. Client ID, Client Secret을 Supabase Provider 설정에 입력

**Kakao:**
1. Kakao Developers에서 앱 생성
2. 카카오 로그인 활성화 + Redirect URI 등록: `https://nwmpmbrcuixwumkdgfug.supabase.co/auth/v1/callback`
3. REST API 키를 Supabase Provider 설정에 입력

- [ ] **Step 2: LoginModal의 redirectTo를 Auth 콜백과 연결 확인**

`src/components/LoginModal.tsx`의 `redirectTo: window.location.origin`이 올바른지 확인. OAuth 후 원래 페이지로 돌아온다.

---

## 실행 순서 요약

| 순서 | Task | 의존성 |
|------|------|--------|
| 1 | RLS 정책 추가 | 없음 |
| 2 | /ranking 페이지 | Task 1 (public select 필요) |
| 3 | /history 페이지 | 없음 |
| 4 | Navbar + Auth UI | 없음 |
| 5 | 랜딩 랭킹 실데이터 연결 | Task 1 |
| 6 | Supabase OAuth 설정 | 대시보드 수동 작업 |

Task 2-5는 Task 1 이후 병렬 실행 가능하다.
