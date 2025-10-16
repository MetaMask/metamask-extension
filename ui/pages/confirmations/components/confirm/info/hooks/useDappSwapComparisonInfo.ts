import { Hex } from '@metamask/utils';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useCallback, useEffect } from 'react';

import { fetchQuotes } from '../../../../../../store/actions';
import { useConfirmContext } from '../../../../context/confirm';
import { useTransactionEventFragment } from '../../../../hooks/useTransactionEventFragment';
import {
  getDataFromSwap,
  getBestQuote,
  getPercentageValue,
  getPercentageGasDifference,
} from '../dapp-swap-comparison-utils';
import { useConversionRate } from './useConversionRate';

export function useDappSwapComparisonInfo() {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { getConversionRateForToken } = useConversionRate();
  const {
    chainId,
    id: transactionId,
    simulationData,
    txParams,
  } = currentConfirmation ?? {
    txParams: {},
  };
  const { data, gas, value: amount } = txParams ?? {};
  const { updateTransactionEventFragment } = useTransactionEventFragment();

  const captureDappSwapComparisonMetricsProperties = useCallback(
    (properties: Record<string, string>) => {
      updateTransactionEventFragment(
        {
          properties: {
            dapp_swap_comparison: properties,
          },
        },
        transactionId,
      );
    },
    [transactionId, updateTransactionEventFragment],
  );

  useEffect(() => {
    captureDappSwapComparisonMetricsProperties({ loading: 'true' });

    const { quotesInput, amountMin } = getDataFromSwap(chainId, amount, data);
    if (!quotesInput || !amountMin) {
      return;
    }

    fetchQuotes(quotesInput).then((quotes) => {
      const selectedQuoteIndex = getBestQuote(quotes);

      const sourceTokenRate = getConversionRateForToken(
        quotesInput.srcTokenAddress as Hex,
        chainId,
      );

      const destinationTokenRate = getConversionRateForToken(
        quotesInput.destTokenAddress as Hex,
        chainId,
      );

      console.log(
        '--------------------------------',
        sourceTokenRate,
        destinationTokenRate,
      );

      const percentageChangeInTokenAmount = getPercentageValue(
        quotes[selectedQuoteIndex].quote.destTokenAmount,
        amountMin,
      );

      const percentageChangeInTokenMinAmount = getPercentageValue(
        quotes[selectedQuoteIndex].quote.minDestTokenAmount,
        amountMin,
      );

      const percentageChangeInGas = getPercentageGasDifference(
        quotes[selectedQuoteIndex],
        gas as Hex,
      );

      captureDappSwapComparisonMetricsProperties({
        percentage_change_in_token_amount: percentageChangeInTokenAmount,
        percentage_change_in_token_min_amount: percentageChangeInTokenMinAmount,
        percentage_change_in_gas: percentageChangeInGas,
      });
    });
  }, [
    amount,
    captureDappSwapComparisonMetricsProperties,
    chainId,
    data,
    gas,
    getConversionRateForToken,
    simulationData,
  ]);
}
