import { motion } from 'framer-motion';
import { Calculator, Home as HomeIcon, Scale } from 'lucide-react';
import type { PageKey } from '@/App';

interface Props {
  active: PageKey;
  onNavigate: (p: PageKey) => void;
  onHaptic?: () => void;
}

const items: Array<{ key: PageKey; label: string; Icon: typeof HomeIcon }> = [
  { key: 'home', label: 'Главная', Icon: HomeIcon },
  { key: 'zakat', label: 'Закят', Icon: Calculator },
  { key: 'inheritance', label: 'Наследство', Icon: Scale },
];

export function BottomNav({ active, onNavigate, onHaptic }: Props) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 px-3 pt-2"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}
    >
      <div className="glass-strong relative mx-auto flex max-w-md items-center justify-around rounded-3xl px-2 py-2 shadow-glass-lg">
        {items.map(({ key, label, Icon }) => {
          const isActive = key === active;
          return (
            <motion.button
              key={key}
              whileTap={{ scale: 0.92 }}
              onClick={() => {
                if (key !== active) {
                  onNavigate(key);
                  onHaptic?.();
                }
              }}
              className="relative flex flex-1 flex-col items-center gap-1 rounded-2xl py-2"
            >
              {isActive ? (
                <motion.div
                  layoutId="bottom-nav-pill"
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-400/25 to-emerald-600/15 ring-1 ring-emerald-400/40"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              ) : null}
              <Icon
                size={20}
                className={[
                  'relative z-10 transition-colors',
                  isActive ? 'text-emerald-300' : 'text-tg-hint',
                ].join(' ')}
              />
              <span
                className={[
                  'relative z-10 text-[11px] font-medium transition-colors',
                  isActive ? 'text-emerald-200' : 'text-tg-hint',
                ].join(' ')}
              >
                {label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
