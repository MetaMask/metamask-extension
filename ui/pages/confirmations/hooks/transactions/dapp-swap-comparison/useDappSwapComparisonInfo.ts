/* eslint-disable @typescript-eslint/naming-convention */
import { BigNumber } from 'bignumber.js';
import { Hex } from '@metamask/utils';
import { QuoteResponse, TxData } from '@metamask/bridge-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { captureException } from '../../../../../../shared/lib/sentry';
import {
  getBestQuote,
  getBalanceChangeFromSimulationData,
} from '../../../../../../shared/modules/dapp-swap-comparison/dapp-swap-comparison-utils';
import { TokenStandAndDetails } from '../../../../../store/actions';
import { getRemoteFeatureFlags } from '../../../../../selectors/remote-feature-flags';
import { ConfirmMetamaskState } from '../../../types/confirm';
import { getTokenValueFromRecord } from '../../../utils/token';
import { selectDappSwapComparisonData } from '../../../selectors/confirm';
import { useConfirmContext } from '../../../context/confirm';
import { useDappSwapComparisonLatencyMetrics } from './useDappSwapComparisonLatencyMetrics';
import { useDappSwapComparisonMetrics } from './useDappSwapComparisonMetrics';
import { useDappSwapUSDValues } from './useDappSwapUSDValues';

const getGasFromQuote = (quote: QuoteResponse) => {
  const { approval, trade } = quote;
  const approvalGas =
    (approval as TxData)?.effectiveGas ?? (approval as TxData)?.gasLimit ?? 0;
  const tradeGas =
    (trade as TxData)?.effectiveGas ?? (trade as TxData)?.gasLimit ?? 0;
  return new BigNumber(approvalGas + tradeGas);
};

export function useDappSwapComparisonInfo() {
  const { dappSwapUi, dappSwapQa } = useSelector(getRemoteFeatureFlags) as {
    dappSwapUi: { enabled: boolean };
    dappSwapQa: { enabled: boolean };
  };

  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const {
    quotes,
    latency: quoteResponseLatency,
    commands,
    error: quoteFetchError,
    swapInfo,
  } = useSelector((state: ConfirmMetamaskState) => {
    return selectDappSwapComparisonData(
      state,
      currentConfirmation?.requestId ?? '',
    );
  }) ?? { quotes: undefined };
  const { updateSwapComparisonLatency } = useDappSwapComparisonLatencyMetrics();
  const {
    captureDappSwapComparisonFailed,
    captureDappSwapComparisonLoading,
    captureDappSwapComparisonMetricsProperties,
  } = useDappSwapComparisonMetrics();

  const { gasUsed, gasLimitNoBuffer, simulationData, txParams } =
    currentConfirmation ?? {
      txParams: {},
    };
  const { gas } = txParams ?? {};

  useEffect(() => {
    if (swapInfo) {
      captureDappSwapComparisonLoading(commands ?? '');
    }
  }, [captureDappSwapComparisonLoading, commands, swapInfo]);

  useEffect(() => {
    if (quoteFetchError) {
      captureDappSwapComparisonFailed(quoteFetchError, commands);
    }
  }, [captureDappSwapComparisonFailed, quoteFetchError, commands]);

  const {
    fiatRates,
    getGasUSDValue,
    getTokenUSDValue,
    getDestinationTokenUSDValue,
    tokenDetails,
    tokenInfoPending,
  } = useDappSwapUSDValues({
    tokenAddresses: swapInfo
      ? [swapInfo.srcTokenAddress, swapInfo.destTokenAddress]
      : [],
    destTokenAddress: swapInfo?.destTokenAddress as Hex,
  });

  const { bestQuote, selectedQuote } = useMemo(() => {
    try {
      if (
        swapInfo?.destTokenAmountMin === undefined ||
        !quotes?.length ||
        tokenInfoPending
      ) {
        return { bestQuote: undefined, selectedQuote: undefined };
      }
      const { bestQuote: bestAvailableQuote, bestFilteredQuote } = getBestQuote(
        quotes,
        swapInfo?.destTokenAmountMin as Hex,
        getDestinationTokenUSDValue,
        getGasUSDValue,
      );

      const selectedBestQuote =
        bestFilteredQuote ||
        (dappSwapQa?.enabled ? bestAvailableQuote : undefined);

      return {
        bestQuote: bestAvailableQuote,
        selectedQuote: selectedBestQuote,
      };
    } catch (error) {
      captureException(error);
      captureDappSwapComparisonFailed(
        `Error calculating best quote: ${(error as Error).message}`,
        commands,
      );
      return { bestQuote: undefined, selectedQuote: undefined };
    }
  }, [
    commands,
    captureDappSwapComparisonFailed,
    dappSwapQa?.enabled,
    getGasUSDValue,
    getDestinationTokenUSDValue,
    quotes,
    swapInfo?.destTokenAmountMin,
    tokenInfoPending,
  ]);

  useEffect(() => {
    try {
      if (
        !bestQuote ||
        !simulationData ||
        swapInfo?.destTokenAmountMin === undefined ||
        !swapInfo ||
        !tokenDetails
      ) {
        return;
      }

      const swapComparisonLatency = updateSwapComparisonLatency();

      const { destTokenAddress, srcTokenAddress, srcTokenAmount } = swapInfo;
      const {
        quote: { destTokenAmount, minDestTokenAmount },
      } = bestQuote;

      const totalGasInQuote = getGasUSDValue(getGasFromQuote(bestQuote));

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
          swap_dapp_commands: commands ?? '',
          swap_dapp_from_token_simulated_value_usd: getTokenUSDValue(
            srcTokenAmount,
            srcTokenAddress as Hex,
          ),
          swap_dapp_to_token_simulated_value_usd: getDestinationTokenUSDValue(
            destTokenBalanceChange,
          ),
          swap_dapp_minimum_received_value_usd: getDestinationTokenUSDValue(
            swapInfo?.destTokenAmountMin as Hex,
          ),
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
          swap_mm_quote_response_latency_ms:
            quoteResponseLatency?.toString() ?? 'N_A',
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
      captureDappSwapComparisonFailed(
        `Error calculating metrics values: ${(error as Error).message}`,
        commands,
      );
    }
  }, [
    bestQuote,
    captureDappSwapComparisonFailed,
    captureDappSwapComparisonMetricsProperties,
    commands,
    gas,
    getDestinationTokenUSDValue,
    getGasUSDValue,
    gasLimitNoBuffer,
    getTokenUSDValue,
    gasUsed,
    quotes,
    quoteResponseLatency,
    simulationData,
    swapInfo,
    tokenDetails,
    tokenInfoPending,
    updateSwapComparisonLatency,
  ]);

  const { selectedQuoteValueDifference = 0, tokenAmountDifference = 0 } =
    useMemo(() => {
      try {
        if (
          !selectedQuote ||
          !swapInfo ||
          !simulationData ||
          !tokenDetails ||
          !dappSwapUi?.enabled
        ) {
          return {};
        }

        const { destTokenAddress } = swapInfo;
        const {
          quote: { destTokenAmount },
        } = selectedQuote;

        const totalGasInQuote = new BigNumber(
          getGasUSDValue(getGasFromQuote(selectedQuote)),
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

        const tokenAmountDiff = destinationTokenAmountInQuote
          .minus(destinationTokenAmountInConfirmation)
          .toNumber();

        return {
          selectedQuoteValueDifference: selectedQuoteValueDiff,
          tokenAmountDifference: tokenAmountDiff,
        };
      } catch (error) {
        captureException(error);
        return { selectedQuoteValueDifference: 0, tokenAmountDifference: 0 };
      }
    }, [
      gas,
      gasLimitNoBuffer,
      gasUsed,
      getDestinationTokenUSDValue,
      getGasUSDValue,
      selectedQuote,
      simulationData,
      swapInfo,
      tokenDetails,
      dappSwapUi.enabled,
    ]);

  return {
    dappSwapUi,
    fiatRates,
    minDestTokenAmountInUSD: getDestinationTokenUSDValue(
      selectedQuote?.quote?.minDestTokenAmount ?? '0',
      2,
    ),
    selectedQuote,
    selectedQuoteValueDifference,
    sourceTokenAmount: swapInfo?.srcTokenAmount,
    tokenAmountDifference,
    tokenDetails,
  };
}
