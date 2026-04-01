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
                        {sim.item_name} &rarr; {sim.stock_name}
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
