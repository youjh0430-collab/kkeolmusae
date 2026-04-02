"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  TrendingUp, 
  TrendingDown, 
  Volume2, 
  Download, 
  Share2, 
  RefreshCcw 
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { cn } from "@/lib/utils";
import ParrotMascot from "@/components/ParrotMascot";

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

const CountUp = ({ end, prefix = '', suffix = '' }: { end: number, prefix?: string, suffix?: string }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const increment = end / (duration / 16);
    
    if (end === 0) {
      setCount(0);
      return;
    }
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [end]);
  
  return <span>{prefix}{count.toLocaleString(undefined, { maximumFractionDigits: 1 })}{suffix}</span>;
};

function getParrotComment(returnRate: number): { text: string; emotion: "excited" | "mocking" | "sad" | "default" } {
  if (returnRate >= 50) return { text: `살껄~~ 살껄~~ 왜 안 샀어!! 무려 ${returnRate.toFixed(1)}%라고!! 🦜`, emotion: "excited" };
  if (returnRate >= 10) return { text: `쏠쏠했을텐데~ ${returnRate.toFixed(1)}% 수익이라니, 아깝다 아깝다~`, emotion: "mocking" };
  if (returnRate >= -10) return { text: `뭐... 그냥 그랬을 수도 있어~ ${returnRate.toFixed(1)}% 😅`, emotion: "default" };
  return { text: `오히려 다행이야~ 안 샀길 잘했어~ ${returnRate.toFixed(1)}% 🎉`, emotion: "sad" };
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export default function ResultClient({ simulation: sim }: Props) {
  const router = useRouter();
  
  const isProfit = sim.return_rate >= 0;
  const { text: comment, emotion } = getParrotComment(sim.return_rate);
  
  const currentValue = sim.investment_amount + sim.profit_amount;
  const totalTimes = Math.round(sim.investment_amount / sim.item_price);
  const periodText = `${formatDateLabel(sim.period_start)}부터 ${formatDateLabel(sim.period_end)}까지`;
  
  const chartData = [
    { name: '매수가', value: sim.investment_amount, priceInfo: sim.buy_price },
    { name: '현재가', value: currentValue, priceInfo: sim.current_price },
  ];

  function speakComment() {
    if (!("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(comment);
    utterance.lang = "ko-KR";
    
    utterance.pitch = 1.6;
    utterance.rate = 1.1;
    
    const voices = window.speechSynthesis.getVoices();
    const krVoices = voices.filter(v => v.lang.includes('ko') || v.lang.includes('KR'));
    const preferredVoice = krVoices.find(v => v.name.includes('Yuna') || v.name.includes('Sora') || v.name.includes('Google'));
    
    if (preferredVoice) utterance.voice = preferredVoice;
    else if (krVoices.length > 0) utterance.voice = krVoices[0];
    
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: "껄무새 시뮬레이션 결과", url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("링크가 복사되었습니다!");
    }
  };

  return (
    <main className="max-w-md mx-auto min-h-screen bg-[#F9FAFB] relative overflow-hidden shadow-2xl sm:border-x border-slate-200">
      <div className="px-6 py-10 pb-32">
        <div className={cn(
          "rounded-3xl p-8 text-center mb-6 overflow-hidden relative shadow-sm border",
          isProfit ? "bg-profit/10 border-profit/20" : "bg-loss/10 border-loss/20"
        )}>
          <div className="relative z-10 animate-in fade-in slide-in-from-bottom-4">
            <div className={cn(
              "text-5xl font-black mb-4 flex items-center justify-center gap-2",
              isProfit ? "text-profit" : "text-loss"
            )}>
              {isProfit ? <TrendingUp className="w-10 h-10" /> : <TrendingDown className="w-10 h-10" />}
              <CountUp end={Math.abs(sim.return_rate)} prefix={isProfit ? '+' : '-'} suffix="%" />
            </div>
            <p className="text-slate-600 font-medium leading-relaxed break-keep">
              {periodText} 총 {totalTimes}번 소비한 <br/>
              <span className="font-bold text-slate-900">{sim.item_name}</span> 대신 <span className="font-bold text-slate-900">{sim.stock_name}</span>을 샀다면?
            </p>
          </div>
          
          {/* Background decoration */}
          <div className={cn(
            "absolute -bottom-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-20",
            isProfit ? "bg-profit" : "bg-loss"
          )} />
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6 animate-in fade-in slide-in-from-bottom-4 delay-75">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-sm text-slate-400 mb-1">현재 가치 (수익금)</div>
              <div className={cn(
                "text-2xl font-bold",
                isProfit ? "text-profit" : "text-loss"
              )}>
                {Math.round(currentValue).toLocaleString()}원
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-400 mb-1">원금 (소비금액)</div>
              <div className="text-xl font-bold text-slate-400">
                {Math.round(sim.investment_amount).toLocaleString()}원
              </div>
            </div>
          </div>

          <div className="h-48 w-full mb-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip 
                  cursor={{stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3'}}
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`${Math.round(value).toLocaleString()}원`, '평가금액']}
                  labelFormatter={(name, payload) => {
                    if (payload && payload.length > 0) {
                      const data = payload[0].payload;
                      return `${name} (주가: ${Math.round(data.priceInfo).toLocaleString()})`;
                    }
                    return name;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={isProfit ? "#4ADE80" : "#60A5FA"} 
                  strokeWidth={4} 
                  dot={{ r: 6, fill: isProfit ? "#4ADE80" : "#60A5FA", strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="relative bg-brand-primary/5 rounded-3xl p-6 mb-8 border border-brand-primary/10 animate-in fade-in slide-in-from-bottom-4 delay-100 flex flex-col md:flex-row items-center gap-4">
          <ParrotMascot emotion={emotion} className="w-24 h-24 shrink-0 -mt-2" />
          <div className="flex-1 text-center md:text-left">
            <div className="text-xs font-bold text-brand-primary uppercase tracking-wider mb-2">Kkeol-mu-sae says</div>
            <p className="text-slate-800 font-bold leading-relaxed mb-3 break-keep text-sm">
              "{comment}"
            </p>
            <button 
              onClick={speakComment}
              className="inline-flex items-center gap-2 bg-brand-primary/10 text-brand-primary py-2 px-4 rounded-xl text-sm font-bold hover:bg-brand-primary/20 transition-colors"
            >
              <Volume2 className="w-4 h-4" /> 목소리 듣기
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-8 delay-150">
          <button className="bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 opacity-50 cursor-not-allowed">
            <Download className="w-5 h-5" /> 이미지 저장
          </button>
          <button 
            onClick={handleShare}
            className="bg-white border border-slate-200 text-slate-900 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Share2 className="w-5 h-5" /> 링크 복사
          </button>
          <button 
            onClick={() => router.push('/simulate')}
            className="col-span-2 bg-brand-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-brand-primary/90 transition-colors shadow-lg shadow-brand-primary/30"
          >
            <RefreshCcw className="w-5 h-5" /> 다시 시뮬레이션
          </button>
        </div>
      </div>
    </main>
  );
}
