import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { CURRENCIES } from '@/constants';
import type { CurrencyCode } from '@/types';

interface Props {
  value: CurrencyCode;
  onChange: (c: CurrencyCode) => void;
  onHaptic?: () => void;
}

export function CurrencyPicker({ value, onChange, onHaptic }: Props) {
  const [open, setOpen] = useState(false);
  const current = CURRENCIES.find((c) => c.code === value)!;

  return (
    <div className="relative">
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={() => {
          setOpen((v) => !v);
          onHaptic?.();
        }}
        className="glass flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-semibold text-tg-text"
      >
        <span className="text-base">{current.flag}</span>
        <span>{current.code}</span>
        <ChevronDown
          size={14}
          className={['text-tg-hint transition-transform', open ? 'rotate-180' : ''].join(' ')}
        />
      </motion.button>

      <AnimatePresence>
        {open ? (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }}
              transition={{ duration: 0.18 }}
              className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-2xl border border-white/10 bg-tg-bg-secondary/95 p-1 shadow-glass-lg backdrop-blur-xl"
            >
              {CURRENCIES.map((c) => (
                <motion.button
                  key={c.code}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    onChange(c.code);
                    setOpen(false);
                    onHaptic?.();
                  }}
                  className={[
                    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                    c.code === value ? 'bg-emerald-500/15' : 'hover:bg-white/5',
                  ].join(' ')}
                >
                  <span className="text-lg">{c.flag}</span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-tg-text">{c.code}</span>
                    <span className="block text-xs text-tg-hint">{c.label}</span>
                  </span>
                  {c.code === value ? <Check size={16} className="text-emerald-400" /> : null}
                </motion.button>
              ))}
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
