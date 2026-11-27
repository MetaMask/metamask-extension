import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { LivePriceMap } from '@metamask/core-backend';

import { getAccountGroupLiveTotalState } from '#ui/selectors/assets';
import { liveFiatDelta, useMarketStats } from '#ui/hooks/assets/market-stats';
import { assetToCaipId } from '#shared/lib/asset-utils';

/**
 * The selected account group's balance, with streamed prices applied.
 * The wallet overview and the All networks pill both read this so the two
 * totals stay on the same number while All networks is selected.
 *
 * @returns The live total and its currency. The total is undefined until a
 * polled balance exists. `hasBalance` is false when no group balance is loaded,
 * which keeps the overview currency unset.
 */
export function useAccountGroupLiveTotal(): {
  total: number | undefined;
  currency: string | undefined;
  hasBalance: boolean;
} {
  const { assets, polledTotal, currency, hasBalance } = useSelector(
    getAccountGroupLiveTotalState,
  );

  const quotes = useMarketStats();

  const total = useMemo(() => {
    if (polledTotal === undefined) {
      return undefined;
    }
    const liveDelta = liveFiatDelta(assets, quotes, assetToCaipId);
    return polledTotal + liveDelta;
  }, [polledTotal, assets, quotes]);

  return {
    total,
    currency,
    hasBalance,
  };
}
