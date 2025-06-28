import { Hex } from '@metamask/utils';
import BigNumber from 'bignumber.js';
import { useSelector } from 'react-redux';
import { getConversionRate } from '../../../../ducks/metamask/metamask';
import { useTokenFiatRate } from './useTokenFiatRate';
import { useTokenDecimals } from './useTokenDecimals';

export function useIntentSourceAmount({
  chainId,
  nativeValue,
  tokenAddress,
}: {
  chainId: Hex;
  nativeValue: Hex;
  tokenAddress?: Hex;
}) {
  const nativeConversionRate = useSelector(getConversionRate);

  const tokenFiatRate = useTokenFiatRate(tokenAddress ?? '0x123', chainId);

  const { pending: loading, value: decimals } = useTokenDecimals({
    chainId,
    tokenAddress,
  });

  if (loading) {
    return {
      loading: true,
    };
  }

  if (
    decimals === undefined ||
    tokenFiatRate === undefined ||
    tokenAddress === undefined
  ) {
    return {
      loading: false,
    };
  }

  const targetFiat = new BigNumber(nativeValue, 16)
    .shift(-18)
    .mul(nativeConversionRate);

  const sourceTokenAmountDecimals = targetFiat.div(tokenFiatRate);
  const sourceTokenAmountFormatted = sourceTokenAmountDecimals.toFixed(2);
  const sourceTokenAmountRaw = new BigNumber(sourceTokenAmountDecimals)
    .shift(decimals)
    .toFixed(0);

  return {
    loading: false,
    sourceTokenAmountFormatted,
    sourceTokenAmountRaw,
  };
}
