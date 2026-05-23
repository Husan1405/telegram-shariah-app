import { motion } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';

interface Props {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  /** Optional label, shown to the left of the stepper. */
  label?: string;
  /** Optional icon shown before label. */
  icon?: React.ReactNode;
  onHaptic?: () => void;
}

/**
 * Premium +/- stepper used for heir counts.
 */
export function Counter({
  value,
  onChange,
  min = 0,
  max = 99,
  label,
  icon,
  onHaptic,
}: Props) {
  const change = (delta: number) => {
    const next = Math.min(max, Math.max(min, value + delta));
    if (next !== value) {
      onChange(next);
      onHaptic?.();
    }
  };

  const active = value > 0;

  return (
    <motion.div
      layout
      className={[
        'flex items-center justify-between gap-3 rounded-2xl px-4 py-3',
        'glass transition-colors',
        active ? 'border-emerald-400/40 shadow-glow' : '',
      ].join(' ')}
    >
      <div className="flex min-w-0 items-center gap-3">
        {icon ? (
          <div
            className={[
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
              active
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'bg-white/5 text-tg-hint',
            ].join(' ')}
          >
            {icon}
          </div>
        ) : null}
        <span className="truncate text-[15px] font-medium text-tg-text">{label}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => change(-1)}
          className={[
            'flex h-9 w-9 items-center justify-center rounded-full',
            value <= min
              ? 'bg-white/5 text-tg-hint/40'
              : 'bg-white/10 text-tg-text hover:bg-white/15',
          ].join(' ')}
          disabled={value <= min}
          aria-label="Уменьшить"
        >
          <Minus size={16} />
        </motion.button>

        <motion.span
          key={value}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={[
            'min-w-[28px] text-center text-base font-bold tabular-nums',
            active ? 'text-emerald-300' : 'text-tg-hint',
          ].join(' ')}
        >
          {value}
        </motion.span>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => change(1)}
          className={[
            'flex h-9 w-9 items-center justify-center rounded-full',
            value >= max
              ? 'bg-white/5 text-tg-hint/40'
              : 'bg-emerald-500/30 text-emerald-300 hover:bg-emerald-500/40',
          ].join(' ')}
          disabled={value >= max}
          aria-label="Увеличить"
        >
          <Plus size={16} />
        </motion.button>
      </div>
    </motion.div>
  );
}
