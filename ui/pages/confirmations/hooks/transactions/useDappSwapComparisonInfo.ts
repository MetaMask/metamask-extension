import { BigNumber } from 'bignumber.js';
import { getNativeTokenAddress } from '@metamask/assets-controllers';
import { Hex } from '@metamask/utils';
import {
  getNativeAssetForChainId,
  isNativeAddress,
  QuoteResponse,
  TxData,
} from '@metamask/bridge-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import { captureException } from '@sentry/browser';
import { useCallback, useEffect, useMemo } from 'react';

import { TokenStandAndDetails } from '../../../../store/actions';
import { fetchQuotes } from '../../../../store/controller-actions/bridge-controller';
import { fetchTokenExchangeRates } from '../../../../helpers/utils/util';
import { useAsyncResult } from '../../../../hooks/useAsync';
import { fetchAllTokenDetails } from '../../utils/token';
import {
  getDataFromSwap,
  getBestQuote,
  getTokenValueFromRecord,
  getBalanceChangeFromSimulationData,
} from '../../utils/dapp-swap-comparison-utils';
import { useConfirmContext } from '../../context/confirm';
import { useTransactionEventFragment } from '../useTransactionEventFragment';
import { useDappSwapComparisonLatencyMetrics } from './useDappSwapComparisonLatencyMetrics';

const FOUR_BYTE_EXECUTE_SWAP_CONTRACT = '0x3593564c';

export function useDappSwapComparisonInfo() {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const {
    chainId,
    gasUsed,
    gasLimitNoBuffer,
    id: transactionId,
    simulationData,
    txParams,
    nestedTransactions,
  } = currentConfirmation ?? {
    txParams: {},
  };
  const { data, gas, maxFeePerGas } = txParams ?? {};
  const { updateTransactionEventFragment } = useTransactionEventFragment();
  const {
    requestDetectionLatency,
    quoteRequestLatency,
    quoteResponseLatency,
    swapComparisonLatency,
    updateRequestDetectionLatency,
    updateQuoteRequestLatency,
    updateQuoteResponseLatency,
    updateSwapComparisonLatency,
  } = useDappSwapComparisonLatencyMetrics();

  const captureDappSwapComparisonMetricsProperties = useCallback(
    (params: {
      properties: Record<string, string>;
      sensitiveProperties?: Record<string, string>;
    }) => {
      updateTransactionEventFragment(
        {
          ...params,
        },
        transactionId,
      );
    },
    [transactionId, updateTransactionEventFragment],
  );

  const { quotesInput, amountMin, tokenAddresses } = useMemo(() => {
    try {
      let transactionData = data;
      if (nestedTransactions?.length) {
        transactionData = nestedTransactions?.find(({ data: trxnData }) =>
          trxnData?.startsWith(FOUR_BYTE_EXECUTE_SWAP_CONTRACT),
        )?.data;
      }
      const result = getDataFromSwap(chainId, transactionData);
      updateRequestDetectionLatency();
      return result;
    } catch (error) {
      captureException(error);
      return {
        quotesInput: undefined,
        amountMin: undefined,
        tokenAddresses: [],
      };
    }
  }, [chainId, data, nestedTransactions, updateRequestDetectionLatency]);

  const { value: fiatRates } = useAsyncResult<Record<Hex, number | undefined>>(
    () => fetchTokenExchangeRates('usd', tokenAddresses, chainId),
    [chainId, tokenAddresses?.length],
  );

  const { value: tokenDetails } = useAsyncResult<
    Record<Hex, TokenStandAndDetails>
  >(async () => {
    let result = await fetchAllTokenDetails(tokenAddresses as Hex[], chainId);
    tokenAddresses.forEach((tokenAddress) => {
      if (isNativeAddress(tokenAddress)) {
        result = {
          ...result,
          [tokenAddress as Hex]: getNativeAssetForChainId(chainId),
        };
      }
    });
    return result;
  }, [chainId, tokenAddresses?.length]);

  const getUSDValue = useCallback(
    (tokenAmount: string, tokenAddress: Hex) => {
      if (!tokenDetails || !fiatRates) {
        return '0';
      }
      const decimals = new BigNumber(
        Math.pow(
          10,
          parseInt(
            getTokenValueFromRecord<TokenStandAndDetails>(
              tokenDetails,
              tokenAddress,
            )?.decimals ?? '18',
            10,
          ),
        ),
      );
      const conversionRate = new BigNumber(
        getTokenValueFromRecord(fiatRates, tokenAddress) ?? 0,
      );
      return new BigNumber(tokenAmount ?? 0)
        .dividedBy(decimals)
        .times(conversionRate)
        .toString(10);
    },
    [fiatRates, tokenDetails],
  );

  const getUSDValueForDestinationToken = useCallback(
    (tokenAmount: string) => {
      if (!quotesInput) {
        return '0';
      }
      const { destTokenAddress } = quotesInput;
      return getUSDValue(tokenAmount, destTokenAddress as Hex);
    },
    [fiatRates, getUSDValue, quotesInput],
  );

  const { value: quotes } = useAsyncResult<
    QuoteResponse[] | undefined
  >(async () => {
    if (!quotesInput) {
      return undefined;
    }

    captureDappSwapComparisonMetricsProperties({
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        dapp_swap_comparison: 'loading',
      },
    });

    const startTime = new Date().getTime();
    updateQuoteRequestLatency();

    const quotesList = await fetchQuotes(quotesInput);

    updateQuoteResponseLatency(startTime);
    return quotesList;
  }, [
    captureDappSwapComparisonMetricsProperties,
    quotesInput,
    requestDetectionLatency,
  ]);

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
    try {
      if (
        !amountMin ||
        !tokenDetails ||
        !fiatRates ||
        !quotes?.length ||
        !quotesInput ||
        !simulationData
      ) {
        return;
      }

      const selectedQuote: QuoteResponse | undefined = getBestQuote(
        quotes,
        amountMin,
        getUSDValueForDestinationToken,
        getGasUSDValue,
      );

      if (!selectedQuote) {
        return;
      }

      updateSwapComparisonLatency();

      const { destTokenAddress, srcTokenAmount, srcTokenAddress } = quotesInput;
      const {
        approval,
        quote: { destTokenAmount, minDestTokenAmount },
        trade,
      } = selectedQuote;

      const totalGasInQuote = getGasUSDValue(
        new BigNumber(
          ((approval as TxData)?.effectiveGas ??
            (approval as TxData)?.gasLimit ??
            0) +
            ((trade as TxData)?.effectiveGas ??
              (trade as TxData)?.gasLimit ??
              0),
          10,
        ),
      );

      const confirmationGasUsd = getGasUSDValue(
        new BigNumber(gasUsed ?? gasLimitNoBuffer ?? gas ?? '0x0', 16),
      );

      const destTokenBalanceChange = getBalanceChangeFromSimulationData(
        destTokenAddress as Hex,
        simulationData,
      );

      captureDappSwapComparisonMetricsProperties({
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          dapp_swap_comparison: 'completed',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_dapp_from_token_simulated_value_usd: getUSDValue(
            srcTokenAmount,
            srcTokenAddress as Hex,
          ),
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_dapp_to_token_simulated_value_usd:
            getUSDValueForDestinationToken(destTokenBalanceChange),
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_dapp_minimum_received_value_usd:
            getUSDValueForDestinationToken(amountMin),
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_dapp_network_fee_usd: confirmationGasUsd,
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
          swap_mm_slippage: (
            selectedQuote.quote as unknown as { slippage: string }
          ).slippage,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_mm_quote_provider: (
            selectedQuote.quote as unknown as { aggregator: string }
          ).aggregator,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_mm_network_fee_usd: totalGasInQuote,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_comparison_total_latency_ms: swapComparisonLatency,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_dapp_request_detection_latency_ms: requestDetectionLatency,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_mm_quote_request_latency_ms: quoteRequestLatency,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_mm_quote_response_latency_ms: quoteResponseLatency,
        },
        sensitiveProperties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_from_token_contract: srcTokenAddress,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_from_token_symbol:
            getTokenValueFromRecord<TokenStandAndDetails>(
              tokenDetails,
              srcTokenAddress as Hex,
            )?.symbol ?? 'N/A',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_to_token_contract: destTokenAddress,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_to_token_symbol:
            getTokenValueFromRecord<TokenStandAndDetails>(
              tokenDetails,
              destTokenAddress as Hex,
            )?.symbol ?? 'N/A',
        },
      });
    } catch (error) {
      captureException(error);
    }
  }, [
    amountMin,
    captureDappSwapComparisonMetricsProperties,
    fiatRates,
    gas,
    gasLimitNoBuffer,
    gasUsed,
    getGasUSDValue,
    getUSDValueForDestinationToken,
    getUSDValue,
    quotes,
    quotesInput,
    quoteRequestLatency,
    quoteResponseLatency,
    requestDetectionLatency,
    updateSwapComparisonLatency,
    simulationData,
    swapComparisonLatency,
    tokenDetails,
  ]);
}
