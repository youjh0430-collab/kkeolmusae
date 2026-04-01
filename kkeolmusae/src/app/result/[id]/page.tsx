import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";
import ResultClient from "./ResultClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ResultPage({ params }: PageProps) {
  const { id } = await params;

  const { data: sim, error } = await supabaseAdmin
    .from("simulations")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !sim) {
    notFound();
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-h-screen">
      {/* 헤더 */}
      <div className="px-6 py-4 flex items-center justify-between bg-white shadow-sm z-10">
        <Link href="/simulate" className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </Link>
        <span className="font-bold text-gray-800">시뮬레이션 결과</span>
        <div className="w-10"></div>
      </div>

      <ResultClient simulation={sim} />
    </div>
  );
}
