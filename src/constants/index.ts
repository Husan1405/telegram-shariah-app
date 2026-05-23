import type { CurrencyCode, CurrencyMeta } from '@/types';

/**
 * Default static fallback rates (per 1 USD).
 * The currency service can override these with live rates from an API.
 * Keep numbers conservative — they ship in the bundle as a safe default.
 */
export const FALLBACK_RATES_PER_USD: Record<CurrencyCode, number> = {
  USD: 1,
  EUR: 0.92,
  TRY: 32.5,
  RUB: 92,
  AED: 3.67,
};

/**
 * Reference prices in USD used when calculating Nisab and gold / silver value.
 * Update via the currency service to track live market.
 */
export const REFERENCE_PRICES_USD = {
  /** Gold price per gram (USD) — Nisab threshold uses 85g. */
  goldPerGram: 75,
  /** Silver price per gram (USD) — Nisab threshold uses 595g. */
  silverPerGram: 0.95,
};

export const NISAB_GOLD_GRAMS = 85;
export const NISAB_SILVER_GRAMS = 595;
export const ZAKAT_RATE = 0.025;

export const CURRENCIES: CurrencyMeta[] = [
  { code: 'USD', symbol: '$', label: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', label: 'Euro', flag: '🇪🇺' },
  { code: 'TRY', symbol: '₺', label: 'Türk Lirası', flag: '🇹🇷' },
  { code: 'RUB', symbol: '₽', label: 'Российский рубль', flag: '🇷🇺' },
  { code: 'AED', symbol: 'د.إ', label: 'UAE Dirham', flag: '🇦🇪' },
];

export const HEIR_LABELS: Record<string, string> = {
  husband: 'Муж',
  wife: 'Жена',
  sons: 'Сыновья',
  daughters: 'Дочери',
  father: 'Отец',
  mother: 'Мать',
  grandfather: 'Дедушка',
  grandmother: 'Бабушка',
  brothers: 'Братья',
  sisters: 'Сёстры',
};
