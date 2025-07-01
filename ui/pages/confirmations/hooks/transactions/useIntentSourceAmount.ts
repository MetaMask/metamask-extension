import { createProjectLogger } from '@metamask/utils';
import BigNumber from 'bignumber.js';
import { useTokenDecimals } from './useTokenDecimals';
import { useTokenFiatRates } from './useTokenFiatRate';
import { useMemo } from 'react';
import { useIntentsContext } from '../../context/intents/intents';
import { useIntentsSourceFiat } from './useIntentsSourceFiat';

const log = createProjectLogger('intents');

export type IntentSourceAmounts = ReturnType<typeof useIntentSourceAmounts>;

export function useIntentSourceAmounts() {
  const { sourceToken } = useIntentsContext();

  const sourceChainId = sourceToken?.chainId;
  const sourceTokenAddress = sourceToken?.address;

  const sourceTokenAddresses = sourceTokenAddress
    ? [sourceTokenAddress]
    : undefined;

  const { value: allSourceDecimals } = useTokenDecimals({
    chainId: sourceChainId,
    tokenAddresses: sourceTokenAddresses,
  });

  log('Source token decimals', allSourceDecimals);

  const sourceFiatRates = useTokenFiatRates(
    sourceTokenAddresses,
    sourceChainId,
  );

  log('Source token fiat rates', sourceFiatRates);

  const sourceDecimals = allSourceDecimals?.[0];
  const sourceFiatRate = sourceFiatRates?.[0];

  const { sourceAmounts } = useIntentsSourceFiat();

  return useMemo(() => {
    if (!sourceDecimals || !sourceFiatRate || !sourceAmounts?.length) {
      return undefined;
    }

    return sourceAmounts.map((sourceAmount) => {
      return calculateSourceAmount(
        sourceAmount.sourceAmountFiat,
        sourceAmount.sourceFeeFiat,
        sourceDecimals,
        sourceFiatRate,
      );
    });
  }, [sourceDecimals, sourceFiatRate, JSON.stringify(sourceAmounts)]);
}

function calculateSourceAmount(
  sourceAmountFiat: string,
  sourceFeeFiat: string,
  sourceDecimals: number,
  sourceFiatRate: BigNumber,
) {
  const sourceTokenAmountDecimals = new BigNumber(sourceAmountFiat).div(
    sourceFiatRate,
  );
  const sourceTokenAmountFormatted = sourceTokenAmountDecimals
    .round(6)
    .toString();

  const sourceTokenAmountRaw = new BigNumber(sourceTokenAmountDecimals)
    .shift(sourceDecimals)
    .toFixed(0);

  const sourceAmountFee = new BigNumber(sourceFeeFiat).div(sourceFiatRate);
  const sourceAmountFeeFormatted = sourceAmountFee.round(6).toString();

  return {
    sourceAmountFeeFormatted,
    sourceTokenAmountFormatted,
    sourceTokenAmountRaw,
  };
}
