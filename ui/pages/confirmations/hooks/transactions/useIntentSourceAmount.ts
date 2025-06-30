import { Hex, createProjectLogger } from '@metamask/utils';
import BigNumber from 'bignumber.js';
import {
  INTENTS_FEE,
  INTENTS_SLIPPAGE,
} from '../../../../helpers/constants/intents';

const log = createProjectLogger('intents');

export function useIntentSourceAmount({
  sourceDecimals,
  sourceFiatRate,
  targetDecimals,
  targetFiatRate,
  targetAmount,
}: {
  sourceDecimals?: number;
  sourceFiatRate?: BigNumber;
  targetDecimals?: number;
  targetFiatRate?: BigNumber;
  targetAmount: Hex;
}) {
  if (
    sourceDecimals === undefined ||
    targetDecimals === undefined ||
    sourceFiatRate === undefined ||
    targetFiatRate === undefined
  ) {
    return {
      loading: false,
    };
  }

  const targetAmountDecimals = new BigNumber(targetAmount, 16).shift(
    -targetDecimals,
  );

  const targetAmountFiat = targetAmountDecimals
    .mul(targetFiatRate)
    .mul((1 + INTENTS_SLIPPAGE + INTENTS_FEE).toString());

  const targetAmountFormatted = targetAmountDecimals.round(6).toString();

  log(
    'Target token amount',
    targetAmountDecimals.toString(),
    targetAmountFormatted,
    targetAmountFiat.toString(),
  );

  const sourceTokenAmountDecimals = targetAmountFiat.div(sourceFiatRate);
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
