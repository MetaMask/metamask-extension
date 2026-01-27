import { useMemo } from 'react';
import { Hex } from '@metamask/utils';

import { TokenStandard } from '../../../../shared/constants/transaction';
import { useAsyncResult } from '../../../hooks/useAsync';
import {
  ERC20_DEFAULT_DECIMALS,
  parseTokenDetailDecimals,
  memoizedGetTokenStandardAndDetails,
  memoizedGetTokenStandardAndDetailsByChain,
  TokenDetailsERC20,
} from '../utils/token';

/**
 * Returns token details for a given token contract
 *
 * @param tokenAddress - The token contract address
 * @param chainId - Optional chain ID. When provided, uses chain-aware lookup
 * @returns Token details including decimalsNumber
 */
export const useGetTokenStandardAndDetails = (
  tokenAddress?: Hex | string | undefined,
  chainId?: Hex | string | undefined,
) => {
  const { value: details } =
    useAsyncResult<TokenDetailsERC20 | null>(async () => {
      if (!tokenAddress) {
        return Promise.resolve(null);
      }

      // Use chain-aware lookup when chainId is provided (memoized for performance)
      if (chainId) {
        return (await memoizedGetTokenStandardAndDetailsByChain(
          tokenAddress,
          chainId,
        )) as TokenDetailsERC20;
      }

      return (await memoizedGetTokenStandardAndDetails(
        tokenAddress,
      )) as TokenDetailsERC20;
    }, [tokenAddress, chainId]);

  return useMemo(() => {
    if (!details) {
      return { decimalsNumber: undefined };
    }
    const { decimals, standard } = details;

    if (standard === TokenStandard.ERC20) {
      const parsedDecimals =
        parseTokenDetailDecimals(decimals) ?? ERC20_DEFAULT_DECIMALS;
      return { ...details, decimalsNumber: parsedDecimals };
    }

    return details;
  }, [details]);
};
