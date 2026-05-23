import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Banknote,
  Bitcoin,
  CheckCircle2,
  Coins,
  CreditCard,
  Gem,
  Info,
  Moon,
  RefreshCw,
  RotateCcw,
  ShoppingBag,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { CurrencyPicker } from '@/components/ui/CurrencyPicker';
import { calculateZakat, EMPTY_ZAKAT_INPUT } from '@/utils/zakat';
import { formatMoney, parseNumber } from '@/utils/format';
import type { CurrencyCode, ZakatInput } from '@/types';
import { useTelegram } from '@/hooks/useTelegram';
import { useRates } from '@/hooks/useRates';

const fields: Array<{
  key: keyof ZakatInput;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  suffix?: string;
  isGrams?: boolean;
}> = [
  { key: 'cash', label: 'Наличные', icon: <Wallet size={18} /> },
  { key: 'bank', label: 'Банковские накопления', icon: <CreditCard size={18} /> },
  {
    key: 'gold',
    label: 'Золото',
    hint: 'Введите массу в граммах',
    icon: <Gem size={18} />,
    suffix: 'г',
    isGrams: true,
  },
  {
    key: 'silver',
    label: 'Серебро',
    hint: 'Введите массу в граммах',
    icon: <Coins size={18} />,
    suffix: 'г',
    isGrams: true,
  },
  { key: 'crypto', label: 'Криптовалюта', icon: <Bitcoin size={18} /> },
  { key: 'investments', label: 'Инвестиции', icon: <TrendingUp size={18} /> },
  { key: 'trade', label: 'Товары для торговли', icon: <ShoppingBag size={18} /> },
  { key: 'debts', label: 'Долги (минус)', icon: <Banknote size={18} />, hint: 'Будет вычтено из активов' },
];

export function ZakatCalculator() {
  const { haptic, notify } = useTelegram();
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [values, setValues] = useState<ZakatInput>(EMPTY_ZAKAT_INPUT);
  const { bundle: rates, loading: ratesLoading, refresh: refreshRates } = useRates();

  const result = useMemo(
    () => calculateZakat(values, currency, rates),
    [values, currency, rates],
  );

  const update = (key: keyof ZakatInput, raw: string) => {
    const n = parseNumber(raw);
    setValues((v) => ({ ...v, [key]: n }));
  };

  const reset = () => {
    setValues(EMPTY_ZAKAT_INPUT);
    notify('warning');
  };

  // Progress to Nisab (capped at 100%).
  const progress = Math.min(
    100,
    result.nisabAmount > 0
      ? Math.round((result.zakatableAmount / result.nisabAmount) * 100)
      : 0,
  );

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
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/30 to-emerald-600/10 ring-1 ring-emerald-400/30">
            <Moon size={20} className="text-emerald-300" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-tg-hint">Расчёт</div>
            <div className="text-lg font-bold text-tg-text">Калькулятор закята</div>
          </div>
        </div>
        <CurrencyPicker value={currency} onChange={setCurrency} onHaptic={haptic} />
      </div>

      {/* Live-rates pill */}
      <RatesPill
        source={rates.source}
        fetchedAt={rates.fetchedAt}
        loading={ratesLoading}
        onRefresh={() => {
          haptic('light');
          refreshRates();
        }}
      />

      {/* Result Card */}
      <ResultCard
        currency={currency}
        zakatDue={result.zakatDue}
        nisab={result.nisabAmount}
        zakatable={result.zakatableAmount}
        isObliged={result.isObliged}
        progress={progress}
      />

      {/* Inputs */}
      <Card variant="solid" noPadding className="p-4">
        <div className="mb-3 flex items-center gap-2 px-1">
          <div className="h-1 w-1 rounded-full bg-emerald-400" />
          <div className="text-[11px] font-semibold uppercase tracking-wider text-tg-hint">
            Ваши активы
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {fields.map((f) => (
            <Input
              key={f.key}
              label={f.label}
              icon={f.icon}
              hint={f.hint}
              suffix={f.suffix ?? formatMoney(0, currency).replace(/[\d\s,.]+/g, '').trim()}
              value={values[f.key] === 0 ? '' : String(values[f.key])}
              onChange={(e) => update(f.key, e.target.value)}
              placeholder="0"
            />
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <Button variant="ghost" icon={<RotateCcw size={16} />} onClick={reset} className="flex-1">
            Сбросить
          </Button>
        </div>
      </Card>

      {/* Info note */}
      <Card variant="glass" className="text-[12px] leading-relaxed text-tg-hint">
        <div className="flex gap-2">
          <Info size={16} className="mt-0.5 shrink-0 text-emerald-400" />
          <div>
            Нисаб рассчитан по серебряному стандарту (595 г). Ставка закята —{' '}
            <b className="text-tg-text">2.5%</b> от чистых активов за лунный год (хауль).
            <br />
            <span className="opacity-70">
              Цены: золото {formatMoney(rates.goldPerGramUsd, 'USD')}/г, серебро{' '}
              {formatMoney(rates.silverPerGramUsd, 'USD')}/г
            </span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

/* ---------------------------------------------------------------- */
/*  Live rates indicator                                            */
/* ---------------------------------------------------------------- */

function RatesPill({
  source,
  fetchedAt,
  loading,
  onRefresh,
}: {
  source: 'live' | 'cache' | 'fallback';
  fetchedAt: number;
  loading: boolean;
  onRefresh: () => void;
}) {
  const meta = {
    live: { label: 'Курсы актуальны', dot: 'bg-emerald-400', ring: 'ring-emerald-400/40' },
    cache: { label: 'Курсы из кэша', dot: 'bg-amber-400', ring: 'ring-amber-400/40' },
    fallback: { label: 'Резервные курсы', dot: 'bg-rose-400', ring: 'ring-rose-400/40' },
  }[source];
  const ago = formatAgo(fetchedAt);

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className={[
        'flex items-center justify-between gap-3 rounded-2xl px-4 py-2 glass ring-1',
        meta.ring,
      ].join(' ')}
    >
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-2 w-2">
          <span
            className={[
              'absolute inset-0 rounded-full opacity-60',
              loading ? 'animate-ping' : '',
              meta.dot,
            ].join(' ')}
          />
          <span className={['relative rounded-full h-2 w-2', meta.dot].join(' ')} />
        </span>
        <div className="text-[12px] font-semibold text-tg-text">
          {meta.label}
          <span className="ml-1 font-normal text-tg-hint">· {ago}</span>
        </div>
      </div>
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={onRefresh}
        disabled={loading}
        className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/5 text-tg-hint hover:bg-white/10 disabled:opacity-50"
        aria-label="Обновить курсы"
      >
        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
      </motion.button>
    </motion.div>
  );
}

function formatAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'только что';
  const min = Math.floor(diff / 60_000);
  if (min < 60) return `${min} мин назад`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ч назад`;
  return new Date(ts).toLocaleDateString('ru-RU');
}

/* ---------------------------------------------------------------- */
/*  Result card                                                     */
/* ---------------------------------------------------------------- */

interface ResultCardProps {
  currency: CurrencyCode;
  zakatDue: number;
  nisab: number;
  zakatable: number;
  isObliged: boolean;
  progress: number;
}

function ResultCard({ currency, zakatDue, nisab, zakatable, isObliged, progress }: ResultCardProps) {
  return (
    <Card variant="gradient" glow className="overflow-visible">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300/80">
            Сумма закята
          </div>
          <div className="mt-1 font-display text-4xl font-extrabold leading-none text-tg-text">
            <AnimatedNumber
              value={zakatDue}
              format={(n) => formatMoney(n, currency)}
              duration={0.7}
            />
          </div>
          <div className="mt-1 text-[12px] text-tg-hint">
            Ставка: <span className="font-semibold text-emerald-300">2.5%</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={isObliged ? 'yes' : 'no'}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 20 }}
            className={[
              'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold',
              isObliged
                ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/40'
                : 'bg-white/10 text-tg-hint ring-1 ring-white/15',
            ].join(' ')}
          >
            <CheckCircle2 size={12} />
            {isObliged ? 'Обязателен' : 'Не достигнут нисаб'}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress bar to nisab */}
      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-[11px] text-tg-hint">
          <span>Прогресс до нисаба</span>
          <span className="tabular-nums">{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-gold-400"
          />
        </div>
      </div>

      {/* mini stats */}
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <Stat label="Чистые активы" value={zakatable} currency={currency} />
        <Stat label="Нисаб" value={nisab} currency={currency} />
      </div>
    </Card>
  );
}

function Stat({ label, value, currency }: { label: string; value: number; currency: CurrencyCode }) {
  return (
    <div className="rounded-2xl bg-white/5 px-3 py-2.5 ring-1 ring-white/10">
      <div className="text-[10px] uppercase tracking-wider text-tg-hint">{label}</div>
      <div className="mt-0.5 text-[15px] font-bold text-tg-text">
        <AnimatedNumber value={value} format={(n) => formatMoney(n, currency)} />
      </div>
    </div>
  );
}
