import { Hex, createProjectLogger } from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import { useMemo } from 'react';
import {
  INTENTS_FEE,
  INTENTS_SLIPPAGE,
} from '../../../../helpers/constants/intents';
import { useTokenDecimals } from './useTokenDecimals';
import { useTokenFiatRates } from './useTokenFiatRate';
import { useIntentsTargets } from './useIntentsTargets';
import { useIntentsTargetChainId } from './useIntentsTargetChainId';

const log = createProjectLogger('intents');

export function useIntentsSourceFiat() {
  const targetChainId = useIntentsTargetChainId();
  const targets = useIntentsTargets();

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

  const sourceAmounts = useMemo(() => {
    if (!targetTokenDecimals?.length || !targetTokenFiatRates?.length) {
      return [];
    }

    return targets.map((target, index) => {
      const targetDecimals = targetTokenDecimals?.[index];
      const targetFiatRate = targetTokenFiatRates?.[index];

      return calculateSourceAmount(
        target.targetAmount,
        targetDecimals ?? 18, // Default to 18 decimals if not provided
        targetFiatRate ?? new BigNumber(0),
      );
    });
  }, [targetTokenDecimals, targetTokenFiatRates, targets]);

  const sourceAmountFiatTotal =
    targetTokenFiatRates?.length && targetTokenDecimals?.length
      ? sourceAmounts
          .reduce(
            (total, amount) =>
              total.plus(new BigNumber(amount.sourceAmountFiat)),
            new BigNumber(0),
          )
          .toString()
      : undefined;

  return {
    sourceAmounts,
    sourceAmountFiatTotal,
  };
}

function calculateSourceAmount(
  targetAmount: Hex,
  targetDecimals: number,
  targetFiatRate: BigNumber,
) {
  const targetAmountDecimals = new BigNumber(targetAmount, 16).shift(
    -targetDecimals,
  );

  const targetAmountFiat = targetAmountDecimals.mul(targetFiatRate);

  const sourceFeeFiat = targetAmountFiat.mul(INTENTS_FEE).toString();

  const sourceAmountFiat = targetAmountFiat
    .mul((1 + INTENTS_SLIPPAGE + INTENTS_FEE).toString())
    .toString();

  return { sourceAmountFiat, sourceFeeFiat };
}
