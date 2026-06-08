import { useCallback, useEffect, useMemo, useState } from 'react';
import { submitRequestToBackground } from '../../store/background-connection';
import { PERPS_SLIPPAGE_DEFAULT_BPS } from '../../components/app/perps/constants/slippageConfig';

type MaxSlippageSource = 'default' | 'user_configured';

export type UsePerpsMaxSlippageReturn = {
  /** Resolved max slippage in basis points (falls back to the documented default). */
  maxSlippageBps: number;
  /** Indicates whether the value comes from a persisted user choice or the default. */
  maxSlippageSource: MaxSlippageSource;
  /** Persist a new max-slippage value (basis points). */
  setMaxSlippage: (bps: number) => Promise<void>;
  /** True while the initial controller read is in flight. */
  isLoading: boolean;
};

/**
 * Reads and persists the user's max slippage preference via PerpsController.
 */
export function usePerpsMaxSlippage(): UsePerpsMaxSlippageReturn {
  const [storedBps, setStoredBps] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const value = await submitRequestToBackground<number | undefined>(
        'perpsGetMaxSlippage',
        [],
      );
      setStoredBps(typeof value === 'number' ? value : undefined);
    } catch {
      // Fall back to the documented default when the controller read fails (offline / init race).
      setStoredBps(undefined);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh().catch(() => {
      setIsLoading(false);
    });
  }, [refresh]);

  const setMaxSlippage = useCallback(async (bps: number) => {
    await submitRequestToBackground('perpsSetMaxSlippage', [bps]);
    setStoredBps(bps);
  }, []);

  return useMemo(() => {
    const maxSlippageBps = storedBps ?? PERPS_SLIPPAGE_DEFAULT_BPS;
    const maxSlippageSource: MaxSlippageSource =
      storedBps === undefined ? 'default' : 'user_configured';
    return {
      maxSlippageBps,
      maxSlippageSource,
      setMaxSlippage,
      isLoading,
    };
  }, [storedBps, setMaxSlippage, isLoading]);
}
