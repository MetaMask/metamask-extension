import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { Asset } from '@metamask/assets-controllers';
import {
  getAssetsBySelectedAccountGroup,
  selectUnifiedBalanceBySelectedAccountGroup,
} from '../../../../selectors/assets';
import {
  liveFiatDelta,
  useMarketStats,
} from '../../../../hooks/assets/market-stats';
import { toCaipAssetId } from '../util/to-caip-asset-id';

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
  const selectedGroupBalance = useSelector(
    selectUnifiedBalanceBySelectedAccountGroup,
  );
  const assetsByChain = useSelector(getAssetsBySelectedAccountGroup);
  const livePrices = useMarketStats();
  const polledTotal = selectedGroupBalance?.totalBalanceInUserCurrency;

  const total = useMemo(() => {
    if (polledTotal === undefined) {
      return undefined;
    }
    const assets = Object.values(assetsByChain ?? {}).flat() as Asset[];
    return polledTotal + liveFiatDelta(assets, livePrices, toCaipAssetId);
  }, [assetsByChain, livePrices, polledTotal]);

  return {
    total,
    currency: selectedGroupBalance?.userCurrency,
    hasBalance:
      selectedGroupBalance !== null && selectedGroupBalance !== undefined,
  };
}
