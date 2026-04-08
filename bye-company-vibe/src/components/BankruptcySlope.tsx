/**
 * 역할: 파산 슬로프 라인 차트 — 적립기(상승) + 인출기(하강)
 * 핵심 기능: recharts LineChart, 은퇴/파산 시점 동일 스타일 뱃지 레이블
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

// 은퇴 기준선 뱃지 레이블
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RetirementLabel({ viewBox }: any) {
  const x = viewBox?.x ?? 0;
  const y = viewBox?.y ?? 0;
  const w = 34;
  const h = 18;
  return (
    <g>
      <rect x={x - w / 2} y={y - h - 2} width={w} height={h} rx={5} fill="#f3f4f6" />
      <text x={x} y={y - h / 2 - 2} textAnchor="middle" dy="0.35em" fontSize={10} fontWeight="700" fill="#6b7280">
        은퇴
      </text>
    </g>
  );
}

// 파산 시점 — 뱃지 레이블 + 점
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function BankruptcyDot(props: any) {
  const { cx, cy, payload } = props;
  if (payload.assets !== 0) return null;
  const w = 34;
  const h = 18;
  return (
    <g>
      <circle cx={cx} cy={cy} r={5} fill="#ef4444" stroke="#fff" strokeWidth={2} />
      <rect x={cx - w / 2} y={cy - h - 6} width={w} height={h} rx={5} fill="#fef2f2" />
      <text x={cx} y={cy - h / 2 - 6} textAnchor="middle" dy="0.35em" fontSize={10} fontWeight="700" fill="#ef4444">
        파산
      </text>
    </g>
  );
}

export function BankruptcySlope({ data, retirementLabel }: Props) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 36, right: 16, left: 0, bottom: 0 }}>
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
          formatter={(value) => [formatAssets(Number(value ?? 0)), "자산"]}
          labelStyle={{ fontSize: 12, fontWeight: "bold", color: "#111" }}
          contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
          itemStyle={{ fontSize: 13, fontWeight: "700", color: "#ef4444" }}
        />
        <ReferenceLine
          x={retirementLabel}
          stroke="#d1d5db"
          strokeDasharray="4 4"
          label={<RetirementLabel />}
        />
        <Line
          type="monotone"
          dataKey="assets"
          stroke="#9ca3af"
          strokeWidth={2.5}
          dot={<BankruptcyDot />}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
