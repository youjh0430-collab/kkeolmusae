"use client";

import dynamic from "next/dynamic";

const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false });
const LineChart = dynamic(() => import("recharts").then((m) => m.LineChart), { ssr: false });
const Line = dynamic(() => import("recharts").then((m) => m.Line), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false });

interface ChartData {
  name: string;
  price: number;
}

interface Props {
  ticker: string;
  isProfit: boolean;
  data: ChartData[];
}

export default function ResultChart({ ticker, isProfit, data }: Props) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100 animate-in fade-in slide-in-from-bottom-4 delay-200">
      <h3 className="font-bold text-gray-800 mb-4 flex items-center justify-between">
        <span>주가 변동</span>
        <span className="text-xs text-gray-400 font-normal">{ticker}</span>
      </h3>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} tickMargin={10} stroke="#9ca3af" />
            <Tooltip
              contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
              itemStyle={{ color: "#10b981", fontWeight: "bold" }}
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
  );
}
