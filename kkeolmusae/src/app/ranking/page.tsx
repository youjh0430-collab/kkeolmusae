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
