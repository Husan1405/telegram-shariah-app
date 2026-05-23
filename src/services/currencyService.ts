import { FALLBACK_RATES_PER_USD, REFERENCE_PRICES_USD } from '@/constants';
import type { CurrencyCode } from '@/types';

/**
 * Currency & precious-metals service.
 *
 * Uses the community-maintained @fawazahmed0/currency-api hosted on jsDelivr:
 *  - free, no API key, CORS-friendly, daily updates
 *  - includes XAU (gold) and XAG (silver) in troy ounces per USD
 *
 * Strategy:
 *  1. Try the primary jsDelivr URL.
 *  2. Fall back to the Cloudflare Pages mirror (same data).
 *  3. If both fail, use the in-bundle static fallbacks.
 *  4. Cache the last successful response in localStorage so subsequent loads
 *     render instantly while a fresh fetch happens in the background.
 */

const PRIMARY_URL =
  'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json';
const MIRROR_URL = 'https://latest.currency-api.pages.dev/v1/currencies/usd.json';

const TROY_OZ_TO_GRAMS = 31.1034768;
const CACHE_KEY = 'shariy:rates:v1';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour — API updates daily, hourly is plenty

export interface RateBundle {
  ratesPerUsd: Record<CurrencyCode, number>;
  goldPerGramUsd: number;
  silverPerGramUsd: number;
  source: 'live' | 'cache' | 'fallback';
  fetchedAt: number;
}

export function getFallbackRates(): RateBundle {
  return {
    ratesPerUsd: { ...FALLBACK_RATES_PER_USD },
    goldPerGramUsd: REFERENCE_PRICES_USD.goldPerGram,
    silverPerGramUsd: REFERENCE_PRICES_USD.silverPerGram,
    source: 'fallback',
    fetchedAt: Date.now(),
  };
}

function readCache(): RateBundle | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RateBundle;
    if (!parsed.ratesPerUsd || !parsed.fetchedAt) return null;
    return { ...parsed, source: 'cache' };
  } catch {
    return null;
  }
}

function writeCache(b: RateBundle) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(b));
  } catch {
    // quota / privacy-mode failures are non-fatal
  }
}

export function isCacheFresh(b: RateBundle | null): boolean {
  if (!b) return false;
  return Date.now() - b.fetchedAt < CACHE_TTL_MS;
}

async function fetchJSON(
  url: string,
  signal?: AbortSignal,
): Promise<{ usd: Record<string, number> }> {
  const res = await fetch(url, { signal, cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * The API returns "how many troy ounces 1 USD buys", so the USD price per
 * gram is `1 / rate / 31.1`.
 */
function ozRateToUsdPerGram(rate: number | undefined, fallback: number): number {
  if (!rate || !Number.isFinite(rate) || rate <= 0) return fallback;
  return 1 / rate / TROY_OZ_TO_GRAMS;
}

export async function loadLiveRates(signal?: AbortSignal): Promise<RateBundle> {
  let payload: { usd: Record<string, number> };
  try {
    payload = await fetchJSON(PRIMARY_URL, signal);
  } catch {
    payload = await fetchJSON(MIRROR_URL, signal);
  }

  const usd = payload.usd;
  if (!usd || typeof usd !== 'object') {
    throw new Error('Malformed API response');
  }

  const fb = FALLBACK_RATES_PER_USD;
  const ratesPerUsd: Record<CurrencyCode, number> = {
    USD: 1,
    EUR: usd.eur ?? fb.EUR,
    TRY: usd.try ?? fb.TRY,
    RUB: usd.rub ?? fb.RUB,
    AED: usd.aed ?? fb.AED,
  };

  const bundle: RateBundle = {
    ratesPerUsd,
    goldPerGramUsd: ozRateToUsdPerGram(usd.xau, REFERENCE_PRICES_USD.goldPerGram),
    silverPerGramUsd: ozRateToUsdPerGram(usd.xag, REFERENCE_PRICES_USD.silverPerGram),
    source: 'live',
    fetchedAt: Date.now(),
  };

  writeCache(bundle);
  return bundle;
}

export function getCachedOrFallback(): RateBundle {
  return readCache() ?? getFallbackRates();
}
