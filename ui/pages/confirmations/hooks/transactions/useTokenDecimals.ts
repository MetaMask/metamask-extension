import { Hex } from '@metamask/utils';
import { useAsyncResult } from '../../../../hooks/useAsync';
import { getTokenStandardAndDetailsByChain } from '../../../../store/actions';
import { NATIVE_TOKEN_ADDRESS } from '../../../../helpers/constants/intents';

export function useTokenDecimals({
  chainId,
  tokenAddress,
}: {
  chainId?: Hex;
  tokenAddress?: Hex;
}) {
  return useAsyncResult(async () => {
    if (!chainId || !tokenAddress) {
      return undefined;
    }

    if (tokenAddress === NATIVE_TOKEN_ADDRESS) {
      return 18;
    }

    const details = await getTokenStandardAndDetailsByChain(
      tokenAddress,
      undefined,
      undefined,
      chainId,
    );

    if (!details.decimals) {
      return undefined;
    }

    return parseInt(details.decimals, 10);
  }, [chainId, tokenAddress]);
}
