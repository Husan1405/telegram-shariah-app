import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Baby,
  Crown,
  Heart,
  HeartHandshake,
  Info,
  RotateCcw,
  Scale,
  Scroll,
  User,
  Users,
  Wallet,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Counter } from '@/components/ui/Counter';
import { CurrencyPicker } from '@/components/ui/CurrencyPicker';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { PieChart, PIE_PALETTE } from '@/components/ui/PieChart';
import { calculateInheritance, EMPTY_HEIRS } from '@/utils/inheritance';
import { formatFraction, formatMoney, parseNumber } from '@/utils/format';
import type { CurrencyCode, HeirsState, InheritanceInput } from '@/types';
import { useTelegram } from '@/hooks/useTelegram';

interface HeirConfig {
  key: keyof HeirsState;
  label: string;
  icon: React.ReactNode;
  /** When true, value is binary 0/1 (max=1). */
  binary?: boolean;
  max?: number;
}

const heirConfig: HeirConfig[] = [
  { key: 'husband', label: 'Муж', icon: <Heart size={18} />, binary: true },
  { key: 'wife', label: 'Жёны', icon: <HeartHandshake size={18} />, max: 4 },
  { key: 'sons', label: 'Сыновья', icon: <User size={18} /> },
  { key: 'daughters', label: 'Дочери', icon: <Baby size={18} /> },
  { key: 'father', label: 'Отец', icon: <Crown size={18} />, binary: true },
  { key: 'mother', label: 'Мать', icon: <Crown size={18} />, binary: true },
  { key: 'grandfather', label: 'Дедушка', icon: <User size={18} />, binary: true },
  { key: 'grandmother', label: 'Бабушка', icon: <User size={18} />, binary: true },
  { key: 'brothers', label: 'Братья', icon: <Users size={18} /> },
  { key: 'sisters', label: 'Сёстры', icon: <Users size={18} /> },
];

export function InheritanceCalculator() {
  const { haptic, selectionChanged, notify } = useTelegram();
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [total, setTotal] = useState<number>(0);
  const [debts, setDebts] = useState<number>(0);
  const [bequest, setBequest] = useState<number>(0);
  const [heirs, setHeirs] = useState<HeirsState>(EMPTY_HEIRS);

  const input: InheritanceInput = useMemo(
    () => ({ total, debts, bequest, heirs }),
    [total, debts, bequest, heirs],
  );

  const result = useMemo(() => calculateInheritance(input), [input]);

  const setHeir = (key: keyof HeirsState, v: number) => {
    setHeirs((h) => ({ ...h, [key]: v } as HeirsState));
  };

  const reset = () => {
    setTotal(0);
    setDebts(0);
    setBequest(0);
    setHeirs(EMPTY_HEIRS);
    notify('warning');
  };

  const pieSlices = result.shares.map((s, idx) => ({
    label: s.label,
    value: s.fraction,
    color: PIE_PALETTE[idx % PIE_PALETTE.length],
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto flex w-full max-w-md flex-col gap-4 px-5 safe-pt safe-pb"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-400/40 to-gold-600/10 ring-1 ring-gold-500/30">
            <Scale size={20} className="text-gold-400" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-tg-hint">Мираc</div>
            <div className="text-lg font-bold text-tg-text">Калькулятор наследства</div>
          </div>
        </div>
        <CurrencyPicker value={currency} onChange={setCurrency} onHaptic={haptic} />
      </div>

      {/* Estate inputs */}
      <Card variant="solid" className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-gold-400" />
          <div className="text-[11px] font-semibold uppercase tracking-wider text-tg-hint">
            Состав наследства
          </div>
        </div>

        <Input
          label="Общая сумма наследства"
          icon={<Wallet size={18} />}
          value={total === 0 ? '' : String(total)}
          onChange={(e) => setTotal(parseNumber(e.target.value))}
          placeholder="0"
        />
        <Input
          label="Долги умершего"
          icon={<Scroll size={18} />}
          hint="Списываются в первую очередь"
          value={debts === 0 ? '' : String(debts)}
          onChange={(e) => setDebts(parseNumber(e.target.value))}
          placeholder="0"
        />
        <Input
          label="Завещание (васыйя)"
          icon={<Scroll size={18} />}
          hint="Не более 1/3 от чистого наследства"
          value={bequest === 0 ? '' : String(bequest)}
          onChange={(e) => setBequest(parseNumber(e.target.value))}
          placeholder="0"
        />
      </Card>

      {/* Heirs */}
      <Card variant="solid" className="space-y-2.5">
        <div className="mb-1 flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-emerald-400" />
          <div className="text-[11px] font-semibold uppercase tracking-wider text-tg-hint">
            Наследники
          </div>
        </div>

        {heirConfig.map((h) => (
          <Counter
            key={h.key}
            label={h.label}
            icon={h.icon}
            value={heirs[h.key] as number}
            onChange={(v) => setHeir(h.key, v)}
            max={h.binary ? 1 : h.max ?? 20}
            onHaptic={selectionChanged}
          />
        ))}

        <Button variant="ghost" icon={<RotateCcw size={16} />} onClick={reset} className="mt-3 w-full">
          Сбросить
        </Button>
      </Card>

      {/* Warnings */}
      <AnimatePresence>
        {result.warnings.length ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
          >
            <Card variant="glass" className="border-amber-300/20">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-xl bg-amber-400/15 p-1.5">
                  <AlertTriangle size={16} className="text-amber-300" />
                </div>
                <div className="space-y-1.5 text-[12.5px] leading-relaxed text-amber-100/90">
                  {result.warnings.map((w, i) => (
                    <div key={i}>{w}</div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {result.shares.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
            className="flex flex-col gap-3"
          >
            {/* Overview */}
            <Card variant="gradient" glow className="overflow-visible">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-gold-400/90">
                    К распределению
                  </div>
                  <div className="mt-1 font-display text-3xl font-extrabold leading-none text-tg-text">
                    <AnimatedNumber
                      value={result.distributable}
                      format={(n) => formatMoney(n, currency)}
                    />
                  </div>
                  <div className="mt-1 text-[12px] text-tg-hint">
                    После долгов и завещания
                  </div>
                </div>

                <PieChart
                  slices={pieSlices}
                  size={120}
                  thickness={14}
                  centerLabel="Долей"
                  centerValue={String(result.shares.length)}
                />
              </div>
            </Card>

            {/* Per-heir cards */}
            <div className="flex flex-col gap-2.5">
              {result.shares.map((s, idx) => (
                <motion.div
                  key={s.key}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.06 }}
                >
                  <Card variant="glass" noPadding className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-2xl ring-1 ring-white/15"
                          style={{
                            background: `${PIE_PALETTE[idx % PIE_PALETTE.length]}22`,
                            color: PIE_PALETTE[idx % PIE_PALETTE.length],
                          }}
                        >
                          <Users size={16} />
                        </div>
                        <div>
                          <div className="text-[15px] font-bold text-tg-text">
                            {s.label}
                            {s.count > 1 ? (
                              <span className="ml-1 text-xs text-tg-hint">× {s.count}</span>
                            ) : null}
                          </div>
                          <div className="text-[11px] text-tg-hint">
                            {formatFraction(s.fraction)} ·{' '}
                            {(s.fraction * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[15px] font-bold text-tg-text tabular-nums">
                          <AnimatedNumber
                            value={s.amount}
                            format={(n) => formatMoney(n, currency)}
                          />
                        </div>
                        {s.count > 1 ? (
                          <div className="text-[11px] text-tg-hint tabular-nums">
                            по {formatMoney(s.perPerson, currency)}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* fraction bar */}
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, s.fraction * 100)}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ background: PIE_PALETTE[idx % PIE_PALETTE.length] }}
                      />
                    </div>

                    {s.reason ? (
                      <div className="mt-2 text-[11.5px] leading-relaxed text-tg-hint">
                        {s.reason}
                      </div>
                    ) : null}
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Info note */}
      <Card variant="glass" className="text-[12px] leading-relaxed text-tg-hint">
        <div className="flex gap-2">
          <Info size={16} className="mt-0.5 shrink-0 text-gold-400" />
          <div>
            Алгоритм покрывает базовые правила фард и асаба. Для случаев Аул, Радд, Калала и других
            сложных конфигураций — обратитесь к квалифицированному учёному.
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
