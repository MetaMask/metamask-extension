import { Hex } from '@metamask/utils';
import { useTokenDecimals } from './useTokenDecimals';
import { useTokenFiatRate } from './useTokenFiatRate';

export function useIntentsAsset({
  chainId,
  tokenAddress,
}: {
  chainId: Hex;
  tokenAddress: Hex;
}) {
  const { pending: loading, value: decimals } = useTokenDecimals({
    chainId,
    tokenAddress,
  });

  const fiatRate = useTokenFiatRate(tokenAddress, chainId);

  return {
    decimals,
    fiatRate,
    loading,
  };
}
