import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { isEqual } from 'lodash';
import { getCurrentChainId } from '../../../shared/modules/selectors/networks';
import {
  SWAPS_CHAINID_COMMON_TOKEN_PAIR,
  type SwapsTokenObject,
  SWAPS_CHAINID_DEFAULT_TOKEN_MAP,
} from '../../../shared/constants/swaps';
import { getFromToken } from '../../ducks/swaps/swaps';

type UseSwapDefaultToTokenReturnType = {
  defaultToToken: SwapsTokenObject | null;
};

/**
 * UseSwapDefaultToken - When no toToken is preassign, populate the selected to token with a token
 * If its the main token, populate with the most common pair, otherwise return the main token
 * (ex: fromToke: ETH, return USDC, fromToken: USDC, return ETH)
 *
 * @returns UseSwapDefaultToTokenReturnType
 */
function useSwapDefaultToToken(): UseSwapDefaultToTokenReturnType {
  const chainId = useSelector(getCurrentChainId);
  const fromToken = useSelector(getFromToken, isEqual);

  const defaultToToken = useMemo(() => {
    if (!fromToken) {
      return null;
    }

    const chainIdDefaultToken =
      SWAPS_CHAINID_DEFAULT_TOKEN_MAP[
        chainId as keyof typeof SWAPS_CHAINID_DEFAULT_TOKEN_MAP
      ] ?? null;

    if (!chainIdDefaultToken) {
      return null;
    }

    if (chainIdDefaultToken.address === fromToken?.address) {
      return (
        SWAPS_CHAINID_COMMON_TOKEN_PAIR[
          chainId as keyof typeof SWAPS_CHAINID_COMMON_TOKEN_PAIR
        ] ?? null
      );
    }

    return chainIdDefaultToken;
  }, [chainId, fromToken?.address]);

  if (!defaultToToken) {
    console.warn(`No Swap default token found for chainId: ${chainId}`);
  }

  return { defaultToToken };
}

export default useSwapDefaultToToken;
