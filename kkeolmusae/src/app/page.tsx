"use client";

/**
 * Role: 껄무새 메인 SPA — 랜딩 + 원페이지 시뮬레이션 + 결과
 * Key Features: 롤링 placeholder, 드롭다운 기반 원페이지 폼, Gemini AI 코멘트
 * Dependencies: framer-motion, recharts, @google/genai, lucide-react
 * Notes: 시안2 — 4단계 위저드를 한 페이지 폼으로 축약
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  ChevronDown,
  ChevronUp,
  Bird,
  Check
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

type Step = 'landing' | 'simulate' | 'result';

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
  chartHistory?: { date: string; close: number }[];
  buyDate?: string;       // 매수 기준일
  buyPrice?: number;      // 매수 시점 1주 가격
  currentPrice?: number;  // 현재 1주 가격
  currency?: string;      // 주가 통화 (USD, KRW 등)
}

// --- Constants ---

const CONSUMPTION_ITEMS: ConsumptionItem[] = [
  { id: 'coffee', name: '아메리카노', price: 4500, icon: <Coffee className="w-5 h-5" /> },
  { id: 'chicken', name: '치킨 한 마리', price: 20000, icon: <Utensils className="w-5 h-5" /> },
  { id: 'phone', name: '최신 스마트폰', price: 1500000, icon: <Smartphone className="w-5 h-5" /> },
  { id: 'car', name: '중형 세단', price: 35000000, icon: <Car className="w-5 h-5" /> },
];

// 롤링 placeholder용 예시 텍스트
const PLACEHOLDER_EXAMPLES = [
  '아메리카노 4,500원',
  '치킨 한 마리 20,000원',
  '택시비 15,000원',
  '넷플릭스 17,000원',
  '점심 한 끼 9,000원',
  '편의점 간식 3,500원',
];

const PERIODS: Period[] = [
  { id: '1w', label: '1주일', days: 7 },
  { id: '1m', label: '한 달', days: 30 },
  { id: '3m', label: '3개월', days: 90 },
  { id: '6m', label: '6개월', days: 180 },
  { id: '12m', label: '12개월', days: 365 },
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

// --- 롤링 Placeholder 컴포넌트 ---

const RollingPlaceholder = ({ examples, interval = 2000 }: { examples: string[]; interval?: number }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % examples.length);
    }, interval);
    return () => clearInterval(timer);
  }, [examples.length, interval]);

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={index}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 0.4, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3 }}
        className="absolute left-12 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-sm"
      >
        {examples[index]}
      </motion.span>
    </AnimatePresence>
  );
};

// --- 드롭다운 셀렉터 컴포넌트 ---

function DropdownSelector<T>({
  label,
  options,
  selected,
  onSelect,
  renderOption,
  renderSelected,
  customInput,
}: {
  label: string;
  options: T[];
  selected: T | null;
  onSelect: (option: T) => void;
  renderOption: (option: T, isSelected: boolean) => React.ReactNode;
  renderSelected: (option: T) => React.ReactNode;
  customInput?: {
    placeholder: string;
    unit: string;
    onSubmit: (value: number) => void;
  };
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowCustom(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setIsOpen(!isOpen); setShowCustom(false); }}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border text-left transition-all",
          selected
            ? "bg-brand-primary/5 border-brand-primary/30 text-slate-900"
            : "bg-white border-slate-200 text-slate-400",
          isOpen && "ring-2 ring-brand-primary/20"
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
          <span className="text-sm font-medium">
            {selected ? renderSelected(selected) : '선택해주세요'}
          </span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -4, scaleY: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden max-h-72 overflow-y-auto"
            style={{ transformOrigin: 'top' }}
          >
            {options.map((option, i) => {
              const isSelected = selected === option;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    onSelect(option);
                    setIsOpen(false);
                    setShowCustom(false);
                    setCustomValue('');
                  }}
                  className={cn(
                    "w-full px-4 py-3 text-left text-sm transition-colors flex items-center justify-between",
                    isSelected
                      ? "bg-brand-primary/5 text-brand-primary font-bold"
                      : "hover:bg-slate-50 text-slate-700"
                  )}
                >
                  {renderOption(option, isSelected)}
                  {isSelected && <Check className="w-4 h-4 text-brand-primary" />}
                </button>
              );
            })}

            {/* 직접 입력 영역 */}
            {customInput && (
              <div className="border-t border-slate-100">
                {!showCustom ? (
                  <button
                    type="button"
                    onClick={() => setShowCustom(true)}
                    className="w-full px-4 py-3 text-left text-sm text-slate-500 hover:bg-slate-50 font-medium"
                  >
                    직접 입력
                  </button>
                ) : (
                  <div className="px-4 py-3 flex items-center gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={customValue}
                      onChange={(e) => setCustomValue(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder={customInput.placeholder}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const num = parseInt(customValue);
                          if (!isNaN(num) && num > 0) {
                            customInput.onSubmit(num);
                            setIsOpen(false);
                            setShowCustom(false);
                            setCustomValue('');
                          }
                        }
                      }}
                    />
                    <span className="text-xs text-slate-400 shrink-0">{customInput.unit}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const num = parseInt(customValue);
                        if (!isNaN(num) && num > 0) {
                          customInput.onSubmit(num);
                          setIsOpen(false);
                          setShowCustom(false);
                          setCustomValue('');
                        }
                      }}
                      disabled={!customValue}
                      className="px-3 py-2.5 bg-brand-primary text-white rounded-xl text-sm font-bold disabled:opacity-40 shrink-0"
                    >
                      확인
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- 껄무새 마스코트 ---

const ParrotMascot = ({ state, size = 'lg' }: { state: 'idle' | 'happy' | 'sad' | 'thinking' | 'shocked' | 'mocking'; size?: 'sm' | 'lg' }) => {
  const dimension = size === 'sm' ? 'w-12 h-12' : 'w-32 h-32';

  return (
    <motion.div
      className={cn("relative mx-auto", dimension, size === 'lg' && 'mb-6')}
      animate={state === 'thinking' ? { y: [-3, 3, -3] } : { y: [0, -6, 0] }}
      transition={{ duration: state === 'thinking' ? 1 : 3, repeat: Infinity, ease: "easeInOut" }}
    >
      {size === 'lg' && <div className="absolute inset-0 bg-brand-primary/10 rounded-full blur-2xl" />}
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
          <motion.circle cx="50" cy="50" r="45" fill="#FF6B35" initial={{ scale: 0 }} animate={{ scale: 1 }} />
          
          {/* Beak */}
          {state === 'shocked' ? (
            <>
              <path d="M45 52 L55 52 L50 65 Z" fill="#FFB347" />
              <path d="M47 68 L53 68 L50 78 Z" fill="#F59E0B" />
            </>
          ) : (
            <path d="M45 55 L55 55 L50 75 Z" fill="#FFB347" />
          )}

          {/* Eyes & Expressions */}
          {state === 'idle' && (
            <>
              <circle cx="35" cy="40" r="5" fill="white" />
              <circle cx="65" cy="40" r="5" fill="white" />
              <circle cx="35" cy="40" r="2.5" fill="black" />
              <circle cx="65" cy="40" r="2.5" fill="black" />
            </>
          )}

          {state === 'happy' && (
            <>
              <path d="M 30 42 Q 35 32 40 42" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none" />
              <path d="M 60 42 Q 65 32 70 42" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none" />
              <circle cx="25" cy="48" r="4" fill="#FF4D4D" opacity="0.6" />
              <circle cx="75" cy="48" r="4" fill="#FF4D4D" opacity="0.6" />
            </>
          )}

          {state === 'sad' && (
            <>
              <path d="M 30 40 Q 35 45 40 40" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none" />
              <path d="M 60 40 Q 65 45 70 40" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none" />
              <path d="M 35 46 L 35 55" stroke="#60A5FA" strokeWidth="3" strokeLinecap="round" />
              <path d="M 65 46 L 65 55" stroke="#60A5FA" strokeWidth="3" strokeLinecap="round" />
            </>
          )}

          {state === 'shocked' && (
            <>
              <circle cx="35" cy="38" r="8" fill="white" />
              <circle cx="65" cy="38" r="8" fill="white" />
              <circle cx="35" cy="38" r="2" fill="black" />
              <circle cx="65" cy="38" r="2" fill="black" />
              <circle cx="80" cy="25" r="3" fill="#93C5FD" opacity="0.8" />
            </>
          )}

          {state === 'mocking' && (
            <>
              <path d="M 28 40 L 42 40" stroke="white" strokeWidth="4" strokeLinecap="round" />
              <path d="M 58 40 L 72 40" stroke="white" strokeWidth="4" strokeLinecap="round" />
              <circle cx="40" cy="38" r="2" fill="black" />
              <circle cx="70" cy="38" r="2" fill="black" />
              <path d="M 28 32 L 40 33" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <path d="M 60 30 L 72 25" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </>
          )}

          {state === 'thinking' && (
            <>
              <path d="M 30 35 L 40 45 M 30 45 L 40 35" stroke="white" strokeWidth="3" strokeLinecap="round" />
              <path d="M 60 35 L 70 45 M 60 45 L 70 35" stroke="white" strokeWidth="3" strokeLinecap="round" />
              <motion.circle cx="35" cy="15" r="2" fill="white" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }} />
              <motion.circle cx="50" cy="15" r="2" fill="white" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.5 }} />
              <motion.circle cx="65" cy="15" r="2" fill="white" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.5, delay: 1 }} />
            </>
          )}
        </svg>
      </div>

      {size === 'lg' && (
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
      )}
    </motion.div>
  );
};

// --- CountUp ---

const CountUp = ({ end, prefix = '', suffix = '' }: { end: number; prefix?: string; suffix?: string }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const increment = end / (duration / 16);
    if (end === 0) { setCount(0); return; }

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
  const [selectedFrequency, setSelectedFrequency] = useState<Frequency | null>(null);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // 소비항목 직접 입력
  const [itemQuery, setItemQuery] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [showItemDropdown, setShowItemDropdown] = useState(false);

  // 종목 검색 — API 자동 검색
  const [stockQuery, setStockQuery] = useState('');
  const [showStockDropdown, setShowStockDropdown] = useState(false);
  const [searchedStocks, setSearchedStocks] = useState<Stock[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 외부 클릭 감지용 ref
  const itemRef = useRef<HTMLDivElement>(null);
  const stockRef = useRef<HTMLDivElement>(null);

  // Gemini AI
  const ai = useMemo(() => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) return null;
      return new GoogleGenAI({ apiKey });
    } catch {
      return null;
    }
  }, []);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (itemRef.current && !itemRef.current.contains(e.target as Node)) setShowItemDropdown(false);
      if (stockRef.current && !stockRef.current.contains(e.target as Node)) setShowStockDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // 종목 검색 API 호출 (debounce 300ms)
  const searchStock = (query: string) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!query.trim()) {
      setSearchedStocks([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search-stock?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        setSearchedStocks(
          (data.results || []).map((r: { symbol: string; name: string }) => ({
            id: r.symbol,
            name: r.name,
            symbol: r.symbol,
          }))
        );
      } catch {
        setSearchedStocks([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const handleStart = () => setCurrentStep('simulate');

  // 소비항목 선택
  const handleSelectItem = (item: ConsumptionItem) => {
    setSelectedItem(item);
    setItemQuery(item.name);
    setCustomPrice(item.price.toString());
    setShowItemDropdown(false);
  };

  // 종목 선택
  const handleSelectStock = (stock: Stock) => {
    setSelectedStock(stock);
    setStockQuery(stock.name);
    setShowStockDropdown(false);
  };

  // 모든 필드 완성 여부
  const canSubmit = !!selectedItem && !!selectedPeriod && !!selectedFrequency && !!selectedStock;

  // 시뮬레이션 실행 — /api/simulate로 실제 주가 데이터 조회
  const executeSimulation = async () => {
    if (!canSubmit) return;
    setIsCalculating(true);
    setCurrentStep('result');

    const freqValue = selectedFrequency!.value;
    const totalTimes = freqValue === -1 ? selectedPeriod!.days : freqValue;
    const totalInvested = selectedItem!.price * totalTimes;

    // 기간 계산: 오늘 기준으로 N일 전 ~ 오늘
    const now = new Date();
    const periodEnd = now.toISOString().split('T')[0];
    const periodStartDate = new Date(now);
    periodStartDate.setDate(periodStartDate.getDate() - selectedPeriod!.days);
    const periodStart = periodStartDate.toISOString().split('T')[0];

    try {
      // 실제 주가 데이터 API 호출
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemName: selectedItem!.name,
          itemPrice: selectedItem!.price,
          periodStart,
          periodEnd,
          stockTicker: selectedStock!.symbol,
          stockName: selectedStock!.name,
          frequency: totalTimes,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '시뮬레이션 실패');
      }

      const data = await res.json();
      const profitRate = data.returnRate;
      const currentValue = data.investmentAmount + data.profitAmount;
      const regretAmount = data.profitAmount;

      // Gemini AI 코멘트 생성
      let generatedComment = profitRate > 0
        ? "그때 샀으면 지금쯤 부자였을껄!"
        : "안 사길 잘했다껄! 다행이다껄!";

      if (ai) {
        try {
          const prompt = `
            주식 투자 시뮬레이션 결과에 대해 앵무새 캐릭터 '껄무새'가 할 법한 위트 있고 장난스러운 코멘트를 한 문장으로 작성해줘.
            - 상황: ${selectedPeriod?.label} 동안 ${totalTimes}번 소비한 ${selectedItem?.name} (총 ${totalInvested.toLocaleString()}원) 대신 ${selectedStock!.name} 주식을 샀더라면?
            - 수익률: ${profitRate.toFixed(1)}%
            - 현재 가치: ${currentValue.toLocaleString()}원
            - 말투: ~껄, ~껄껄 하는 앵무새 말투, 장난스러움, 팩트 폭격.
            - 한국어로 작성.
          `;
          const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
          });
          generatedComment = response.text || generatedComment;
        } catch {
          // Gemini 실패해도 결과 표시에 문제 없음
        }
      }

      setResult({
        item: selectedItem!,
        period: selectedPeriod!,
        frequency: totalTimes,
        totalInvested,
        stock: selectedStock!,
        profitRate,
        currentValue,
        regretAmount,
        comment: generatedComment,
        chartHistory: data.history,
        buyDate: periodStart,
        buyPrice: data.buyPrice,
        currentPrice: data.currentPrice,
        currency: data.currency,
      });
    } catch (error) {
      console.error("시뮬레이션 오류:", error);
      // API 실패 시 에러 메시지 표시
      setResult({
        item: selectedItem!,
        period: selectedPeriod!,
        frequency: totalTimes,
        totalInvested,
        stock: selectedStock!,
        profitRate: 0,
        currentValue: totalInvested,
        regretAmount: 0,
        comment: `주가 데이터를 가져오지 못했어껄... 티커(${selectedStock!.symbol})를 확인해봐껄!`,
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
    setItemQuery('');
    setCustomPrice('');
    setStockQuery('');
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

  // 소비항목 필터링 — 검색어에 맞는 프리셋 표시
  const filteredItems = CONSUMPTION_ITEMS.filter(
    (item) => item.name.includes(itemQuery) || itemQuery === ''
  );

  // 종목 목록: 검색어 없으면 프리셋, 있으면 API 결과 우선 + 프리셋 매칭 병합
  const displayStocks = (() => {
    if (!stockQuery) return POPULAR_STOCKS;
    // 프리셋 중 매칭
    const presetMatches = POPULAR_STOCKS.filter(
      (s) =>
        s.name.toLowerCase().includes(stockQuery.toLowerCase()) ||
        s.symbol.toLowerCase().includes(stockQuery.toLowerCase())
    );
    // API 검색 결과 중 프리셋과 중복 제거
    const presetSymbols = new Set(presetMatches.map((s) => s.symbol));
    const apiResults = searchedStocks.filter((s) => !presetSymbols.has(s.symbol));
    return [...presetMatches, ...apiResults];
  })();

  // --- 렌더: 랜딩 ---
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
        className="w-full max-w-xs bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-slate-900/30 flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        지금 바로 후회하러 가기 <ArrowRight className="w-5 h-5" />
      </motion.button>

      {/* TODO: Supabase에서 실데이터 연결 */}
      <div className="mt-12 text-sm text-slate-400">
        습관적 소비, 주식으로 바꿔보면 어떨까요?
      </div>
    </div>
  );

  // --- 렌더: 원페이지 시뮬레이션 폼 ---
  const renderSimulateForm = () => (
    <div className="px-6 py-8 pb-40">
      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-bold mb-1">후회 시뮬레이션</h2>
        <p className="text-slate-400 text-sm">소비 정보를 입력하면 수익률을 계산해드려요.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-5"
      >
        {/* 1. 소비 항목 — 롤링 placeholder + 검색/드롭다운 */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            소비 항목
          </label>
          <div ref={itemRef} className="relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4 z-10" />
              {/* 롤링 placeholder — 입력값이 없을 때만 표시 */}
              {!itemQuery && !showItemDropdown && (
                <RollingPlaceholder examples={PLACEHOLDER_EXAMPLES} />
              )}
              <input
                type="text"
                value={itemQuery}
                onChange={(e) => {
                  setItemQuery(e.target.value);
                  setShowItemDropdown(true);
                  // 프리셋과 정확히 매칭되면 자동 선택, 아니면 해제
                  const match = CONSUMPTION_ITEMS.find((item) => item.name === e.target.value);
                  if (match) {
                    handleSelectItem(match);
                  } else {
                    setSelectedItem(null);
                  }
                }}
                onFocus={() => setShowItemDropdown(true)}
                placeholder=""
                className={cn(
                  "w-full bg-white border rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all relative z-[1] placeholder:text-transparent",
                  selectedItem ? "border-brand-primary/30 bg-brand-primary/5" : "border-slate-200"
                )}
              />
              {selectedItem && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
                  <Check className="w-4 h-4 text-brand-primary" />
                </div>
              )}
            </div>

            {/* 프리셋 드롭다운 */}
            <AnimatePresence>
              {showItemDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden"
                >
                  {filteredItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectItem(item)}
                      className={cn(
                        "w-full px-4 py-3 text-left text-sm flex items-center gap-3 transition-colors",
                        selectedItem?.id === item.id
                          ? "bg-brand-primary/5 text-brand-primary font-bold"
                          : "hover:bg-slate-50 text-slate-700"
                      )}
                    >
                      <span className="text-brand-primary">{item.icon}</span>
                      <span className="flex-1">{item.name}</span>
                      <span className="text-slate-400 text-xs">{item.price.toLocaleString()}원</span>
                      {selectedItem?.id === item.id && <Check className="w-4 h-4 text-brand-primary" />}
                    </button>
                  ))}

                  {/* 프리셋에 없는 검색어 → 직접 입력 안내 */}
                  {itemQuery && filteredItems.length === 0 && (
                    <div className="px-4 py-3 text-sm text-slate-400 text-center">
                      아래에서 금액을 입력해주세요
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 커스텀 항목 금액 입력 — 프리셋에 없는 이름일 때 (커스텀 선택 상태에서도 수정 가능) */}
          <AnimatePresence>
            {itemQuery && !CONSUMPTION_ITEMS.some((item) => item.name === itemQuery) && (selectedItem?.id === 'custom' || !selectedItem) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 flex items-center gap-2 bg-slate-50 rounded-2xl border border-slate-200 p-2 pl-4">
                  <span className="text-sm text-slate-500 shrink-0">{itemQuery}</span>
                  <div className="relative flex-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={customPrice}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setCustomPrice(val);
                        // 금액 입력 즉시 반영
                        const price = parseInt(val);
                        if (val && !isNaN(price) && price > 0) {
                          setSelectedItem({
                            id: 'custom',
                            name: itemQuery,
                            price,
                            icon: <Bird className="w-5 h-5" />,
                          });
                        } else {
                          setSelectedItem(null);
                        }
                      }}
                      placeholder="금액 입력"
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                      autoFocus
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">원</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 선택 완료 칩 — 프리셋 선택 시만 표시 (커스텀은 위 입력란이 칩 역할) */}
          <AnimatePresence>
            {selectedItem && selectedItem.id !== 'custom' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mt-2 inline-flex items-center gap-2 bg-brand-primary/10 text-brand-primary text-xs font-bold px-3 py-1.5 rounded-full"
              >
                {selectedItem.icon}
                {selectedItem.name} · {selectedItem.price.toLocaleString()}원
                <button
                  type="button"
                  onClick={() => {
                    setSelectedItem(null);
                    setItemQuery('');
                    setCustomPrice('');
                  }}
                  className="ml-1 hover:text-brand-accent"
                >
                  ✕
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 2. 기간 */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            소비 기간
          </label>
          <DropdownSelector
            label=""
            options={PERIODS}
            selected={selectedPeriod}
            onSelect={setSelectedPeriod}
            renderOption={(p) => <span>{p.label} <span className="text-slate-400 text-xs ml-1">약 {p.days}일</span></span>}
            renderSelected={(p) => p.label}
            customInput={{
              placeholder: '예: 45',
              unit: '일',
              onSubmit: (days) => setSelectedPeriod({ id: 'custom', label: `${days}일`, days }),
            }}
          />
        </div>

        {/* 3. 빈도 */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            소비 빈도 {selectedPeriod ? `(${selectedPeriod.label} 동안)` : ''}
          </label>
          <DropdownSelector
            label=""
            options={FREQUENCIES}
            selected={selectedFrequency}
            onSelect={setSelectedFrequency}
            renderOption={(f) => <span>{f.label}</span>}
            renderSelected={(f) => f.label}
            customInput={{
              placeholder: '예: 15',
              unit: '번',
              onSubmit: (count) => setSelectedFrequency({ id: 'custom', label: `${count}번`, value: count }),
            }}
          />
        </div>

        {/* 4. 종목 — 검색 + 드롭다운 */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            투자 종목
          </label>
          <div ref={stockRef} className="relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4 z-10" />
              <input
                type="text"
                value={stockQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setStockQuery(val);
                  setShowStockDropdown(true);
                  searchStock(val);
                  const match = POPULAR_STOCKS.find((s) => s.name === val);
                  if (!match) setSelectedStock(null);
                }}
                onFocus={() => setShowStockDropdown(true)}
                placeholder="종목명 또는 심볼 검색"
                className={cn(
                  "w-full bg-white border rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all",
                  selectedStock ? "border-brand-primary/30 bg-brand-primary/5" : "border-slate-200"
                )}
              />
              {selectedStock && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <Check className="w-4 h-4 text-brand-primary" />
                </div>
              )}
            </div>

            <AnimatePresence>
              {showStockDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden max-h-60 overflow-y-auto"
                >
                  {/* 검색 중 로딩 */}
                  {isSearching && (
                    <div className="px-4 py-3 text-sm text-slate-400 text-center">검색 중...</div>
                  )}

                  {displayStocks.map((stock) => (
                    <button
                      key={stock.symbol}
                      type="button"
                      onClick={() => handleSelectStock(stock)}
                      className={cn(
                        "w-full px-4 py-3 text-left text-sm flex items-center gap-3 transition-colors",
                        selectedStock?.symbol === stock.symbol
                          ? "bg-brand-primary/5 text-brand-primary font-bold"
                          : "hover:bg-slate-50 text-slate-700"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                        selectedStock?.symbol === stock.symbol ? "bg-brand-primary/20 text-brand-primary" : "bg-slate-100 text-slate-500"
                      )}>
                        {stock.symbol.slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{stock.name}</div>
                      </div>
                      <span className="text-slate-400 text-xs shrink-0">{stock.symbol}</span>
                      {selectedStock?.symbol === stock.symbol && <Check className="w-4 h-4 text-brand-primary shrink-0" />}
                    </button>
                  ))}

                  {/* 검색 결과 없음 */}
                  {stockQuery && !isSearching && displayStocks.length === 0 && (
                    <div className="px-4 py-3 text-sm text-slate-400 text-center">
                      검색 결과가 없습니다
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {selectedStock && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-2 inline-flex items-center gap-2 bg-brand-primary/10 text-brand-primary text-xs font-bold px-3 py-1.5 rounded-full"
            >
              {selectedStock.name} · {selectedStock.symbol}
            </motion.div>
          )}
        </div>

        {/* 투자 금액 미리보기 */}
        <AnimatePresence>
          {selectedItem && selectedPeriod && selectedFrequency && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="text-xs text-slate-400 mb-1">예상 총 투자 금액</div>
                <div className="text-xl font-bold text-slate-900">
                  {(() => {
                    const freq = selectedFrequency.value === -1 ? selectedPeriod.days : selectedFrequency.value;
                    return (selectedItem.price * freq).toLocaleString();
                  })()}원
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {selectedItem.name} {selectedItem.price.toLocaleString()}원 ×{' '}
                  {selectedFrequency.value === -1 ? `매일 ${selectedPeriod.days}일` : `${selectedFrequency.value}번`}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* 하단 CTA */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 p-4 pb-8 bg-white/90 backdrop-blur-md border-t border-slate-100 z-50 max-w-md mx-auto"
      >
        {/* 미완성 안내 */}
        {!canSubmit && (
          <div className="text-xs text-slate-400 text-center mb-2">
            {[
              !selectedItem && '소비 항목',
              !selectedPeriod && '기간',
              !selectedFrequency && '빈도',
              !selectedStock && '종목',
            ].filter(Boolean).join(', ')}을(를) 선택해주세요
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={() => setCurrentStep('landing')}
            className="px-5 py-4 font-bold text-slate-500 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors"
          >
            취소
          </button>
          <button
            onClick={executeSimulation}
            disabled={!canSubmit}
            className="flex-1 py-4 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all"
            style={canSubmit
              ? { backgroundColor: '#FF6B35', color: '#fff', boxShadow: '0 10px 15px -3px rgba(255,107,53,0.3)' }
              : { backgroundColor: '#e2e8f0', color: '#94a3b8', cursor: 'not-allowed' }
            }
          >
            {canSubmit ? '결과 확인하기' : '모두 선택해주세요'}
            {canSubmit && <ArrowRight className="w-5 h-5" />}
          </button>
        </div>
      </motion.div>
    </div>
  );

  // --- 렌더: 결과 ---
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

    // 실제 주가 히스토리가 있으면 투자금 기준 가치 변동으로 변환
    const chartData = result.chartHistory && result.chartHistory.length > 1
      ? (() => {
          const basePrice = result.chartHistory![0].close;
          return result.chartHistory!.map((h) => ({
            name: h.date.slice(5), // MM-DD 형식
            value: Math.round(result.totalInvested * (h.close / basePrice)),
          }));
        })()
      : [
          { name: '투자 원금', value: result.totalInvested },
          { name: '현재 가치', value: result.currentValue },
        ];

    return (
      <div className="px-6 py-8 pb-12">
        {/* 수익률 헤더 */}
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
            <p className="text-slate-600 font-medium break-keep">
              {result.period.label} {result.frequency}번 소비한 <br />
              <span className="font-bold text-slate-900">{result.item.name}</span> 대신{' '}
              <span className="font-bold text-slate-900">{result.stock.name}</span>을 샀다면?
            </p>
          </div>
          <div className={cn(
            "absolute -bottom-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-20",
            isProfit ? "bg-profit" : "bg-loss"
          )} />
        </div>

        {/* 차트 카드 — min-h로 Recharts 경고 방지 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-sm text-slate-400 mb-1">현재 가치</div>
              <div className="text-2xl font-bold">{Math.round(result.currentValue).toLocaleString()}원</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-400 mb-1">후회 금액</div>
              <div className={cn("text-xl font-bold", isProfit ? "text-brand-accent" : "text-slate-400")}>
                {isProfit ? '+' : ''}{Math.round(result.regretAmount).toLocaleString()}원
              </div>
            </div>
          </div>

          <div className="h-48 w-full min-h-[192px] min-w-[200px] mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" hide />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`${(Number(value) || 0).toLocaleString()}원`, '가치']}
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

        {/* 계산 기준 각주 */}
        {result.buyDate && result.buyPrice != null && result.currentPrice != null && (() => {
          const cur = result.currency || 'KRW';
          const isKRW = cur === 'KRW';
          const fmtPrice = (v: number) => isKRW
            ? `${Math.round(v).toLocaleString()}원`
            : `$${v.toFixed(2)}`;
          return (
            <div className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100">
              <div className="text-xs font-bold text-slate-500 mb-3">계산 기준</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-slate-400">매수 기준일</div>
                  <div className="font-bold text-slate-700">{result.buyDate}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">현재 기준일</div>
                  <div className="font-bold text-slate-700">{new Date().toISOString().split('T')[0]}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">{result.stock.name} 매수 시 1주</div>
                  <div className="font-bold text-slate-700">{fmtPrice(result.buyPrice!)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">{result.stock.name} 현재 1주</div>
                  <div className="font-bold text-slate-700">{fmtPrice(result.currentPrice!)}</div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-400 leading-relaxed">
                {result.buyDate} 기준 {result.stock.name} 종가 {fmtPrice(result.buyPrice!)}로 매수했다면,
                {' '}오늘 종가 {fmtPrice(result.currentPrice!)} 기준 수익률 {result.profitRate > 0 ? '+' : ''}{result.profitRate.toFixed(2)}%를
                {' '}총 투자금 {result.totalInvested.toLocaleString()}원에 적용한 결과입니다.
                <br />※ Yahoo Finance 종가 기준 · 수수료/세금/환율 변동 미반영
              </div>
            </div>
          );
        })()}

        {/* 껄무새 코멘트 — 마스코트 아바타 포함 */}
        <div className="relative bg-brand-primary/5 rounded-3xl p-6 mb-8 border border-brand-primary/10">
          <div className="flex items-start gap-4">
            <button
              onClick={speakComment}
              className="shrink-0 relative"
              title="코멘트 듣기"
            >
              <ParrotMascot state={isProfit ? 'happy' : 'sad'} size="sm" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-brand-primary rounded-full flex items-center justify-center">
                <Volume2 className="w-3 h-3 text-white" />
              </div>
            </button>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-brand-primary uppercase tracking-wider mb-1">Kkeol-mu-sae says</div>
              <p className="text-slate-800 font-bold leading-relaxed break-keep">
                &ldquo;{result.comment}&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="grid grid-cols-2 gap-4">
          <button className="bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2">
            <Download className="w-5 h-5" /> 이미지 저장
          </button>
          <button className="bg-white border border-slate-200 text-slate-900 py-4 rounded-2xl font-bold flex items-center justify-center gap-2">
            <Share2 className="w-5 h-5" /> 링크 복사
          </button>
          <button
            onClick={handleRestart}
            className="col-span-2 bg-slate-100 text-slate-700 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors"
          >
            <RefreshCcw className="w-5 h-5" /> 처음부터 다시 시작
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#F9FAFB] relative overflow-hidden">
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
            {currentStep === 'simulate' && renderSimulateForm()}
            {currentStep === 'result' && renderResult()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
