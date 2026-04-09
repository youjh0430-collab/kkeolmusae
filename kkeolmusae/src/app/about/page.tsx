/**
 * Role: 프로젝트 소개 및 개발 히스토리 페이지
 * Key Features: 기술 스택, 개발 타임라인, 크레딧
 * Dependencies: lucide-react
 */

import { Code2, Database, Globe, Palette, Brain, Shield, GitCommit } from "lucide-react";

const techStack = [
  {
    category: "프레임워크",
    icon: <Code2 className="w-5 h-5" />,
    items: [
      { name: "Next.js", version: "16.2.2", desc: "React 기반 풀스택 프레임워크" },
      { name: "React", version: "19.2.4", desc: "UI 라이브러리" },
      { name: "TypeScript", version: "5.x", desc: "정적 타입 시스템" },
    ],
  },
  {
    category: "스타일링 & UI",
    icon: <Palette className="w-5 h-5" />,
    items: [
      { name: "Tailwind CSS", version: "4.x", desc: "유틸리티 퍼스트 CSS 프레임워크" },
      { name: "Framer Motion", version: "-", desc: "애니메이션 라이브러리" },
      { name: "Lucide React", version: "-", desc: "아이콘 라이브러리" },
    ],
  },
  {
    category: "백엔드 & 데이터",
    icon: <Database className="w-5 h-5" />,
    items: [
      { name: "Supabase", version: "2.x", desc: "인증(OAuth) + PostgreSQL 데이터베이스" },
      { name: "yahoo-finance2", version: "3.14.0", desc: "실시간 주가 데이터 API" },
    ],
  },
  {
    category: "배포 & 인프라",
    icon: <Globe className="w-5 h-5" />,
    items: [
      { name: "Vercel", version: "-", desc: "서버리스 배포 플랫폼" },
      { name: "GitHub", version: "-", desc: "소스 코드 관리 및 CI/CD" },
    ],
  },
  {
    category: "인증",
    icon: <Shield className="w-5 h-5" />,
    items: [
      { name: "Google OAuth", version: "-", desc: "구글 소셜 로그인" },
      { name: "Kakao OAuth", version: "-", desc: "카카오 소셜 로그인" },
    ],
  },
  {
    category: "AI 도구",
    icon: <Brain className="w-5 h-5" />,
    items: [
      { name: "Claude Code", version: "-", desc: "AI 페어 프로그래밍 (Anthropic)" },
      { name: "Google Gemini", version: "-", desc: "UI/UX 디자인 시안 생성" },
    ],
  },
];

const devHistory = [
  {
    date: "2026-03-31",
    title: "프로젝트 기획 & 스펙 문서 작성",
    desc: "껄무새 서비스 컨셉 확정, 기능 명세서 작성",
  },
  {
    date: "2026-04-01",
    title: "프로젝트 초기 세팅",
    desc: "Next.js 프로젝트 생성, Supabase 연동, DB 스키마 설계 (simulations, popular_items, popular_stocks 테이블)",
  },
  {
    date: "2026-04-01",
    title: "핵심 기능 개발",
    desc: "시뮬레이션 API 구현 (yahoo-finance2), 결과 페이지, 후회 랭킹, 시뮬레이션 기록 페이지 개발",
  },
  {
    date: "2026-04-01",
    title: "UI/UX 개선",
    desc: "에메랄드 테마 적용, 껄무새 마스코트 추가, 전역 Navbar, 로그인 모달 구현",
  },
  {
    date: "2026-04-02",
    title: "4단계 시뮬레이션 위저드",
    desc: "소비 항목 → 기간 → 빈도 → 종목 선택, 단계별 애니메이션 전환",
  },
  {
    date: "2026-04-03",
    title: "원페이지 시뮬레이션 리뉴얼",
    desc: "Gemini AI 시안 기반 SPA 마이그레이션, 종목 자동검색, 직접입력 기능 추가",
  },
  {
    date: "2026-04-08",
    title: "카카오 로그인 연동",
    desc: "Supabase OAuth Provider 설정, 카카오/구글 소셜 로그인 완성",
  },
  {
    date: "2026-04-08",
    title: "세션 관리 & 버그 수정",
    desc: "onAuthStateChange 리스너 적용, 주가 API historical() 메서드 전환",
  },
  {
    date: "2026-04-09",
    title: "Vercel 배포 & 프로젝트 히스토리 페이지",
    desc: "프로덕션 배포 완료, 기술 스택 및 개발 타임라인 정리",
  },
];

export default function AboutPage() {
  return (
    <div className="flex-1 bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-gray-800 mb-3">껄무새 프로젝트</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            &ldquo;그때 그 돈으로 주식을 샀더라면?&rdquo;<br />
            소비 대신 투자했을 때의 수익률을 시뮬레이션하는 서비스
          </p>
          <p className="text-xs text-gray-400 mt-2">PM AI Lab · 04. 금융 과제</p>
        </div>

        {/* 기술 스택 */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Code2 className="w-5 h-5 text-emerald-600" />
            기술 스택
          </h2>
          <div className="space-y-6">
            {techStack.map((group) => (
              <div key={group.category} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2 text-sm">
                  <span className="text-emerald-600">{group.icon}</span>
                  {group.category}
                </h3>
                <div className="space-y-2">
                  {group.items.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800">{item.name}</span>
                        {item.version !== "-" && (
                          <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-mono">
                            v{item.version}
                          </span>
                        )}
                      </div>
                      <span className="text-gray-400 text-xs">{item.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 개발 타임라인 */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <GitCommit className="w-5 h-5 text-emerald-600" />
            개발 히스토리
          </h2>
          <div className="relative">
            {/* 타임라인 세로선 */}
            <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-emerald-200" />

            <div className="space-y-6">
              {devHistory.map((entry, i) => (
                <div key={i} className="flex gap-4">
                  {/* 타임라인 점 */}
                  <div className="relative">
                    <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-sm mt-1" />
                  </div>
                  {/* 내용 */}
                  <div className="flex-1 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {entry.date}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-800 text-sm mb-1">{entry.title}</h3>
                    <p className="text-gray-500 text-xs leading-relaxed">{entry.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 크레딧 */}
        <section className="text-center text-xs text-gray-400 border-t border-gray-200 pt-6">
          <p>Built with Next.js + Supabase + Yahoo Finance</p>
          <p className="mt-1">AI-assisted development by Claude Code & Google Gemini</p>
          <p className="mt-1">&copy; 2026 껄무새 · PM AI Lab</p>
        </section>
      </div>
    </div>
  );
}
