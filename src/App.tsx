import { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Background } from '@/components/Background';
import { BottomNav } from '@/components/BottomNav';
import { Home } from '@/pages/Home';
import { ZakatCalculator } from '@/pages/ZakatCalculator';
import { InheritanceCalculator } from '@/pages/InheritanceCalculator';
import { useTelegram } from '@/hooks/useTelegram';
import { useBackButton } from '@/hooks/useBackButton';

export type PageKey = 'home' | 'zakat' | 'inheritance';

const variants = {
  initial: { opacity: 0, y: 16, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -10, scale: 0.985 },
};

export default function App() {
  const { haptic, isReady } = useTelegram();
  const [page, setPage] = useState<PageKey>('home');

  const navigate = useCallback(
    (p: PageKey) => {
      setPage(p);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [],
  );

  // Telegram back button takes user from a sub-page back to home.
  useBackButton(page !== 'home', () => navigate('home'));

  if (!isReady) {
    return (
      <>
        <Background />
        <div className="flex h-screen items-center justify-center">
          <div className="h-10 w-10 rounded-full border-2 border-emerald-400/40 border-t-emerald-400 animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <Background />

      <main className="relative min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            {page === 'home' && <Home onNavigate={navigate} onHaptic={haptic} />}
            {page === 'zakat' && <ZakatCalculator />}
            {page === 'inheritance' && <InheritanceCalculator />}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav active={page} onNavigate={navigate} onHaptic={haptic} />
    </>
  );
}
