import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { getAssetsBySelectedAccountGroup } from '../../../selectors/assets';
import {
  getBalanceAwareSwapDefaults,
  type BalanceAwareSwapDefaults,
  type BalanceAwareSwapSourceToken,
  type BalanceAwareUserAsset,
} from '../utils/get-balance-aware-swap-defaults';

export type UseBalanceAwareSwapDefaultsParams = {
  currentToken: BalanceAwareSwapSourceToken;
  /**
   * Optional up-to-date balance for the Token Detail Page asset.
   * When omitted, balance is resolved from the selected account-group assets.
   */
  currentTokenBalance?: string | number;
};

/**
 * Resolves balance-aware Swap from/to defaults for Token Detail Page entry.
 *
 * @param params - Current token and optional balance override.
 * @param params.currentToken
 * @param params.currentTokenBalance
 * @returns Source token and optional destination CAIP-19 asset id.
 */
export function useBalanceAwareSwapDefaults({
  currentToken,
  currentTokenBalance,
}: UseBalanceAwareSwapDefaultsParams): BalanceAwareSwapDefaults {
  const assetsByChain = useSelector(
    getAssetsBySelectedAccountGroup,
  ) as Record<string, BalanceAwareUserAsset[]>;

  return useMemo(
    () =>
      getBalanceAwareSwapDefaults({
        currentToken,
        currentTokenBalance,
        assetsByChain,
      }),
    [assetsByChain, currentToken, currentTokenBalance],
  );
}
