"use client";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Coffee, 
  Utensils, 
  Smartphone, 
  Car, 
  Search, 
  ArrowRight, 
  RefreshCcw, 
  Share2, 
  Download, 
  Volume2,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Bird
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { GoogleGenAI } from "@google/genai";
import { cn } from '@/lib/utils';

// --- Types ---

type Step = 'landing' | 'item' | 'period' | 'frequency' | 'stock' | 'result';

interface ConsumptionItem {
  id: string;
  name: string;
  price: number;
  icon: React.ReactNode;
}

interface Period {
  id: string;
  label: string;
  days: number;
}

interface Frequency {
  id: string;
  label: string;
  value: number;
}

interface Stock {
  id: string;
  name: string;
  symbol: string;
}

interface SimulationResult {
  item: ConsumptionItem;
  period: Period;
  frequency: number;
  totalInvested: number;
  stock: Stock;
  profitRate: number;
  currentValue: number;
  regretAmount: number;
  comment: string;
}

// --- Constants ---

const CONSUMPTION_ITEMS: ConsumptionItem[] = [
  { id: 'coffee', name: '아메리카노', price: 4500, icon: <Coffee className="w-6 h-6" /> },
  { id: 'chicken', name: '치킨 한 마리', price: 20000, icon: <Utensils className="w-6 h-6" /> },
  { id: 'phone', name: '최신 스마트폰', price: 1500000, icon: <Smartphone className="w-6 h-6" /> },
  { id: 'car', name: '중형 세단', price: 35000000, icon: <Car className="w-6 h-6" /> },
];

const PERIODS: Period[] = [
  { id: '1w', label: '1주일 동안', days: 7 },
  { id: '1m', label: '한 달 동안', days: 30 },
  { id: '3m', label: '3개월 동안', days: 90 },
  { id: '6m', label: '6개월 동안', days: 180 },
  { id: '12m', label: '12개월 동안', days: 365 },
];

const FREQUENCIES: Frequency[] = [
  { id: 'daily', label: '매일', value: -1 },
  { id: '1', label: '1번', value: 1 },
  { id: '2', label: '2번', value: 2 },
  { id: '3', label: '3번', value: 3 },
  { id: '5', label: '5번', value: 5 },
  { id: '10', label: '10번', value: 10 },
  { id: '20', label: '20번', value: 20 },
  { id: '30', label: '30번', value: 30 },
];

const POPULAR_STOCKS: Stock[] = [
  { id: 'samsung', name: '삼성전자', symbol: '005930' },
  { id: 'apple', name: '애플', symbol: 'AAPL' },
  { id: 'tesla', name: '테슬라', symbol: 'TSLA' },
  { id: 'nvidia', name: '엔비디아', symbol: 'NVDA' },
  { id: 'bitcoin', name: '비트코인', symbol: 'BTC' },
];

// --- Components ---

const ParrotMascot = ({ state }: { state: 'idle' | 'happy' | 'sad' | 'thinking' }) => {
  return (
    <motion.div 
      className="relative w-32 h-32 mx-auto mb-6"
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="absolute inset-0 bg-brand-primary/10 rounded-full blur-2xl" />
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        {/* Simple SVG Parrot Mascot */}
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
          <motion.circle 
            cx="50" cy="50" r="45" 
            fill="#FF6B35" 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          />
          {/* Eyes */}
          <circle cx="35" cy="40" r="5" fill="white" />
          <circle cx="65" cy="40" r="5" fill="white" />
          <motion.circle 
            cx="35" cy="40" r="2.5" fill="black" 
            animate={state === 'happy' ? { scale: [1, 1.5, 1] } : {}}
          />
          <motion.circle 
            cx="65" cy="40" r="2.5" fill="black" 
            animate={state === 'happy' ? { scale: [1, 1.5, 1] } : {}}
          />
          
          {/* Beak */}
          <path d="M45 55 L55 55 L50 75 Z" fill="#FFB347" />
          
          {/* Expressions */}
          {state === 'sad' && (
            <path d="M35 30 Q50 20 65 30" stroke="white" strokeWidth="2" fill="none" />
          )}
          {state === 'thinking' && (
            <motion.circle 
              cx="80" cy="20" r="10" fill="white" opacity="0.8"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity }}
            />
          )}
        </svg>
      </div>
      
      {/* Speech Bubble */}
      <motion.div 
        className="absolute -top-4 -right-12 bg-white px-4 py-2 rounded-2xl shadow-md border border-slate-100 text-sm font-bold whitespace-nowrap"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {state === 'idle' && "살껄~"}
        {state === 'happy' && "거봐 내말 맞지?"}
        {state === 'sad' && "껄껄껄...ㅠㅠ"}
        {state === 'thinking' && "계산 중..."}
      </motion.div>
    </motion.div>
  );
};

const CountUp = ({ end, prefix = '', suffix = '' }: { end: number, prefix?: string, suffix?: string }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const increment = end / (duration / 16);
    
    // Prevent infinite loop or NaN if end is 0
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
  
  return <span>{prefix}{count.toLocaleString()}{suffix}</span>;
};

// --- Main App ---

export default function App() {
  const [currentStep, setCurrentStep] = useState<Step>('landing');
  const [selectedItem, setSelectedItem] = useState<ConsumptionItem | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);
  const [selectedFrequency, setSelectedFrequency] = useState<number | null>(null);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Custom input states
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');
  const [isCustomItemMode, setIsCustomItemMode] = useState(false);
  
  const [customPeriodDays, setCustomPeriodDays] = useState('');
  const [isCustomPeriodMode, setIsCustomPeriodMode] = useState(false);
  
  const [customFrequency, setCustomFrequency] = useState('');
  const [isCustomFrequencyMode, setIsCustomFrequencyMode] = useState(false);
  
  const [stockSearchQuery, setStockSearchQuery] = useState('');

  // Use NEXT_PUBLIC for Next.js environment vars in client component
  // API 키가 없어도 화면이 터지지 않도록 예외 처리
  const ai = useMemo(() => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) return null;
      return new GoogleGenAI({ apiKey });
    } catch {
      return null;
    }
  }, []);

  const handleStart = () => setCurrentStep('item');

  const handleSelectItem = (item: ConsumptionItem) => {
    setSelectedItem(item);
    setCurrentStep('period');
  };

  const handleCustomItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customItemName || !customItemPrice) return;
    
    const price = parseInt(customItemPrice.replace(/[^0-9]/g, ''));
    if (isNaN(price)) return;

    handleSelectItem({
      id: 'custom',
      name: customItemName,
      price: price,
      icon: <Bird className="w-6 h-6" />
    });
  };

  const handleSelectPeriod = (period: Period) => {
    setSelectedPeriod(period);
    setCurrentStep('frequency');
  };

  const handleCustomPeriodSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const days = parseInt(customPeriodDays);
    if (isNaN(days) || days <= 0) return;

    handleSelectPeriod({
      id: 'custom',
      label: `${days}일 동안`,
      days: days
    });
  };

  const handleSelectFrequency = (frequency: number) => {
    setSelectedFrequency(frequency);
    setCurrentStep('stock');
  };

  const handleCustomFrequencySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const freq = parseInt(customFrequency);
    if (isNaN(freq) || freq <= 0) return;

    handleSelectFrequency(freq);
  };

  const handleSelectStock = async (stock: Stock) => {
    setSelectedStock(stock);
    setIsCalculating(true);
    setCurrentStep('result');
    
    // Calculate total invested amount
    const isDaily = selectedFrequency === -1;
    const totalTimes = isDaily ? selectedPeriod!.days : selectedFrequency!;
    const totalInvested = selectedItem!.price * totalTimes;

    // Simulate calculation
    const mockProfitRate = (Math.random() * 200) - 50; 
    const currentValue = totalInvested * (1 + mockProfitRate / 100);
    const regretAmount = currentValue - totalInvested;

    try {
      const prompt = `
        주식 투자 시뮬레이션 결과에 대해 앵무새 캐릭터 '껄무새'가 할 법한 위트 있고 장난스러운 코멘트를 한 문장으로 작성해줘.
        - 상황: ${selectedPeriod?.label} ${totalTimes}번 소비한 ${selectedItem?.name} (총 ${totalInvested.toLocaleString()}원) 대신 ${stock.name} 주식을 샀더라면?
        - 수익률: ${mockProfitRate.toFixed(1)}%
        - 현재 가치: ${currentValue.toLocaleString()}원
        - 말투: ~껄, ~껄껄 하는 앵무새 말투, 장난스러움, 팩트 폭격.
        - 한국어로 작성.
      `;
      
      let generatedComment = "그때 샀으면 지금쯤 부자였을껄!";
      if (ai) {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
        });
        generatedComment = response.text || generatedComment;
      }
      
      setResult({
        item: selectedItem!,
        period: selectedPeriod!,
        frequency: totalTimes,
        totalInvested: totalInvested,
        stock: stock,
        profitRate: mockProfitRate,
        currentValue: currentValue,
        regretAmount: regretAmount,
        comment: generatedComment
      });
    } catch (error) {
      console.error("Gemini Error:", error);
      setResult({
        item: selectedItem!,
        period: selectedPeriod!,
        frequency: totalTimes,
        totalInvested: totalInvested,
        stock: stock,
        profitRate: mockProfitRate,
        currentValue: currentValue,
        regretAmount: regretAmount,
        comment: mockProfitRate > 0 ? "그때 샀으면 지금쯤 부자였을껄!" : "안 사길 잘했다껄! 다행이다껄!"
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleRestart = () => {
    setSelectedItem(null);
    setSelectedPeriod(null);
    setSelectedFrequency(null);
    setSelectedStock(null);
    setResult(null);
    setCustomItemName('');
    setCustomItemPrice('');
    setIsCustomItemMode(false);
    setCustomPeriodDays('');
    setIsCustomPeriodMode(false);
    setCustomFrequency('');
    setIsCustomFrequencyMode(false);
    setStockSearchQuery('');
    setCurrentStep('landing');
  };

  const speakComment = () => {
    if (!result) return;
    const utterance = new SpeechSynthesisUtterance(result.comment);
    utterance.pitch = 1.5;
    utterance.rate = 1.2;
    utterance.lang = 'ko-KR';
    window.speechSynthesis.speak(utterance);
  };

  // --- Render Helpers ---

  const renderLanding = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
      <ParrotMascot state="idle" />
      <motion.h1 
        className="text-4xl font-bold mb-4 tracking-tight"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        그때 <span className="text-brand-primary">샀더라면...</span>
      </motion.h1>
      <motion.p 
        className="text-slate-500 mb-12 max-w-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        습관적으로 쓴 돈으로 주식을 샀다면?<br />당신의 후회를 수익률로 계산해 드립니다.
      </motion.p>
      
      <motion.button
        onClick={handleStart}
        className="w-full max-w-xs bg-brand-primary text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-brand-primary/30 flex items-center justify-center gap-2"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        지금 바로 후회하러 가기 <ArrowRight className="w-5 h-5" />
      </motion.button>
      
      <div className="mt-12 text-sm text-slate-400">
        지금까지 <span className="font-bold text-slate-600">1,234명</span>이 <span className="font-bold text-slate-600">500억 원</span>을 후회했습니다.
      </div>
    </div>
  );

  const renderItemStep = () => (
    <div className="px-6 py-12">
      <h2 className="text-2xl font-bold mb-8">무엇을 소비하셨나요?</h2>
      
      <AnimatePresence mode="wait">
        {!isCustomItemMode ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 gap-4"
          >
            {CONSUMPTION_ITEMS.map((item) => (
              <motion.button
                key={item.id}
                onClick={() => handleSelectItem(item)}
                className="flex items-center gap-4 p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-brand-primary transition-colors text-left"
                whileHover={{ x: 5 }}
              >
                <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary">
                  {item.icon}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-lg">{item.name}</div>
                  <div className="text-slate-400 text-sm">{item.price.toLocaleString()}원</div>
                </div>
                <ChevronRight className="text-slate-300" />
              </motion.button>
            ))}
            
            <button 
              onClick={() => setIsCustomItemMode(true)}
              className="flex items-center justify-center gap-2 p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500 font-bold hover:bg-slate-100 transition-colors"
            >
              직접 입력하기
            </button>
          </motion.div>
        ) : (
          <motion.form 
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleCustomItemSubmit}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6"
          >
            <div>
              <label className="block text-sm font-bold text-slate-400 mb-2">소비 항목</label>
              <input 
                type="text" 
                value={customItemName}
                onChange={(e) => setCustomItemName(e.target.value)}
                placeholder="예: 아이패드 프로"
                className="w-full bg-slate-50 border-none rounded-xl py-4 px-4 focus:ring-2 focus:ring-brand-primary/20"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-400 mb-2">금액 (원)</label>
              <input 
                type="text" 
                value={customItemPrice}
                onChange={(e) => setCustomItemPrice(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="예: 1200000"
                className="w-full bg-slate-50 border-none rounded-xl py-4 px-4 focus:ring-2 focus:ring-brand-primary/20"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                type="button"
                onClick={() => setIsCustomItemMode(false)}
                className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold"
              >
                취소
              </button>
              <button 
                type="submit"
                disabled={!customItemName || !customItemPrice}
                className="flex-[2] py-4 bg-brand-primary text-white rounded-2xl font-bold disabled:opacity-50"
              >
                선택 완료
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );

  const renderPeriodStep = () => (
    <div className="px-6 py-12">
      <h2 className="text-2xl font-bold mb-2">얼마나 오랫동안 소비했나요?</h2>
      <p className="text-slate-400 mb-8 text-sm">소비를 반복한 기간을 선택해주세요.</p>
      
      <AnimatePresence mode="wait">
        {!isCustomPeriodMode ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-2 gap-4"
          >
            {PERIODS.map((period) => (
              <motion.button
                key={period.id}
                onClick={() => handleSelectPeriod(period)}
                className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-brand-primary transition-colors flex flex-col items-center gap-2"
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-lg font-bold">{period.label}</div>
                <div className="text-xs text-slate-400">약 {period.days}일</div>
              </motion.button>
            ))}
            <button 
              onClick={() => setIsCustomPeriodMode(true)}
              className="col-span-2 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500 font-bold"
            >
              직접 입력 (일 단위)
            </button>
          </motion.div>
        ) : (
          <motion.form 
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleCustomPeriodSubmit}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6"
          >
            <div>
              <label className="block text-sm font-bold text-slate-400 mb-2">기간 (일)</label>
              <input 
                type="number" 
                value={customPeriodDays}
                onChange={(e) => setCustomPeriodDays(e.target.value)}
                placeholder="예: 100"
                className="w-full bg-slate-50 border-none rounded-xl py-4 px-4 focus:ring-2 focus:ring-brand-primary/20"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => setIsCustomPeriodMode(false)}
                className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold"
              >
                취소
              </button>
              <button 
                type="submit"
                disabled={!customPeriodDays}
                className="flex-[2] py-4 bg-brand-primary text-white rounded-2xl font-bold"
              >
                확인
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );

  const renderFrequencyStep = () => (
    <div className="px-6 py-12">
      <h2 className="text-2xl font-bold mb-2">얼마나 자주 소비했나요?</h2>
      <p className="text-slate-400 mb-8 text-sm">{selectedPeriod?.label} 총 몇 번 소비했나요?</p>
      
      <AnimatePresence mode="wait">
        {!isCustomFrequencyMode ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-3 gap-3"
          >
            {FREQUENCIES.map((freq) => (
              <motion.button
                key={freq.id}
                onClick={() => handleSelectFrequency(freq.value)}
                className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-brand-primary transition-colors flex flex-col items-center gap-1"
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-base font-bold">{freq.label}</div>
              </motion.button>
            ))}
            <button 
              onClick={() => setIsCustomFrequencyMode(true)}
              className="col-span-3 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500 font-bold"
            >
              직접 입력 (회)
            </button>
          </motion.div>
        ) : (
          <motion.form 
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleCustomFrequencySubmit}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6"
          >
            <div>
              <label className="block text-sm font-bold text-slate-400 mb-2">횟수 (회)</label>
              <input 
                type="number" 
                value={customFrequency}
                onChange={(e) => setCustomFrequency(e.target.value)}
                placeholder="예: 50"
                className="w-full bg-slate-50 border-none rounded-xl py-4 px-4 focus:ring-2 focus:ring-brand-primary/20"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => setIsCustomFrequencyMode(false)}
                className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold"
              >
                취소
              </button>
              <button 
                type="submit"
                disabled={!customFrequency}
                className="flex-[2] py-4 bg-brand-primary text-white rounded-2xl font-bold"
              >
                확인
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );

  const renderStockStep = () => {
    const filteredStocks = POPULAR_STOCKS.filter(s => 
      s.name.toLowerCase().includes(stockSearchQuery.toLowerCase()) || 
      s.symbol.toLowerCase().includes(stockSearchQuery.toLowerCase())
    );

    return (
      <div className="px-6 py-12">
        <h2 className="text-2xl font-bold mb-2">어떤 주식을 샀더라면?</h2>
        <p className="text-slate-400 mb-8 text-sm">종목을 검색하거나 직접 입력해보세요.</p>
        
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            value={stockSearchQuery}
            onChange={(e) => setStockSearchQuery(e.target.value)}
            placeholder="종목명 또는 심볼 입력" 
            className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          />
        </div>

        <div className="grid grid-cols-1 gap-3">
          {filteredStocks.map((stock) => (
            <motion.button
              key={stock.id}
              onClick={() => handleSelectStock(stock)}
              className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-brand-primary transition-colors"
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500 text-xs">
                  {stock.symbol.slice(0, 2)}
                </div>
                <div className="font-bold">{stock.name}</div>
              </div>
              <div className="text-slate-400 text-sm">{stock.symbol}</div>
            </motion.button>
          ))}

          {stockSearchQuery && !POPULAR_STOCKS.some(s => s.name === stockSearchQuery) && (
            <motion.button
              onClick={() => handleSelectStock({ id: 'custom', name: stockSearchQuery, symbol: 'CUSTOM' })}
              className="flex items-center justify-between p-5 bg-brand-primary/5 rounded-2xl border border-dashed border-brand-primary/30 text-brand-primary font-bold"
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-primary/10 rounded-full flex items-center justify-center">
                  <Bird className="w-5 h-5" />
                </div>
                <div>"{stockSearchQuery}" 직접 입력</div>
              </div>
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          )}
        </div>
      </div>
    );
  };

  const renderResult = () => {
    if (isCalculating || !result) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
          <ParrotMascot state="thinking" />
          <h2 className="text-2xl font-bold mb-2">후회 데이터 분석 중...</h2>
          <p className="text-slate-400">과거의 당신을 혼내줄 준비를 하고 있어요.</p>
        </div>
      );
    }

    const isProfit = result.profitRate > 0;
    const chartData = [
      { name: '과거', value: result.totalInvested },
      { name: '현재', value: result.currentValue },
    ];

    return (
      <div className="px-6 py-8 pb-24">
        <div className={cn(
          "rounded-3xl p-8 text-center mb-6 overflow-hidden relative",
          isProfit ? "bg-profit/10" : "bg-loss/10"
        )}>
          <div className="relative z-10">
            <div className={cn(
              "text-5xl font-black mb-2 flex items-center justify-center gap-2",
              isProfit ? "text-profit" : "text-loss"
            )}>
              {isProfit ? <TrendingUp className="w-10 h-10" /> : <TrendingDown className="w-10 h-10" />}
              <CountUp end={Math.abs(result.profitRate)} prefix={isProfit ? '+' : '-'} suffix="%" />
            </div>
            <p className="text-slate-600 font-medium">
              {result.period.label} {result.frequency}번 소비한 <span className="font-bold text-slate-900">{result.item.name}</span> 대신 <span className="font-bold text-slate-900">{result.stock.name}</span>을 샀다면?
            </p>
          </div>
          
          {/* Background decoration */}
          <div className={cn(
            "absolute -bottom-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-20",
            isProfit ? "bg-profit" : "bg-loss"
          )} />
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-sm text-slate-400 mb-1">현재 가치</div>
              <div className="text-2xl font-bold">{Math.round(result.currentValue).toLocaleString()}원</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-400 mb-1">후회 금액</div>
              <div className={cn(
                "text-xl font-bold",
                isProfit ? "text-brand-accent" : "text-slate-400"
              )}>
                {isProfit ? '+' : ''}{Math.round(result.regretAmount).toLocaleString()}원
              </div>
            </div>
          </div>

          <div className="h-48 w-full mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" hide />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`${(value || 0).toLocaleString()}원`, '가치']}
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

        <div className="relative bg-brand-primary/5 rounded-3xl p-6 mb-8 border border-brand-primary/10">
          <div className="flex items-start gap-4">
            <button 
              onClick={speakComment}
              className="w-12 h-12 bg-brand-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-primary/20 shrink-0"
            >
              <Volume2 className="w-6 h-6" />
            </button>
            <div className="flex-1">
              <div className="text-xs font-bold text-brand-primary uppercase tracking-wider mb-1">Kkeol-mu-sae says</div>
              <p className="text-slate-800 font-bold leading-relaxed">
                "{result.comment}"
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button className="bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2">
            <Download className="w-5 h-5" /> 이미지 저장
          </button>
          <button className="bg-white border border-slate-200 text-slate-900 py-4 rounded-2xl font-bold flex items-center justify-center gap-2">
            <Share2 className="w-5 h-5" /> 링크 복사
          </button>
          <button 
            onClick={handleRestart}
            className="col-span-2 bg-brand-primary/10 text-brand-primary py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-brand-primary/20 transition-colors"
          >
            <RefreshCcw className="w-5 h-5" /> 다시 시뮬레이션
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#F9FAFB] relative overflow-hidden">
      {/* Local Top Area (Removed duplicate logo, kept Refresh Button) */}
      {currentStep !== 'landing' && (
        <div className="px-6 py-4 flex justify-end sticky top-0 z-50 bg-[#F9FAFB]/80 backdrop-blur-md">
          <button 
            onClick={handleRestart}
            className="text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1 text-sm font-bold bg-white/50 px-3 py-1.5 rounded-full border border-slate-200"
          >
            <RefreshCcw className="w-4 h-4" /> 다시하기
          </button>
        </div>
      )}

      {/* Progress Bar */}
      {['item', 'period', 'frequency', 'stock'].includes(currentStep) && (
        <div className="px-6 mb-4">
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-brand-primary"
              initial={{ width: 0 }}
              animate={{ 
                width: currentStep === 'item' ? '25%' : currentStep === 'period' ? '50%' : currentStep === 'frequency' ? '75%' : '100%' 
              }}
            />
          </div>
        </div>
      )}

      <main>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentStep === 'landing' && renderLanding()}
            {currentStep === 'item' && renderItemStep()}
            {currentStep === 'period' && renderPeriodStep()}
            {currentStep === 'frequency' && renderFrequencyStep()}
            {currentStep === 'stock' && renderStockStep()}
            {currentStep === 'result' && renderResult()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer Decoration */}
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#F9FAFB] to-transparent pointer-events-none z-0" />
    </div>
  );
}
