import { BigNumber } from 'bignumber.js';
import {
  ContractExchangeRates,
  getNativeTokenAddress,
} from '@metamask/assets-controllers';
import { Hex } from '@metamask/utils';
import { QuoteResponse } from '@metamask/bridge-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useCallback, useEffect, useMemo } from 'react';

import { fetchQuotes } from '../../../../../../store/actions';
import { fetchTokenExchangeRates } from '../../../../../../helpers/utils/util';
import { useAsyncResult } from '../../../../../../hooks/useAsync';
import { fetchAllErc20Decimals } from '../../../../utils/token';
import { useConfirmContext } from '../../../../context/confirm';
import { useTransactionEventFragment } from '../../../../hooks/useTransactionEventFragment';
import {
  getDataFromSwap,
  getBestQuote,
  getTokenValueFromRecord,
} from '../dapp-swap-comparison-utils';

export function useDappSwapComparisonInfo() {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const {
    chainId,
    gasUsed,
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
      console.log('--------------------------------', properties);
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

  const { quotesInput, amountMin, erc20TokenAddresses } = useMemo(() => {
    return getDataFromSwap(chainId, amount, data);
  }, [chainId, amount, data]);

  const { value: erc20FiatRates } = useAsyncResult<ContractExchangeRates>(
    () => fetchTokenExchangeRates('usd', erc20TokenAddresses, chainId),
    [JSON.stringify(erc20TokenAddresses), chainId],
  );

  const { value: erc20Decimals } = useAsyncResult<
    Record<Hex, number>
  >(async () => {
    const result = await fetchAllErc20Decimals(
      erc20TokenAddresses as Hex[],
      chainId,
    );
    return { ...result, [getNativeTokenAddress(chainId)]: 18 };
  }, [JSON.stringify(erc20TokenAddresses), chainId]);

  const getUSDValue = useCallback(
    (amount: string, tokenAddress: Hex) => {
      if (!erc20Decimals || !erc20FiatRates) {
        return '0';
      }
      const decimals = new BigNumber(
        Math.pow(10, getTokenValueFromRecord(erc20Decimals, tokenAddress)),
      );
      const conversionRate = new BigNumber(
        getTokenValueFromRecord(
          erc20FiatRates as Record<Hex, number>,
          tokenAddress,
        ),
      );
      return new BigNumber(amount ?? 0)
        .dividedBy(decimals)
        .times(conversionRate)
        .toString(10);
    },
    [JSON.stringify(erc20Decimals), JSON.stringify(erc20FiatRates)],
  );

  const { value: quotes } = useAsyncResult<
    QuoteResponse[] | undefined
  >(async () => {
    if (!quotesInput || !amountMin) {
      return undefined;
    }

    captureDappSwapComparisonMetricsProperties({ loading: 'true' });

    return await fetchQuotes(quotesInput);
  }, [
    amountMin,
    captureDappSwapComparisonMetricsProperties,
    JSON.stringify(quotesInput),
  ]);

  useEffect(() => {
    if (
      !amountMin ||
      !erc20Decimals ||
      !erc20FiatRates ||
      !quotes ||
      !quotesInput
    ) {
      return;
    }

    const selectedQuoteIndex = getBestQuote(quotes);
    const selectedQuote = quotes[selectedQuoteIndex];

    const { destTokenAddress, srcTokenAmount, srcTokenAddress } = quotesInput;
    const {
      approval,
      quote: { destTokenAmount, minDestTokenAmount },
      trade,
    } = selectedQuote;
    const totalGasInQuote =
      (approval?.effectiveGas ?? approval?.gasLimit ?? 0) +
      (trade?.effectiveGas ?? trade?.gasLimit ?? 0);

    const { tokenBalanceChanges } = simulationData ?? {};
    const destTokenBalanceChange = new BigNumber(
      tokenBalanceChanges
        ?.find(
          (tbc) =>
            tbc.address?.toLowerCase() === destTokenAddress?.toLowerCase(),
        )
        ?.difference.toString() ?? '0x0',
      16,
    )
      .toNumber()
      .toString();

    const nativeTokenAddress = getNativeTokenAddress(chainId);

    captureDappSwapComparisonMetricsProperties({
      swap_dapp_from_token_simulated_value_usd: getUSDValue(
        srcTokenAmount,
        srcTokenAddress as Hex,
      ),
      swap_dapp_to_token_simulated_value_usd: getUSDValue(
        destTokenBalanceChange,
        destTokenAddress as Hex,
      ),
      swap_dapp_minimum_received_value_usd: getUSDValue(
        amountMin,
        destTokenAddress as Hex,
      ),
      swap_dapp_network_fee_usd: getUSDValue(
        new BigNumber(gasUsed ?? gas ?? '0x0', 16).toNumber().toString(),
        nativeTokenAddress,
      ),
      swap_mm_from_token_simulated_value_usd: getUSDValue(
        srcTokenAmount,
        srcTokenAddress as Hex,
      ),
      swap_mm_to_token_simulated_value_usd: getUSDValue(
        destTokenAmount,
        destTokenAddress as Hex,
      ),
      swap_mm_minimum_received_value_usd: getUSDValue(
        minDestTokenAmount,
        destTokenAddress as Hex,
      ),
      swap_mm_network_fee_usd: getUSDValue(
        totalGasInQuote.toString(),
        nativeTokenAddress,
      ),
    });
  }, [
    amountMin,
    captureDappSwapComparisonMetricsProperties,
    chainId,
    erc20FiatRates,
    erc20Decimals,
    gas,
    gasUsed,
    quotesInput,
    simulationData,
  ]);
}
