"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ParrotMascot from "@/components/ParrotMascot";
import { ChevronRight, ChevronLeft, Edit3, DollarSign, Calendar, TrendingUp, Loader2 } from "lucide-react";

const POPULAR_ITEMS = [
  { name: "아메리카노", price: 4500, emoji: "☕" },
  { name: "치킨", price: 20000, emoji: "🍗" },
  { name: "두쫀쿠", price: 35000, emoji: "🍩" },
  { name: "넷플릭스 구독", price: 17000, emoji: "🎬" },
  { name: "편의점 간식", price: 3000, emoji: "🍫" },
  { name: "택시비", price: 8000, emoji: "🚕" },
];

const POPULAR_STOCKS = [
  { name: "삼성전자", ticker: "005930.KS" },
  { name: "애플 (AAPL)", ticker: "AAPL" },
  { name: "테슬라 (TSLA)", ticker: "TSLA" },
  { name: "엔비디아 (NVDA)", ticker: "NVDA" },
  { name: "카카오", ticker: "035720.KS" },
  { name: "SK하이닉스", ticker: "000660.KS" },
];

const PERIOD_PRESETS = [
  { label: "지난 한 달", months: 1 },
  { label: "3개월 전부터", months: 3 },
  { label: "6개월 전부터", months: 6 },
  { label: "1년 전부터", months: 12 },
];

function getPresetDates(months: number): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - months);
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

export default function SimulateWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: 소비 항목
  const [selectedItem, setSelectedItem] = useState<{ name: string; price: number } | null>(null);
  const [customItem, setCustomItem] = useState(false);
  const [customItemName, setCustomItemName] = useState("");
  const [customItemPrice, setCustomItemPrice] = useState("");

  // Step 2: 기간
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [customPeriod, setCustomPeriod] = useState(false);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");

  // Step 3: 주식
  const [selectedStock, setSelectedStock] = useState<{ name: string; ticker: string } | null>(null);
  const [customStock, setCustomStock] = useState(false);
  const [customStockName, setCustomStockName] = useState("");
  const [customStockTicker, setCustomStockTicker] = useState("");

  const canNext = () => {
    if (step === 1) {
      if (customItem) return customItemName.trim() !== "" && Number(customItemPrice) > 0;
      return selectedItem !== null;
    }
    if (step === 2) {
      if (customPeriod) return periodStart !== "" && periodEnd !== "" && periodStart < periodEnd;
      return selectedPreset !== null;
    }
    if (step === 3) {
      if (customStock) return customStockTicker.trim() !== "";
      return selectedStock !== null;
    }
    return false;
  };

  const prevStep = () => {
    if (step > 1) {
      setError("");
      setStep(step - 1);
    }
  };

  const nextStep = async () => {
    if (!canNext()) return;
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    await submit();
  };

  const submit = async () => {
    setLoading(true);
    setError("");

    const itemName = customItem ? customItemName : selectedItem!.name;
    const itemPrice = customItem ? Number(customItemPrice) : selectedItem!.price;
    const { start, end } = selectedPreset !== null
      ? getPresetDates(PERIOD_PRESETS[selectedPreset].months)
      : { start: periodStart, end: periodEnd };
    const stockName = customStock ? customStockName || customStockTicker : selectedStock!.name;
    const stockTicker = customStock ? customStockTicker : selectedStock!.ticker;

    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemName,
          itemPrice,
          periodStart: start,
          periodEnd: end,
          stockTicker,
          stockName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "시뮬레이션에 실패했습니다.");
        setLoading(false);
        return;
      }

      router.push(`/result/${data.id}`);
    } catch {
      setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
      setLoading(false);
    }
  };

  const steps = [
    { title: "무엇을 아낄까요?", icon: <DollarSign className="w-5 h-5" /> },
    { title: "얼마 동안?", icon: <Calendar className="w-5 h-5" /> },
    { title: "어떤 주식에?", icon: <TrendingUp className="w-5 h-5" /> },
  ];

  return (
    <div className="flex-1 flex flex-col bg-gray-50 h-full py-8 md:py-16">
      <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col bg-white md:rounded-3xl md:shadow-2xl md:border border-gray-100 overflow-hidden relative">

        {/* 앵무새 헤더 */}
        <div className="px-6 md:px-12 py-6 flex items-center justify-between z-10 bg-white">
          <button onClick={prevStep} disabled={step === 1} className={`p-3 rounded-full hover:bg-gray-100 transition-colors ${step === 1 ? "opacity-0" : "bg-gray-50"}`}>
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div className="flex flex-col items-center">
            <div className="flex items-center space-x-2">
              <ParrotMascot className="scale-75 -my-4 md:-my-2" />
              <span className="font-bold text-gray-800 tracking-tight text-xl md:text-2xl">시뮬레이터</span>
            </div>
          </div>
          <div className="w-12"></div>
        </div>

        {/* 진행 상황 바 */}
        <div className="px-6 md:px-12 mb-8 bg-white z-10">
          <div className="flex justify-between mb-4">
            {steps.map((s, i) => (
              <div key={i} className={`flex-1 h-3 rounded-full mx-1 transition-colors ${i + 1 <= step ? "bg-primary shadow-sm" : "bg-gray-200"}`} />
            ))}
          </div>
          <div className="text-center font-bold text-primary md:text-lg">
            Step {step}. {steps[step - 1].title}
          </div>
        </div>

        {/* 중앙 컨텐츠 영역 */}
        <div className="flex-1 px-6 md:px-12 flex flex-col">

          {step === 1 && (
            <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-2xl md:text-3xl font-extrabold mb-8 text-gray-800 text-center">아낄 항목을 선택해주세요</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {POPULAR_ITEMS.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => { setSelectedItem(item); setCustomItem(false); }}
                    className={`w-full p-4 rounded-2xl border-2 text-center transition-all ${!customItem && selectedItem?.name === item.name ? "border-primary bg-orange-50 shadow-md scale-[1.02]" : "border-gray-200 hover:border-orange-200 bg-white"}`}
                  >
                    <div className="text-2xl mb-1">{item.emoji}</div>
                    <div className="font-bold text-sm md:text-base">{item.name}</div>
                    <div className="text-gray-400 text-xs mt-1">{item.price.toLocaleString()}원</div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => { setCustomItem(true); setSelectedItem(null); }}
                className={`w-full p-4 rounded-2xl border-2 flex items-center justify-center space-x-3 transition-all ${customItem ? "border-primary bg-orange-50 shadow-md scale-[1.02]" : "border-gray-200 hover:border-orange-200 bg-white"}`}
              >
                <Edit3 className="w-5 h-5 text-gray-500" />
                <span className="font-bold text-base text-gray-600">직접 입력하기</span>
              </button>
              {customItem && (
                <div className="space-y-3 animate-in fade-in">
                  <input
                    type="text"
                    placeholder="항목 이름 (예: 스타벅스 라떼)"
                    className="w-full p-4 rounded-xl border-2 border-primary/50 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
                    value={customItemName}
                    onChange={(e) => setCustomItemName(e.target.value)}
                    autoFocus
                  />
                  <input
                    type="number"
                    placeholder="1회 금액 (원)"
                    className="w-full p-4 rounded-xl border-2 border-primary/50 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
                    value={customItemPrice}
                    onChange={(e) => setCustomItemPrice(e.target.value)}
                    min="1"
                  />
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-2xl md:text-3xl font-extrabold mb-8 text-gray-800 text-center">얼마 동안의 기간을 볼까요?</h2>
              <div className="grid grid-cols-2 gap-3">
                {PERIOD_PRESETS.map((preset, i) => (
                  <button
                    key={preset.label}
                    onClick={() => { setSelectedPreset(i); setCustomPeriod(false); }}
                    className={`w-full p-5 rounded-2xl border-2 text-center transition-all ${!customPeriod && selectedPreset === i ? "border-primary bg-orange-50 shadow-md scale-[1.02]" : "border-gray-200 hover:border-orange-200 bg-white"}`}
                  >
                    <div className="font-bold text-base md:text-lg">{preset.label}</div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => { setCustomPeriod(true); setSelectedPreset(null); }}
                className={`w-full p-4 rounded-2xl border-2 flex items-center justify-center space-x-3 transition-all ${customPeriod ? "border-primary bg-orange-50 shadow-md scale-[1.02]" : "border-gray-200 hover:border-orange-200 bg-white"}`}
              >
                <Calendar className="w-5 h-5 text-gray-500" />
                <span className="font-bold text-base text-gray-600">직접 날짜 설정</span>
              </button>
              {customPeriod && (
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 animate-in fade-in">
                  <input type="date" className="flex-1 p-4 rounded-xl border-2 border-primary/50 focus:outline-none focus:border-primary" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
                  <span className="self-center font-bold text-gray-400">~</span>
                  <input type="date" className="flex-1 p-4 rounded-xl border-2 border-primary/50 focus:outline-none focus:border-primary" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-2xl md:text-3xl font-extrabold mb-8 text-gray-800 text-center">대신 살 주식을 선택해주세요</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {POPULAR_STOCKS.map((stock) => (
                  <button
                    key={stock.ticker}
                    onClick={() => { setSelectedStock(stock); setCustomStock(false); }}
                    className={`w-full p-4 rounded-2xl border-2 text-center transition-all ${!customStock && selectedStock?.ticker === stock.ticker ? "border-primary bg-orange-50 shadow-md scale-[1.02]" : "border-gray-200 hover:border-orange-200 bg-white"}`}
                  >
                    <div className="font-bold text-sm md:text-base">{stock.name}</div>
                    <div className="text-gray-400 text-xs mt-1">{stock.ticker}</div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => { setCustomStock(true); setSelectedStock(null); }}
                className={`w-full p-4 rounded-2xl border-2 flex items-center justify-center space-x-3 transition-all ${customStock ? "border-primary bg-orange-50 shadow-md scale-[1.02]" : "border-gray-200 hover:border-orange-200 bg-white"}`}
              >
                <Edit3 className="w-5 h-5 text-gray-500" />
                <span className="font-bold text-base text-gray-600">직접 종목명/티커 입력</span>
              </button>
              {customStock && (
                <div className="space-y-3 animate-in fade-in">
                  <input
                    type="text"
                    placeholder="야후 파이낸스 티커 (예: MSFT, 035420.KS)"
                    className="w-full p-4 rounded-xl border-2 border-primary/50 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
                    value={customStockTicker}
                    onChange={(e) => setCustomStockTicker(e.target.value.toUpperCase())}
                    autoFocus
                  />
                  <input
                    type="text"
                    placeholder="종목 이름 (선택)"
                    className="w-full p-4 rounded-xl border-2 border-primary/50 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
                    value={customStockName}
                    onChange={(e) => setCustomStockName(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mx-6 md:mx-12 mt-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
            {error}
          </div>
        )}

        {/* 하단 네비게이션 */}
        <div className="px-6 md:px-12 py-6 bg-white border-t border-gray-100 mt-6">
          <button
            onClick={nextStep}
            disabled={!canNext() || loading}
            className="w-full bg-primary text-white font-bold py-5 rounded-2xl text-xl flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl hover:-translate-y-1 hover:bg-primary-hover active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>계산 중...</span>
              </>
            ) : (
              <>
                <span>{step === 3 ? "결과 보기" : "다음 단계"}</span>
                <ChevronRight className="w-6 h-6" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
