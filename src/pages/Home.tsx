import { motion } from 'framer-motion';
import { Calculator, ChevronRight, Scale } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { PageKey } from '@/App';

interface Props {
  onNavigate: (p: PageKey) => void;
  onHaptic?: () => void;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 24 } },
};

export function Home({ onNavigate, onHaptic }: Props) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="mx-auto flex w-full max-w-md flex-col gap-6 px-5 safe-pt safe-pb"
    >
      {/* Greeting */}
      <motion.div variants={item} className="mt-4">
        <h1 className="font-display text-[34px] font-extrabold leading-tight text-tg-text">
          Ассаламу <span className="text-gradient-emerald">алейкум</span>
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-tg-hint">
          Исламские финансовые инструменты по нормам шариата.
        </p>
      </motion.div>

      {/* Action cards */}
      <motion.div variants={item} className="flex flex-col gap-3">
        <ActionCard
          title="Калькулятор закята"
          subtitle="Рассчитайте обязательный закят за год"
          icon={<Calculator size={22} className="text-emerald-300" />}
          gradient="from-emerald-500/25 via-emerald-400/10 to-transparent"
          onClick={() => {
            onNavigate('zakat');
            onHaptic?.();
          }}
        />
        <ActionCard
          title="Калькулятор наследства"
          subtitle="Распределение по нормам шариата"
          icon={<Scale size={22} className="text-gold-400" />}
          gradient="from-gold-500/25 via-gold-400/10 to-transparent"
          onClick={() => {
            onNavigate('inheritance');
            onHaptic?.();
          }}
        />
      </motion.div>

      {/* Footer hint */}
      <motion.div
        variants={item}
        className="mt-2 text-center text-[11px] leading-relaxed text-tg-hint/70"
      >
        Результаты являются ориентировочными.
        <br />
        В сложных случаях обратитесь к учёному.
      </motion.div>
    </motion.div>
  );
}

interface ActionCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  gradient: string;
  onClick: () => void;
}

function ActionCard({ title, subtitle, icon, gradient, onClick }: ActionCardProps) {
  return (
    <Card
      variant="glass"
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="cursor-pointer"
    >
      {/* Inner gradient wash */}
      <div className={['absolute inset-0 bg-gradient-to-br opacity-80', gradient].join(' ')} />

      <div className="relative flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur-md">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[17px] font-bold leading-tight text-tg-text">{title}</div>
          <div className="mt-0.5 truncate text-[13px] text-tg-hint">{subtitle}</div>
        </div>
        <ChevronRight size={20} className="text-tg-hint" />
      </div>
    </Card>
  );
}
