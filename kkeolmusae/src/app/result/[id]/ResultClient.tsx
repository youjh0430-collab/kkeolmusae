"use client";

import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Share2, RefreshCw, Volume2 } from "lucide-react";
import ParrotMascot from "@/components/ParrotMascot";

const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false });
const LineChart = dynamic(() => import("recharts").then((m) => m.LineChart), { ssr: false });
const Line = dynamic(() => import("recharts").then((m) => m.Line), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false });

interface Simulation {
  id: string;
  item_name: string;
  item_price: number;
  period_start: string;
  period_end: string;
  stock_name: string;
  stock_ticker: string;
  buy_price: number;
  current_price: number;
  return_rate: number;
  investment_amount: number;
  profit_amount: number;
}

interface Props {
  simulation: Simulation;
}

function getParrotComment(returnRate: number): { text: string; emotion: "excited" | "mocking" | "sad" | "default" } {
  if (returnRate >= 50) return { text: `살껄~~ 살껄~~ 왜 안 샀어!! 무려 ${returnRate.toFixed(1)}%라고!! 🦜`, emotion: "excited" };
  if (returnRate >= 10) return { text: `쏠쏠했을텐데~ ${returnRate.toFixed(1)}% 수익이라니, 아깝다 아깝다~`, emotion: "mocking" };
  if (returnRate >= -10) return { text: `뭐... 그냥 그랬을 수도 있어~ ${returnRate.toFixed(1)}% 😅`, emotion: "default" };
  return { text: `오히려 다행이야~ 안 샀길 잘했어~ ${returnRate.toFixed(1)}% 🎉`, emotion: "sad" };
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function buildChartData(sim: Simulation) {
  // 실제 히스토리 데이터는 API 응답 시 저장하지 않았으므로,
  // buy_price → current_price 두 점짜리 간략 차트를 보여줍니다.
  return [
    { name: formatDateLabel(sim.period_start), price: Math.round(sim.buy_price) },
    { name: formatDateLabel(sim.period_end), price: Math.round(sim.current_price) },
  ];
}

export default function ResultClient({ simulation: sim }: Props) {
  const router = useRouter();
  const { text: comment, emotion } = getParrotComment(sim.return_rate);
  const isProfit = sim.return_rate >= 0;
  const chartData = buildChartData(sim);

  function speakComment() {
    if (!("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(comment);
    utterance.lang = "ko-KR";
    utterance.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  return (
    <main className="flex-1 overflow-y-auto px-6 py-6 pb-32 space-y-6">

      {/* 요약 카드 */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-center animate-in fade-in slide-in-from-bottom-4">
        <p className="text-gray-500 font-medium text-sm mb-2">
          {sim.item_name} 대신 {sim.stock_name} 샀다면?
        </p>
        <div className={`text-4xl font-extrabold mb-2 ${isProfit ? "text-green-600" : "text-red-500"}`}>
          {isProfit ? "+" : ""}{sim.return_rate.toFixed(1)}%
        </div>
        <div className="text-xl font-bold text-gray-800">
          {isProfit ? "+" : ""}{sim.profit_amount.toLocaleString()}원
        </div>
        <p className="text-xs text-gray-400 mt-2">
          원금 {sim.investment_amount.toLocaleString()}원 기준 ({sim.period_start} ~ {sim.period_end})
        </p>
      </div>

      {/* 매수가 / 현재가 */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 delay-75">
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">매수가</p>
          <p className="font-bold text-gray-800 text-lg">{Math.round(sim.buy_price).toLocaleString()}원</p>
        </div>
        <div className="text-center border-l border-gray-100">
          <p className="text-xs text-gray-400 mb-1">현재가</p>
          <p className={`font-bold text-lg ${isProfit ? "text-green-600" : "text-red-500"}`}>
            {Math.round(sim.current_price).toLocaleString()}원
          </p>
        </div>
      </div>

      {/* 앵무새 코멘트 */}
      <div className="flex items-start space-x-4 animate-in fade-in slide-in-from-bottom-4 delay-100">
        <ParrotMascot emotion={emotion} className="flex-shrink-0" />
        <div className="bg-white p-4 rounded-2xl rounded-tl-sm shadow-sm border border-orange-100 relative flex-1">
          <p className="text-gray-800 font-medium leading-snug">{comment}</p>
          <button
            onClick={speakComment}
            className="mt-3 flex items-center space-x-1 text-primary text-sm font-semibold hover:underline"
          >
            <Volume2 className="w-4 h-4" />
            <span>들어보기 🦜</span>
          </button>
        </div>
      </div>

      {/* 차트 */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4 delay-200">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center justify-between">
          <span>주가 변동</span>
          <span className="text-xs text-gray-400 font-normal">{sim.stock_ticker}</span>
        </h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} tickMargin={10} stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                itemStyle={{ color: "#ff6b35", fontWeight: "bold" }}
                formatter={(v: unknown) => [`${(v as number).toLocaleString()}원`, "주가"]}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke={isProfit ? "#16a34a" : "#ef4444"}
                strokeWidth={3}
                dot={{ r: 4, fill: isProfit ? "#16a34a" : "#ef4444", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 하단 플로팅 액션 */}
      <div className="fixed bottom-0 left-0 right-0 max-w-3xl mx-auto p-6 bg-gradient-to-t from-gray-50 via-gray-50/90 to-transparent">
        <div className="flex space-x-3">
          <button
            onClick={() => router.push("/simulate")}
            className="flex-1 bg-white text-gray-800 border-2 border-gray-200 font-bold py-4 rounded-2xl text-lg flex items-center justify-center space-x-2 hover:bg-gray-50 active:scale-[0.98] transition-all"
          >
            <RefreshCw className="w-5 h-5" />
            <span>다시하기</span>
          </button>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: "껄무새 시뮬레이션 결과", url: window.location.href });
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert("링크가 복사되었습니다!");
              }
            }}
            className="flex-1 bg-primary text-white font-bold py-4 rounded-2xl text-lg flex items-center justify-center space-x-2 shadow-md hover:bg-primary-hover active:scale-[0.98] transition-all"
          >
            <Share2 className="w-5 h-5" />
            <span>결과 공유</span>
          </button>
        </div>
      </div>
    </main>
  );
}
