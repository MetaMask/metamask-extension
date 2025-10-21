import { BigNumber } from 'bignumber.js';
import {
  ContractExchangeRates,
  getNativeTokenAddress,
} from '@metamask/assets-controllers';
import { Hex } from '@metamask/utils';
import { QuoteResponse } from '@metamask/bridge-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useCallback, useEffect, useMemo } from 'react';

import { fetchQuotes } from '../../../../store/actions';
import { fetchTokenExchangeRates } from '../../../../helpers/utils/util';
import { useAsyncResult } from '../../../../hooks/useAsync';
import { fetchAllErc20Decimals } from '../../utils/token';
import {
  getDataFromSwap,
  getBestQuote,
  getTokenValueFromRecord,
  getBalanceChangeFromSimulationData,
} from '../../utils/dapp-swap-comparison-utils';
import { useConfirmContext } from '../../context/confirm';
import { useTransactionEventFragment } from '../useTransactionEventFragment';

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
  const { data, gas, maxFeePerGas } = txParams ?? {};
  const { updateTransactionEventFragment } = useTransactionEventFragment();

  const captureDappSwapComparisonMetricsProperties = useCallback(
    (properties: Record<string, string> | string[]) => {
      updateTransactionEventFragment(
        {
          properties: {
            ...properties,
          },
        },
        transactionId,
      );
    },
    [transactionId, updateTransactionEventFragment],
  );

  const { quotesInput, amountMin, tokenAddresses } = useMemo(() => {
    return getDataFromSwap(chainId, data);
  }, [chainId, data]);

  const { value: erc20FiatRates } = useAsyncResult<ContractExchangeRates>(
    () => fetchTokenExchangeRates('usd', tokenAddresses, chainId),
    [tokenAddresses, chainId],
  );

  const { value: erc20Decimals } = useAsyncResult<
    Record<Hex, number>
  >(async () => {
    const result = await fetchAllErc20Decimals(
      tokenAddresses as Hex[],
      chainId,
    );
    return { ...result, [getNativeTokenAddress(chainId)]: 18 };
  }, [tokenAddresses, chainId]);

  const getUSDValue = useCallback(
    (tokenAmount: string, tokenAddress: Hex) => {
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
      return new BigNumber(tokenAmount ?? 0)
        .dividedBy(decimals)
        .times(conversionRate)
        .toString(10);
    },
    [erc20Decimals, erc20FiatRates],
  );

  const getUSDValueForDestinationToken = useCallback(
    (tokenAmount: string) => {
      if (!erc20Decimals || !erc20FiatRates || !quotesInput) {
        return '0';
      }
      const { destTokenAddress } = quotesInput;
      const decimals = new BigNumber(
        Math.pow(
          10,
          getTokenValueFromRecord(erc20Decimals, destTokenAddress as Hex),
        ),
      );
      const conversionRate = new BigNumber(
        getTokenValueFromRecord(
          erc20FiatRates as Record<Hex, number>,
          destTokenAddress as Hex,
        ),
      );
      return new BigNumber(tokenAmount ?? 0)
        .dividedBy(decimals)
        .times(conversionRate)
        .toString(10);
    },
    [erc20Decimals, erc20FiatRates, quotesInput],
  );

  const { value: quotes } = useAsyncResult<
    QuoteResponse[] | undefined
  >(async () => {
    if (!quotesInput) {
      return undefined;
    }

    captureDappSwapComparisonMetricsProperties(['loading']);

    return await fetchQuotes(quotesInput);
  }, [captureDappSwapComparisonMetricsProperties, quotesInput]);

  const getGasUSDValue = useCallback(
    (gasValue: BigNumber) => {
      if (!maxFeePerGas) {
        return '0';
      }
      const gasPrice = new BigNumber(maxFeePerGas, 16);
      const totalGas = gasPrice.times(gasValue).toString(10);
      const nativeTokenAddress = getNativeTokenAddress(chainId);
      return getUSDValue(totalGas, nativeTokenAddress);
    },
    [chainId, getUSDValue, maxFeePerGas],
  );

  useEffect(() => {
    if (
      !amountMin ||
      !erc20Decimals ||
      !erc20FiatRates ||
      !quotes?.length ||
      !quotesInput
    ) {
      return;
    }

    const selectedQuote = getBestQuote(
      quotes,
      getUSDValueForDestinationToken,
      getGasUSDValue,
    );

    if (!selectedQuote) {
      return;
    }

    const { destTokenAddress, srcTokenAmount, srcTokenAddress } = quotesInput;
    const {
      approval,
      quote: { destTokenAmount, minDestTokenAmount },
      trade,
    } = selectedQuote;

    const totalGasInQuote = getGasUSDValue(
      new BigNumber(
        (approval?.effectiveGas ?? approval?.gasLimit ?? 0) +
          (trade?.effectiveGas ?? trade?.gasLimit ?? 0),
        10,
      ),
    );

    const totalGasInConfirmation = getGasUSDValue(
      new BigNumber(gasUsed ?? gas ?? '0x0', 16),
    );

    const destTokenBalanceChange = getBalanceChangeFromSimulationData(
      destTokenAddress as Hex,
      simulationData,
    );

    captureDappSwapComparisonMetricsProperties({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      swap_dapp_from_token_simulated_value_usd: getUSDValue(
        srcTokenAmount,
        srcTokenAddress as Hex,
      ),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      swap_dapp_to_token_simulated_value_usd: getUSDValueForDestinationToken(
        destTokenBalanceChange,
      ),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      swap_dapp_minimum_received_value_usd:
        getUSDValueForDestinationToken(amountMin),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      swap_dapp_network_fee_usd: totalGasInConfirmation,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      swap_mm_from_token_simulated_value_usd: getUSDValue(
        srcTokenAmount,
        srcTokenAddress as Hex,
      ),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      swap_mm_to_token_simulated_value_usd:
        getUSDValueForDestinationToken(destTokenAmount),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      swap_mm_minimum_received_value_usd:
        getUSDValueForDestinationToken(minDestTokenAmount),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      swap_mm_network_fee_usd: totalGasInQuote,
    });
  }, [
    amountMin,
    captureDappSwapComparisonMetricsProperties,
    erc20FiatRates,
    erc20Decimals,
    gas,
    gasUsed,
    getGasUSDValue,
    getUSDValueForDestinationToken,
    getUSDValue,
    quotes,
    quotesInput,
    simulationData,
  ]);
}
