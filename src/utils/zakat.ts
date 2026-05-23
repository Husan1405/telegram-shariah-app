import { NISAB_GOLD_GRAMS, NISAB_SILVER_GRAMS, ZAKAT_RATE } from '@/constants';
import type { CurrencyCode, ZakatInput, ZakatResult } from '@/types';

export interface RateInputs {
  ratesPerUsd: Record<CurrencyCode, number>;
  goldPerGramUsd: number;
  silverPerGramUsd: number;
}

/**
 * Compute the Zakat result.
 *
 * Inputs are interpreted in the user's selected currency, EXCEPT:
 *  - gold / silver are entered in grams and converted via the supplied prices.
 *
 * Nisab is the lower of the gold-based (85 g) and silver-based (595 g)
 * thresholds — the silver standard is more conservative and what most
 * contemporary scholars recommend.
 */
export function calculateZakat(
  input: ZakatInput,
  currency: CurrencyCode,
  rates: RateInputs,
): ZakatResult {
  const fx = rates.ratesPerUsd[currency] ?? 1;
  const goldPriceLocal = rates.goldPerGramUsd * fx;
  const silverPriceLocal = rates.silverPerGramUsd * fx;

  const goldValue = (input.gold || 0) * goldPriceLocal;
  const silverValue = (input.silver || 0) * silverPriceLocal;

  const totalAssets =
    (input.cash || 0) +
    (input.bank || 0) +
    goldValue +
    silverValue +
    (input.crypto || 0) +
    (input.investments || 0) +
    (input.trade || 0);

  const zakatableAmount = Math.max(0, totalAssets - (input.debts || 0));

  const nisabGold = NISAB_GOLD_GRAMS * goldPriceLocal;
  const nisabSilver = NISAB_SILVER_GRAMS * silverPriceLocal;
  const nisabAmount = Math.min(nisabGold, nisabSilver);

  const isObliged = zakatableAmount >= nisabAmount;
  const zakatDue = isObliged ? zakatableAmount * ZAKAT_RATE : 0;

  return {
    totalAssets,
    zakatableAmount,
    nisabAmount,
    zakatDue,
    isObliged,
  };
}

export const EMPTY_ZAKAT_INPUT: ZakatInput = {
  cash: 0,
  bank: 0,
  gold: 0,
  silver: 0,
  crypto: 0,
  investments: 0,
  trade: 0,
  debts: 0,
};
