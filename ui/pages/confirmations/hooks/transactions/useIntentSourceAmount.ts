import { Hex, createProjectLogger } from '@metamask/utils';
import BigNumber from 'bignumber.js';
import { useTokenFiatRate } from './useTokenFiatRate';
import { useTokenDecimals } from './useTokenDecimals';

const log = createProjectLogger('intents');

export function useIntentSourceAmount({
  sourceChainId,
  sourceTokenAddress,
  targetChainId,
  targetTokenAddress,
  targetAmount,
}: {
  sourceChainId: Hex;
  sourceTokenAddress: Hex;
  targetChainId: Hex;
  targetTokenAddress: Hex;
  targetAmount: Hex;
}) {
  const sourceTokenFiatRate = useTokenFiatRate(
    sourceTokenAddress,
    sourceChainId,
  );

  log('Source token fiat rate', sourceTokenFiatRate?.toString());

  const targetTokenFiatRate = useTokenFiatRate(
    targetTokenAddress,
    targetChainId,
  );

  log('Target token fiat rate', targetTokenFiatRate?.toString());

  const { pending: sourceDecimalsLoading, value: sourceDecimals } =
    useTokenDecimals({
      chainId: sourceChainId,
      tokenAddress: sourceTokenAddress,
    });

  log('Source token decimals', sourceDecimals);

  const { pending: targetDecimalsLoading, value: targetDecimals } =
    useTokenDecimals({
      chainId: targetChainId,
      tokenAddress: targetTokenAddress,
    });

  log('Target token decimals', targetDecimals);

  if (sourceDecimalsLoading || targetDecimalsLoading) {
    return {
      loading: true,
    };
  }

  if (
    sourceDecimals === undefined ||
    targetDecimals === undefined ||
    sourceTokenFiatRate === undefined ||
    targetTokenFiatRate === undefined
  ) {
    return {
      loading: false,
    };
  }

  const targetAmountDecimals = new BigNumber(targetAmount, 16).shift(
    -targetDecimals,
  );

  const targetAmountFiat = targetAmountDecimals.mul(targetTokenFiatRate);
  const targetAmountFormatted = targetAmountDecimals.round(6).toString();

  log(
    'Target token amount',
    targetAmountDecimals.toString(),
    targetAmountFormatted,
    targetAmountFiat.toString(),
  );

  const sourceTokenAmountDecimals = targetAmountFiat.div(sourceTokenFiatRate);
  const sourceTokenAmountFormatted = sourceTokenAmountDecimals
    .round(6)
    .toString();

  const sourceTokenAmountRaw = new BigNumber(sourceTokenAmountDecimals)
    .shift(sourceDecimals)
    .toFixed(0);

  log(
    'Source token amount',
    sourceTokenAmountRaw,
    sourceTokenAmountDecimals.toString(),
    sourceTokenAmountFormatted,
  );

  return {
    loading: false,
    sourceTokenAmountFormatted,
    sourceTokenAmountRaw,
    targetAmountFormatted,
  };
}
