import Link from "next/link";
import ParrotMascot from "@/components/ParrotMascot";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col pt-16 pb-8 bg-background relative overflow-hidden">
      {/* 장식용 배경 */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-light rounded-full blur-3xl opacity-20 -mr-20 -mt-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-200 rounded-full blur-3xl opacity-20 -ml-20 -mb-20 pointer-events-none" />
      
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
                <span>시뮬레이션 시작하기</span>
                <span>💸</span>
              </button>
            </Link>
          </div>
        </div>

        {/* 우측: 랭킹 프리뷰 카드 (데스크톱에서는 나란히 배치) */}
        <div className="flex-1 w-full max-w-md mx-auto md:max-w-lg mt-12 md:mt-0">
          <div className="bg-white rounded-3xl shadow-xl border border-orange-100 p-6 md:p-8 hover:shadow-2xl transition-shadow">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-6 flex items-center justify-between">
              <span>🏆 최근 가장 후회한 종목</span>
            </h2>
            <div className="space-y-4">
              {[
                { name: "삼성전자", return: "+12.5%", profit: "45,000원", rank: 1 },
                { name: "애플 (AAPL)", return: "+4.2%", profit: "12,000원", rank: 2 },
                { name: "비트코인", return: "+34.1%", profit: "180,000원", rank: 3 },
                { name: "테슬라 (TSLA)", return: "+8.7%", profit: "62,000원", rank: 4 },
              ].map((stock) => (
                <div key={stock.rank} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 hover:bg-orange-50 transition-colors cursor-default">
                  <div className="flex items-center space-x-4">
                    <span className="font-extrabold text-primary text-lg w-5">{stock.rank}</span>
                    <span className="font-semibold text-gray-800 md:text-lg">{stock.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600 md:text-lg">{stock.return}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
