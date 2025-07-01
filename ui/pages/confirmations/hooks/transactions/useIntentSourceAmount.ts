import { Hex, createProjectLogger } from '@metamask/utils';
import BigNumber from 'bignumber.js';
import {
  INTENTS_FEE,
  INTENTS_SLIPPAGE,
} from '../../../../helpers/constants/intents';
import { useTokenDecimals } from './useTokenDecimals';
import { useTokenFiatRates } from './useTokenFiatRate';
import { useMemo } from 'react';

const log = createProjectLogger('intents');

export type IntentSourceAmounts = ReturnType<typeof useIntentSourceAmounts>;

export function useIntentSourceAmounts({
  sourceChainId,
  sourceTokenAddress,
  targetChainId,
  targets,
}: {
  sourceChainId: Hex;
  sourceTokenAddress: Hex;
  targetChainId: Hex;
  targets: {
    targetAmount: Hex;
    targetTokenAddress: Hex;
  }[];
}) {
  const sourceTokenAddresss = useMemo(
    () => [sourceTokenAddress],
    [sourceTokenAddress],
  );

  const { value: allSourceDecimals } = useTokenDecimals({
    chainId: sourceChainId,
    tokenAddresses: sourceTokenAddresss,
  });

  log('Source token decimals', allSourceDecimals);

  const sourceFiatRates = useTokenFiatRates(sourceTokenAddresss, sourceChainId);

  log('Source token fiat rates', sourceFiatRates);

  const sourceDecimals = allSourceDecimals?.[0];
  const sourceFiatRate = sourceFiatRates?.[0];

  const targetTokenAddresses = useMemo(
    () => targets.map(({ targetTokenAddress }) => targetTokenAddress),
    [targets],
  );

  const { value: targetTokenDecimals } = useTokenDecimals({
    chainId: targetChainId,
    tokenAddresses: targetTokenAddresses,
  });

  log('Target token decimals', targetTokenDecimals);

  const targetTokenFiatRates = useTokenFiatRates(
    targetTokenAddresses,
    targetChainId,
  );

  log('Target token fiat rates', targetTokenFiatRates);

  return useMemo(() => {
    if (
      !sourceDecimals ||
      !sourceFiatRate ||
      !targetTokenDecimals?.length ||
      !targetTokenFiatRates?.length
    ) {
      return [];
    }

    return targets.map((target, index) => {
      const targetDecimals = targetTokenDecimals?.[index];
      const targetFiatRate = targetTokenFiatRates?.[index];

      return calculateSourceAmount(
        target.targetAmount,
        targetDecimals ?? 18, // Default to 18 decimals if not provided
        targetFiatRate ?? new BigNumber(0),
        sourceDecimals,
        sourceFiatRate,
      );
    });
  }, [
    sourceDecimals,
    sourceFiatRate,
    targetTokenDecimals,
    targetTokenFiatRates,
    targets,
  ]);
}

function calculateSourceAmount(
  targetAmount: Hex,
  targetDecimals: number,
  targetFiatRate: BigNumber,
  sourceDecimals: number,
  sourceFiatRate: BigNumber,
) {
  const targetAmountDecimals = new BigNumber(targetAmount, 16).shift(
    -targetDecimals,
  );

  const targetAmountFiat = targetAmountDecimals.mul(targetFiatRate);

  const targetAmountTotal = targetAmountFiat.mul(
    (1 + INTENTS_SLIPPAGE + INTENTS_FEE).toString(),
  );

  const targetAmountFee = targetAmountDecimals.mul(INTENTS_FEE);

  const sourceTokenAmountDecimals = targetAmountTotal.div(sourceFiatRate);
  const sourceTokenAmountFormatted = sourceTokenAmountDecimals
    .round(6)
    .toString();

  const sourceTokenAmountRaw = new BigNumber(sourceTokenAmountDecimals)
    .shift(sourceDecimals)
    .toFixed(0);

  const sourceAmountFee = targetAmountFee.div(sourceFiatRate);
  const sourceAmountFeeFormatted = sourceAmountFee.round(6).toString();

  return {
    sourceAmountFeeFormatted,
    sourceTokenAmountFormatted,
    sourceTokenAmountRaw,
  };
}
