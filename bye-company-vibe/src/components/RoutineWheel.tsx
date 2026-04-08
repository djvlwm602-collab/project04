/**
 * 역할: 24시간 원형 일과표 SVG 컴포넌트
 * 핵심 기능: 각 RoutineItem을 부채꼴로 렌더링, 세그먼트 안에 이모지+텍스트, 중앙에 총 시간 표시
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

// 세그먼트 중심점 계산 (도넛 중간 지점)
function segmentLabelPos(cx: number, cy: number, r: number, startHour: number, durationHours: number) {
  const midAngle = (startHour / TOTAL_HOURS) * 360 + (durationHours / TOTAL_HOURS) * 180;
  // 도넛 안쪽(r*0.45)과 바깥(r) 사이 정중앙
  const labelR = r * 0.725;
  return { pos: polarToCartesian(cx, cy, labelR, midAngle), midAngle };
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

      {/* 세그먼트 텍스트 — 1시간 이상이면 표시, 시간에 비례해 글자 수·크기 조절 */}
      {items.map((item) => {
        if (item.durationHours < 1) return null;
        const { pos } = segmentLabelPos(cx, cy, r, item.startHour, item.durationHours);
        const maxChars = item.durationHours >= 3 ? 4 : item.durationHours >= 2 ? 3 : 2;
        const label = item.activity.length > maxChars ? item.activity.slice(0, maxChars) : item.activity;
        const fontSize = 11;

        return (
          <text
            key={`label-${item.id}`}
            x={pos.x}
            y={pos.y}
            dy="0.35em"
            textAnchor="middle"
            fontSize={fontSize}
            fontWeight="700"
            fill="#fff"
          >
            {label}
          </text>
        );
      })}

      {/* 중앙 텍스트 */}
      <text x={cx} y={cy - 10} textAnchor="middle" fontSize={18} fontWeight="800" fill="#374151">
        {totalHours}h
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize={12} fill="#9ca3af">
        / 24시간
      </text>
    </svg>
  );
}
