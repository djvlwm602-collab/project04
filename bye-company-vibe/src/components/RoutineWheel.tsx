/**
 * 역할: 24시간 원형 일과표 SVG 컴포넌트
 * 핵심 기능: 각 RoutineItem을 부채꼴로 렌더링, 중앙에 총 시간 표시
 * 의존: lib/types
 */
"use client";

import type { RoutineItem } from "@/lib/types";

interface Props {
  items: RoutineItem[];
  size?: number;
}

const TOTAL_HOURS = 24;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startHour: number, durationHours: number): string {
  const startAngle = (startHour / TOTAL_HOURS) * 360;
  const endAngle = ((startHour + durationHours) / TOTAL_HOURS) * 360;
  const largeArc = durationHours / TOTAL_HOURS > 0.5 ? 1 : 0;
  const s = polarToCartesian(cx, cy, r, startAngle);
  const e = polarToCartesian(cx, cy, r, endAngle);
  return `M${cx},${cy} L${s.x},${s.y} A${r},${r} 0 ${largeArc},1 ${e.x},${e.y} Z`;
}

export function RoutineWheel({ items, size = 280 }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 10;
  const totalHours = items.reduce((sum, i) => sum + i.durationHours, 0);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* 빈 배경 원 */}
      <circle cx={cx} cy={cy} r={r} fill="#f3f4f6" />

      {/* 각 항목 부채꼴 */}
      {items.map((item) => (
        <path
          key={item.id}
          d={arcPath(cx, cy, r, item.startHour, item.durationHours)}
          fill={item.color}
          stroke="#fff"
          strokeWidth={2}
        />
      ))}

      {/* 중앙 원 (도넛 효과) */}
      <circle cx={cx} cy={cy} r={r * 0.45} fill="#fff" />

      {/* 중앙 텍스트 */}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize={14} fontWeight="800" fill="#374151">
        {totalHours}h
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize={10} fill="#9ca3af">
        / 24시간
      </text>
    </svg>
  );
}
