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
