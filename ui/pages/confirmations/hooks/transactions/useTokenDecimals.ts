import { Hex } from '@metamask/utils';
import { useAsyncResult } from '../../../../hooks/useAsync';
import { getTokenStandardAndDetailsByChain } from '../../../../store/actions';

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

    if (tokenAddress === '0x0000000000000000000000000000000000000000') {
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
