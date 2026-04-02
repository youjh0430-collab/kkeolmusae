"use client";

import { X } from "lucide-react";
import { supabaseClient } from "@/lib/supabase";
import ParrotMascot from "@/components/ParrotMascot";

interface Props {
  onClose: () => void;
}

export default function LoginModal({ onClose }: Props) {
  const handleLogin = async (provider: 'google' | 'kakao') => {
    await supabaseClient.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm relative shadow-2xl animate-in zoom-in-95 duration-200 text-center">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
          <X className="w-5 h-5" />
        </button>

        <ParrotMascot className="scale-75 -my-4 mx-auto" emotion="excited" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2 mt-2">앗, 로그인이 필요해요!</h2>
        <p className="text-gray-500 mb-6 text-sm">무료 시뮬레이션 1회를 모두 사용하셨습니다.<br/>3초만에 로그인하고 무제한으로 즐겨보세요! 💸</p>

        <div className="space-y-3">
          <button 
            onClick={() => handleLogin('kakao')}
            className="w-full bg-[#FEE500] text-black/85 font-bold py-3.5 rounded-2xl flex items-center justify-center space-x-2 hover:brightness-95 transition-all shadow-sm"
          >
            <span>카카오로 시작하기</span>
          </button>
          
          <button 
            onClick={() => handleLogin('google')}
            className="w-full bg-white border border-gray-200 text-gray-700 font-bold py-3.5 rounded-2xl flex items-center justify-center space-x-2 hover:bg-gray-50 transition-all shadow-sm"
          >
            <span>Google로 시작하기</span>
          </button>
        </div>
      </div>
    </div>
  );
}
