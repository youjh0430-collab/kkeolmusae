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
