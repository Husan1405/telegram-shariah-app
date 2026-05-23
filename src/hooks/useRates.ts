import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getCachedOrFallback,
  isCacheFresh,
  loadLiveRates,
  type RateBundle,
} from '@/services/currencyService';

interface UseRatesReturn {
  bundle: RateBundle;
  /** True while a network fetch is in flight. UI can show a tiny pulse. */
  loading: boolean;
  /** Error message of the *last* fetch attempt, if any (UI is still usable from cache/fallback). */
  error: string | null;
  /** Triggers an immediate re-fetch (e.g. on user pressing a refresh icon). */
  refresh: () => void;
}

/**
 * useRates — single source of truth for exchange rates and metal prices.
 *
 *  - First render: returns cached bundle if available, otherwise the static fallback.
 *  - In the background: kicks off a live fetch. When it succeeds, the bundle
 *    transitions to `source: 'live'` and the UI updates automatically (computations
 *    that depend on the bundle are wrapped in useMemo at call sites).
 *  - If the cache is still fresh (<1h), the initial fetch is skipped.
 *  - Aborts in-flight requests on unmount.
 */
export function useRates(): UseRatesReturn {
  const [bundle, setBundle] = useState<RateBundle>(() => getCachedOrFallback());
  const [loading, setLoading] = useState<boolean>(() => !isCacheFresh(bundle));
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Skip the network if a fresh live/cache bundle is already in state and the
    // user hasn't requested a manual refresh.
    if (tick === 0 && isCacheFresh(bundle) && bundle.source !== 'fallback') {
      setLoading(false);
      return;
    }

    const ctrl = new AbortController();
    abortRef.current?.abort();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);

    loadLiveRates(ctrl.signal)
      .then((b) => {
        if (!ctrl.signal.aborted) {
          setBundle(b);
          setError(null);
        }
      })
      .catch((e: unknown) => {
        if (ctrl.signal.aborted) return;
        const msg =
          e instanceof Error ? e.message : typeof e === 'string' ? e : 'fetch failed';
        setError(msg);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });

    return () => ctrl.abort();
    // intentionally re-running only on manual refresh, not on every bundle change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  return { bundle, loading, error, refresh };
}
