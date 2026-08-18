import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';

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
   * Balance rendered for the Token Detail Page asset, when available.
   * Balances from the selected account-group assets are also consulted.
   */
  currentTokenBalance?: string | number;
};

/**
 * Resolves balance-aware Swap from/to defaults for Token Detail Page entry.
 *
 * Defaults are only applied when the Token Detail Page was not opened from an
 * in-progress swap: the asset picker's info icon carries the bridge state
 * through navigation, and the tokens the user picked there take precedence.
 *
 * @param params - Current token and its rendered balance.
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
  const { state } = useLocation() as {
    state?: { bridgeState?: unknown } | null;
  };
  const isReturningToSwap = Boolean(state?.bridgeState);

  return useMemo(() => {
    if (isReturningToSwap) {
      return { sourceToken: currentToken };
    }

    return getBalanceAwareSwapDefaults({
      currentToken,
      currentTokenBalance,
      assetsByChain,
    });
  }, [assetsByChain, currentToken, currentTokenBalance, isReturningToSwap]);
}
