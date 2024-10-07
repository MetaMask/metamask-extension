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
 * @param options
 * @param options.canTrackMissingDecimalsMetric
 * @param options.metricLocation
 * @returns
 */
const useGetTokenStandardAndDetails = (
  tokenAddress: Hex | string | undefined,
) => {
  const { value: details } = useAsyncResult<TokenDetailsERC20>(
    async () =>
      (await memoizedGetTokenStandardAndDetails(
        tokenAddress,
      )) as TokenDetailsERC20,
    [tokenAddress],
  );

  const { decimals, standard } = details || {};

  if (!details) {
    return { decimalsNumber: undefined };
  }

  if (standard === TokenStandard.ERC20) {
    let parsedDecimals = parseTokenDetailDecimals(decimals);
    if (parsedDecimals === undefined) {
      parsedDecimals = ERC20_DEFAULT_DECIMALS;
    }
    details.decimalsNumber = parsedDecimals;
  }

  return details;
};

export default useGetTokenStandardAndDetails;
