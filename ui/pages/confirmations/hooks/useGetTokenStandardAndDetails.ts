import { Hex } from '@metamask/utils';

import { TokenStandard } from '../../../../shared/constants/transaction';
import { useAsyncResult } from '../../../hooks/useAsyncResult';
import {
  ERC20_DEFAULT_DECIMALS,
  parseTokenDetailDecimals,
  memoizedGetTokenStandardAndDetails,
  TokenDetailsERC20,
} from '../utils/token';

/**
 * Returns token details for a given token contract
 *
 * @param tokenAddress
 * @returns
 */
export const useGetTokenStandardAndDetails = (
  tokenAddress: Hex | string | undefined,
) => {
  const { value: details } = useAsyncResult<TokenDetailsERC20>(
    async () =>
      (await memoizedGetTokenStandardAndDetails(
        tokenAddress,
      )) as TokenDetailsERC20,
    [tokenAddress],
  );

  if (!details) {
    return { decimalsNumber: undefined };
  }

  const { decimals, standard } = details || {};

  if (standard === TokenStandard.ERC20) {
    const parsedDecimals =
      parseTokenDetailDecimals(decimals) ?? ERC20_DEFAULT_DECIMALS;
    details.decimalsNumber = parsedDecimals;
  }

  return details;
};
