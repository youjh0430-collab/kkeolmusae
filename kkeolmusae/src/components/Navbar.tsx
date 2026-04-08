"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, Clock, LogIn, LogOut, Menu, X } from "lucide-react";
import { supabaseClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import LoginModal from "@/components/LoginModal";

import ParrotMascot from "@/components/ParrotMascot";

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabaseClient.auth.getSession();
      setUser(session?.user ?? null);
    };
    getUser();

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabaseClient.auth.signOut();
    setUser(null);
    setMenuOpen(false);
  };

  const navLinks = [
    { href: "/ranking", label: "후회 랭킹", icon: <Trophy className="w-4 h-4" /> },
    { href: "/history", label: "내 기록", icon: <Clock className="w-4 h-4" /> },
  ];

  return (
    <>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      <nav className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        <Link href="/" className="font-extrabold text-xl text-primary tracking-tight flex items-center gap-2">
          <ParrotMascot variant="icon" />
          껄무새
        </Link>

        {/* 데스크톱 메뉴 */}
        <div className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center space-x-1.5 text-sm font-semibold transition-colors ${
                pathname === link.href ? "text-primary" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          ))}
          {user ? (
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1.5 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>로그아웃</span>
            </button>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className="flex items-center space-x-1.5 text-sm font-semibold bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary-hover transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>로그인</span>
            </button>
          )}
        </div>

        {/* 모바일 햄버거 */}
        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100">
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* 모바일 드롭다운 */}
      {menuOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 px-6 py-4 space-y-3 sticky top-[57px] z-30">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center space-x-2 py-2 font-semibold ${
                pathname === link.href ? "text-primary" : "text-gray-600"
              }`}
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          ))}
          {user ? (
            <button onClick={handleLogout} className="flex items-center space-x-2 py-2 font-semibold text-gray-600">
              <LogOut className="w-4 h-4" />
              <span>로그아웃</span>
            </button>
          ) : (
            <button
              onClick={() => { setShowLogin(true); setMenuOpen(false); }}
              className="flex items-center space-x-2 py-2 font-semibold text-primary"
            >
              <LogIn className="w-4 h-4" />
              <span>로그인</span>
            </button>
          )}
        </div>
      )}
    </>
  );
}
