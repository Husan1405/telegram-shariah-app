import type { InputHTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  icon?: ReactNode;
  suffix?: ReactNode;
  hint?: string;
}

/**
 * Premium input with floating label feel. Designed for number entry on mobile
 * but accepts any input type.
 */
export function Input({
  label,
  icon,
  suffix,
  hint,
  className = '',
  ...rest
}: Props) {
  return (
    <motion.label
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="block"
    >
      {label ? (
        <span className="mb-1.5 ml-1 block text-[12px] font-medium uppercase tracking-wider text-tg-hint">
          {label}
        </span>
      ) : null}

      <div
        className={[
          'group relative flex h-14 items-center gap-3 rounded-2xl',
          'glass px-4 transition-all',
          'focus-within:border-emerald-400/60 focus-within:shadow-glow',
        ].join(' ')}
      >
        {icon ? <span className="text-tg-hint group-focus-within:text-emerald-400">{icon}</span> : null}
        <input
          inputMode="decimal"
          className={[
            'flex-1 bg-transparent text-[17px] font-semibold text-tg-text placeholder:text-tg-hint/50',
            'outline-none',
            className,
          ].join(' ')}
          {...rest}
        />
        {suffix ? <span className="shrink-0 text-sm text-tg-hint">{suffix}</span> : null}
      </div>

      {hint ? <span className="mt-1 ml-1 block text-xs text-tg-hint">{hint}</span> : null}
    </motion.label>
  );
}
