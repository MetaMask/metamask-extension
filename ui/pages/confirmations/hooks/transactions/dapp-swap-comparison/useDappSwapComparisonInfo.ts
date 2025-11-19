/* eslint-disable @typescript-eslint/naming-convention */
import { BigNumber } from 'bignumber.js';
import { Hex } from '@metamask/utils';
import { QuoteResponse, TxData } from '@metamask/bridge-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useEffect, useMemo } from 'react';

import { captureException } from '../../../../../../shared/lib/sentry';
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
import { useDappSwapComparisonLatencyMetrics } from './useDappSwapComparisonLatencyMetrics';
import { useDappSwapUSDValues } from './useDappSwapUSDValues';
import { useDappSwapComparisonMetrics } from './useDappSwapComparisonMetrics';

const FOUR_BYTE_EXECUTE_SWAP_CONTRACT = '0x3593564c';

export function useDappSwapComparisonInfo() {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const {
    chainId,
    gasUsed,
    gasLimitNoBuffer,
    simulationData,
    txParams,
    nestedTransactions,
  } = currentConfirmation ?? {
    txParams: {},
  };
  const { data, gas } = txParams ?? {};
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

  const {
    captureDappSwapComparisonFailed,
    captureDappSwapComparisonLoading,
    captureDappSwapComparisonMetricsProperties,
  } = useDappSwapComparisonMetrics();

  const { commands, quotesInput, amountMin, tokenAddresses } = useMemo(() => {
    try {
      let transactionData = data;
      if (nestedTransactions?.length) {
        transactionData = nestedTransactions?.find(({ data: trxnData }) =>
          trxnData?.startsWith(FOUR_BYTE_EXECUTE_SWAP_CONTRACT),
        )?.data;
      }
      const result = getDataFromSwap(
        chainId,
        transactionData,
        txParams?.from as string,
      );
      updateRequestDetectionLatency();
      return result;
    } catch (error) {
      captureException(error);
      captureDappSwapComparisonFailed('error parsing swap data');
      return {
        commands: '',
        quotesInput: undefined,
        amountMin: undefined,
        tokenAddresses: [],
      };
    }
  }, [
    captureDappSwapComparisonFailed,
    chainId,
    data,
    nestedTransactions,
    txParams?.from,
    updateRequestDetectionLatency,
  ]);

  const {
    fiatRates,
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
    try {
      if (!quotesInput) {
        return undefined;
      }

      captureDappSwapComparisonLoading(commands);

      updateQuoteRequestLatency();
      const startTime = new Date().getTime();
      const quotesList = await fetchQuotes(quotesInput);
      updateQuoteResponseLatency(startTime);
      return quotesList;
    } catch (error) {
      captureException(error);
      captureDappSwapComparisonFailed('error fetching quotes');
      return undefined;
    }
  }, [
    commands,
    captureDappSwapComparisonFailed,
    captureDappSwapComparisonLoading,
    quotesInput,
    updateQuoteResponseLatency,
    updateQuoteRequestLatency,
  ]);

  const { bestQuote, bestFilteredQuote: selectedQuote } = useMemo(() => {
    try {
      if (amountMin === undefined || !quotes?.length || tokenInfoPending) {
        return { bestQuote: undefined, bestFilteredQuote: undefined };
      }

      return getBestQuote(
        quotes,
        amountMin,
        getDestinationTokenUSDValue,
        getGasUSDValue,
      );
    } catch (error) {
      captureException(error);
      captureDappSwapComparisonFailed('error getting best quote');
      return { bestQuote: undefined, bestFilteredQuote: undefined };
    }
  }, [
    amountMin,
    captureDappSwapComparisonFailed,
    getGasUSDValue,
    getDestinationTokenUSDValue,
    quotes,
    tokenInfoPending,
  ]);

  useEffect(() => {
    try {
      if (
        amountMin === undefined ||
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
          swap_dapp_comparison: 'completed',
          swap_dapp_commands: commands,
          swap_dapp_from_token_simulated_value_usd: getTokenUSDValue(
            srcTokenAmount,
            srcTokenAddress as Hex,
          ),
          swap_dapp_to_token_simulated_value_usd: getDestinationTokenUSDValue(
            destTokenBalanceChange,
          ),
          swap_dapp_minimum_received_value_usd:
            getDestinationTokenUSDValue(amountMin),
          swap_dapp_network_fee_usd: confirmationGasUsd,
          swap_mm_from_token_simulated_value_usd: getTokenUSDValue(
            srcTokenAmount,
            srcTokenAddress as Hex,
          ),
          swap_mm_to_token_simulated_value_usd:
            getDestinationTokenUSDValue(destTokenAmount),
          swap_mm_minimum_received_value_usd:
            getDestinationTokenUSDValue(minDestTokenAmount),
          swap_mm_slippage: (bestQuote.quote as unknown as { slippage: string })
            .slippage,
          swap_mm_quote_provider: (
            bestQuote.quote as unknown as { aggregator: string }
          ).aggregator,
          swap_mm_network_fee_usd: totalGasInQuote,
          swap_comparison_total_latency_ms: swapComparisonLatency,
          swap_dapp_request_detection_latency_ms: requestDetectionLatency,
          swap_mm_quote_request_latency_ms: quoteRequestLatency,
          swap_mm_quote_response_latency_ms: quoteResponseLatency,
        },
        sensitiveProperties: {
          swap_from_token_contract: srcTokenAddress,
          swap_from_token_symbol:
            getTokenValueFromRecord<TokenStandAndDetails>(
              tokenDetails,
              srcTokenAddress as Hex,
            )?.symbol ?? 'N/A',
          swap_to_token_contract: destTokenAddress,
          swap_to_token_symbol:
            getTokenValueFromRecord<TokenStandAndDetails>(
              tokenDetails,
              destTokenAddress as Hex,
            )?.symbol ?? 'N/A',
        },
      });
    } catch (error) {
      captureException(error);
      captureDappSwapComparisonFailed('error calculating metrics values');
    }
  }, [
    amountMin,
    bestQuote,
    captureDappSwapComparisonFailed,
    captureDappSwapComparisonMetricsProperties,
    commands,
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

  const {
    selectedQuoteValueDifference = 0,
    gasDifference = 0,
    tokenAmountDifference = 0,
    destinationTokenSymbol,
  } = useMemo(() => {
    if (!selectedQuote || !quotesInput || !simulationData || !tokenDetails) {
      return {};
    }

    const { destTokenAddress } = quotesInput;
    const {
      approval,
      quote: { destTokenAmount },
      trade,
    } = selectedQuote;

    const totalGasInQuote = new BigNumber(
      getGasUSDValue(
        new BigNumber(
          ((approval as TxData)?.effectiveGas ??
            (approval as TxData)?.gasLimit ??
            0) +
            ((trade as TxData)?.effectiveGas ??
              (trade as TxData)?.gasLimit ??
              0),
          10,
        ),
      ),
    );

    const destinationTokenAmountInQuote = new BigNumber(
      getDestinationTokenUSDValue(destTokenAmount),
    );

    const totalAmountInQuote =
      destinationTokenAmountInQuote.minus(totalGasInQuote);

    const totalGasInConfirmation = new BigNumber(
      getGasUSDValue(
        new BigNumber(gasUsed ?? gasLimitNoBuffer ?? gas ?? '0x0', 16),
      ),
    );

    const destinationTokenAmountInConfirmation = new BigNumber(
      getDestinationTokenUSDValue(
        getBalanceChangeFromSimulationData(
          destTokenAddress as Hex,
          simulationData,
        ),
      ),
    );

    const totalAmountInConfirmation =
      destinationTokenAmountInConfirmation.minus(totalGasInConfirmation);

    const selectedQuoteValueDiff = totalAmountInQuote
      .minus(totalAmountInConfirmation)
      .toNumber();

    const gasDiff = totalGasInConfirmation.minus(totalGasInQuote).toNumber();

    const tokenAmountDiff = destinationTokenAmountInQuote
      .minus(destinationTokenAmountInConfirmation)
      .toNumber();

    const destinationTokenSym = getTokenValueFromRecord<TokenStandAndDetails>(
      tokenDetails,
      destTokenAddress as Hex,
    )?.symbol;

    return {
      selectedQuoteValueDifference: selectedQuoteValueDiff,
      gasDifference: gasDiff > 0 ? gasDiff : 0,
      tokenAmountDifference: tokenAmountDiff > 0 ? tokenAmountDiff : 0,
      destinationTokenSymbol: destinationTokenSym,
    };
  }, [
    selectedQuote,
    getDestinationTokenUSDValue,
    getGasUSDValue,
    gas,
    gasLimitNoBuffer,
    gasUsed,
    quotesInput,
    simulationData,
    tokenDetails,
  ]);

  return {
    fiatRates,
    destinationTokenSymbol,
    gasDifference,
    selectedQuote,
    selectedQuoteValueDifference,
    sourceTokenAmount: quotesInput?.srcTokenAmount,
    minDestTokenAmountInUSD: getDestinationTokenUSDValue(
      selectedQuote?.quote?.minDestTokenAmount ?? '0',
      2,
    ),
    tokenAmountDifference,
    tokenDetails,
  };
}
