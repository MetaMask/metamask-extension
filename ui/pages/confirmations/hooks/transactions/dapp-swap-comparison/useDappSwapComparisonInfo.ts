import { BigNumber } from 'bignumber.js';
import { Hex } from '@metamask/utils';
import { QuoteResponse, TxData } from '@metamask/bridge-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import { captureException } from '@sentry/browser';
import { useCallback, useEffect, useMemo } from 'react';

import { TokenStandAndDetails } from '../../../../../store/actions';
import { fetchQuotes } from '../../../../../store/controller-actions/bridge-controller';
import { useAsyncResult } from '../../../../../hooks/useAsync';
import {
  getDataFromSwap,
  getBestQuote,
  getTokenValueFromRecord,
  getBalanceChangeFromSimulationData,
} from '../../../utils/dapp-swap-comparison-utils';
import { useConfirmContext } from '../../../context/confirm';
import { useTransactionEventFragment } from '../../useTransactionEventFragment';
import { useDappSwapComparisonLatencyMetrics } from './useDappSwapComparisonLatencyMetrics';
import { useDappSwapUSDValues } from './useDappSwapUSDValues';

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
  const { data, gas } = txParams ?? {};
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

  const {
    getGasUSDValue,
    getTokenUSDValue,
    getDestinationTokenUSDValue,
    tokenDetails,
    tokenInfoPending,
  } = useDappSwapUSDValues({
    tokenAddresses: tokenAddresses as Hex[],
    destTokenAddress: quotesInput?.destTokenAddress as Hex,
  });

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

  const { bestQuote, bestFilteredQuote } = useMemo(() => {
    if (!amountMin || !quotes?.length || tokenInfoPending) {
      return { bestQuote: undefined, bestFilteredQuote: undefined };
    }

    return getBestQuote(
      quotes,
      amountMin,
      getDestinationTokenUSDValue,
      getGasUSDValue,
    );
  }, [amountMin, getGasUSDValue, getDestinationTokenUSDValue, quotes]);

  useEffect(() => {
    try {
      if (
        !amountMin ||
        !bestQuote ||
        !quotesInput ||
        !simulationData ||
        !tokenDetails
      ) {
        return;
      }

      updateSwapComparisonLatency();

      const { destTokenAddress, srcTokenAmount, srcTokenAddress } = quotesInput;
      const {
        approval,
        quote: { destTokenAmount, minDestTokenAmount },
        trade,
      } = bestQuote;

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
          swap_dapp_from_token_simulated_value_usd: getTokenUSDValue(
            srcTokenAmount,
            srcTokenAddress as Hex,
          ),
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_dapp_to_token_simulated_value_usd: getDestinationTokenUSDValue(
            destTokenBalanceChange,
          ),
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_dapp_minimum_received_value_usd:
            getDestinationTokenUSDValue(amountMin),
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_dapp_network_fee_usd: confirmationGasUsd,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_mm_from_token_simulated_value_usd: getTokenUSDValue(
            srcTokenAmount,
            srcTokenAddress as Hex,
          ),
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_mm_to_token_simulated_value_usd:
            getDestinationTokenUSDValue(destTokenAmount),
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_mm_minimum_received_value_usd:
            getDestinationTokenUSDValue(minDestTokenAmount),
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_mm_slippage: (bestQuote.quote as unknown as { slippage: string })
            .slippage,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          swap_mm_quote_provider: (
            bestQuote.quote as unknown as { aggregator: string }
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
    bestQuote,
    captureDappSwapComparisonMetricsProperties,
    gas,
    gasLimitNoBuffer,
    gasUsed,
    getGasUSDValue,
    getDestinationTokenUSDValue,
    getTokenUSDValue,
    quotes,
    quotesInput,
    quoteRequestLatency,
    quoteResponseLatency,
    requestDetectionLatency,
    updateSwapComparisonLatency,
    simulationData,
    swapComparisonLatency,
    tokenDetails,
    tokenInfoPending,
  ]);

  return { selectedQuote: bestFilteredQuote };
}
