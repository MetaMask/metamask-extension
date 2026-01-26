import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';

import { useAsyncResult } from '../../../../hooks/useAsync';
import {
  addToken,
  findNetworkClientIdByChainId,
} from '../../../../store/actions';
import { getAllTokens } from '../../../../selectors/selectors';
import { getSelectedInternalAccount } from '../../../../selectors/accounts';

/**
 * Parameters for the useAddToken hook.
 */
export type UseAddTokenParams = {
  /**
   * The chain ID where the token exists.
   */
  chainId: Hex;

  /**
   * The number of decimal places for the token.
   */
  decimals: number;

  /**
   * The human-readable name of the token.
   */
  name: string;

  /**
   * The token symbol (e.g., "DAI", "USDC").
   */
  symbol: string;

  /**
   * The contract address of the token.
   */
  tokenAddress: Hex;
};

/**
 * Hook to automatically add a token to the user's wallet.
 *
 * This hook is used by confirmation flows (perps, predict, mUSD) to ensure
 * that destination tokens are visible in the user's wallet after transactions
 * complete. It checks if the token already exists before adding it, and
 * performs the addition silently without blocking the UI.
 *
 * @param params - The token parameters
 * @param params.chainId - The chain ID where the token exists
 * @param params.decimals - The number of decimal places for the token
 * @param params.symbol - The token symbol (e.g., "DAI", "USDC")
 * @param params.tokenAddress - The contract address of the token
 */
export function useAddToken({
  chainId,
  decimals,
  symbol,
  tokenAddress,
}: UseAddTokenParams): void {
  const dispatch = useDispatch();
  const allTokens = useSelector(getAllTokens);
  const selectedAccount = useSelector(getSelectedInternalAccount);

  const hasToken =
    allTokens?.[chainId]?.[selectedAccount?.address]?.some(
      (token: { address: string }) =>
        token.address.toLowerCase() === tokenAddress.toLowerCase(),
    ) ?? false;

  const addTokenAsync = useCallback(async () => {
    if (hasToken) {
      return;
    }

    const networkClientId = await findNetworkClientIdByChainId(chainId);

    await dispatch(
      addToken(
        {
          address: tokenAddress,
          symbol,
          decimals,
          networkClientId,
        },
        true, // dontShowLoadingIndicator
      ),
    );
  }, [hasToken, chainId, tokenAddress, symbol, decimals, dispatch]);

  const { error } = useAsyncResult(addTokenAsync, [
    addTokenAsync,
    hasToken,
    chainId,
    tokenAddress,
    symbol,
    decimals,
  ]);

  if (error) {
    console.error('Failed to add token', { tokenAddress, chainId, error });
  }
}
