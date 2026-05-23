import { motion } from 'framer-motion';

export interface PieSlice {
  label: string;
  value: number;
  color: string;
}

interface Props {
  slices: PieSlice[];
  size?: number;
  /** Stroke width for the donut. */
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}

/**
 * Lightweight SVG donut chart with animated arcs (no chart lib).
 */
export function PieChart({
  slices,
  size = 220,
  thickness = 24,
  centerLabel,
  centerValue,
}: Props) {
  const radius = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* track */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={thickness}
        />
        {slices.map((s, idx) => {
          const fraction = s.value / total;
          const len = circumference * fraction;
          const dasharray = `${len} ${circumference - len}`;
          const dashoffset = -offset;
          offset += len;
          return (
            <motion.circle
              key={s.label + idx}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeLinecap="butt"
              strokeDasharray={dasharray}
              strokeDashoffset={dashoffset}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.08 + 0.1, duration: 0.5 }}
            />
          );
        })}
      </svg>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        {centerLabel ? (
          <span className="text-[11px] uppercase tracking-wider text-tg-hint">{centerLabel}</span>
        ) : null}
        {centerValue ? (
          <span className="mt-0.5 text-lg font-bold text-tg-text">{centerValue}</span>
        ) : null}
      </div>
    </div>
  );
}

/** A palette suited to the premium dark theme. */
export const PIE_PALETTE = [
  '#10b981',
  '#eab308',
  '#06b6d4',
  '#a855f7',
  '#f97316',
  '#f43f5e',
  '#3b82f6',
  '#84cc16',
  '#ec4899',
  '#8b5cf6',
];
