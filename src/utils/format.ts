import { CURRENCIES } from '@/constants';
import type { CurrencyCode } from '@/types';

const symbolMap: Record<CurrencyCode, string> = CURRENCIES.reduce(
  (acc, c) => {
    acc[c.code] = c.symbol;
    return acc;
  },
  {} as Record<CurrencyCode, string>,
);

/** Pretty-print money. Falls back gracefully when value is NaN / Infinity. */
export function formatMoney(value: number, currency: CurrencyCode = 'USD'): string {
  if (!Number.isFinite(value)) return `0 ${symbolMap[currency] ?? ''}`.trim();
  const rounded = Math.round(value * 100) / 100;
  const formatted = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: rounded % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(rounded);
  return `${formatted} ${symbolMap[currency] ?? currency}`;
}

/** Display a fraction as a human-friendly text, e.g. 0.125 -> "1/8". */
export function formatFraction(fraction: number): string {
  if (!Number.isFinite(fraction) || fraction <= 0) return '—';
  const map: Array<{ v: number; s: string }> = [
    { v: 1 / 2, s: '1/2' },
    { v: 1 / 3, s: '1/3' },
    { v: 1 / 4, s: '1/4' },
    { v: 1 / 6, s: '1/6' },
    { v: 1 / 8, s: '1/8' },
    { v: 2 / 3, s: '2/3' },
    { v: 5 / 6, s: '5/6' },
  ];
  for (const { v, s } of map) {
    if (Math.abs(fraction - v) < 0.001) return s;
  }
  return `${(fraction * 100).toFixed(1)}%`;
}

/** Parse a user-entered numeric string, accepting both "," and "." decimals. */
export function parseNumber(input: string | number): number {
  if (typeof input === 'number') return Number.isFinite(input) ? input : 0;
  if (!input) return 0;
  const cleaned = input.replace(/\s+/g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}
