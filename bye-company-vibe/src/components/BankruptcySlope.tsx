/**
 * 역할: 파산 슬로프 라인 차트 — 적립기(상승) + 인출기(하강)
 * 핵심 기능: recharts LineChart, 파산 시점 빨간 점, 단계별 색상 구분
 * 의존: recharts, lib/types
 */
"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from "recharts";
import type { AssetDataPoint } from "@/lib/types";

interface Props {
  data: AssetDataPoint[];
  retirementLabel: string;
}

function formatAssets(value: number): string {
  if (value >= 100000000) return `${(value / 100000000).toFixed(1)}억`;
  if (value >= 10000) return `${Math.round(value / 10000)}만`;
  return "0";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function BankruptcyDot(props: any) {
  const { cx, cy, payload } = props;
  if (payload.assets !== 0) return null;
  return <circle cx={cx} cy={cy} r={6} fill="#ef4444" stroke="#fff" strokeWidth={2} />;
}

export function BankruptcySlope({ data, retirementLabel }: Props) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "#9ca3af" }}
          interval="preserveStartEnd"
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatAssets}
          tick={{ fontSize: 10, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
          width={40}
        />
        <Tooltip
          formatter={(value: number) => [formatAssets(value), "자산"]}
          labelStyle={{ fontSize: 12, fontWeight: "bold" }}
          contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
        />
        <ReferenceLine
          x={retirementLabel}
          stroke="#FEE500"
          strokeDasharray="4 4"
          label={{ value: "은퇴", position: "top", fontSize: 11, fill: "#92400e" }}
        />
        <Line
          type="monotone"
          dataKey="assets"
          stroke="#22c55e"
          strokeWidth={2.5}
          dot={<BankruptcyDot />}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
