/* eslint-disable @typescript-eslint/naming-convention */
import { BigNumber } from 'bignumber.js';
import { TransactionMeta } from '@metamask/transaction-controller';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import type { TransactionMetricsRequest } from '../../../../shared/types/metametrics';
import {
  calcGasTotal,
  getSwapsTokensReceivedFromTxMeta,
} from '../../../../shared/lib/transactions-controller-utils';
import { hexWEIToDecETH } from '../../../../shared/modules/conversion.utils';

export async function handleSwapPostTransactionMetricHandler(
  {
    getParticipateInMetrics,
    trackEvent,
    getHDEntropyIndex,
  }: TransactionMetricsRequest,
  {
    transactionMeta,
    approvalTransactionMeta,
  }: {
    transactionMeta: TransactionMeta;
    approvalTransactionMeta?: TransactionMeta;
  },
) {
  if (getParticipateInMetrics() && transactionMeta.swapMetaData) {
    if (transactionMeta.txReceipt?.status === '0x0') {
      trackEvent({
        event: MetaMetricsEventName.SwapFailed,
        category: MetaMetricsEventCategory.Swaps,
        sensitiveProperties: { ...transactionMeta.swapMetaData },
        properties: {
          hd_entropy_index: getHDEntropyIndex(),
        },
      });
    } else {
      const tokensReceived = getSwapsTokensReceivedFromTxMeta(
        transactionMeta.destinationTokenSymbol,
        transactionMeta,
        transactionMeta.destinationTokenAddress,
        transactionMeta.txParams.from,
        transactionMeta.destinationTokenDecimals,
        approvalTransactionMeta,
        transactionMeta.chainId,
      );

      const quoteVsExecutionRatio = tokensReceived
        ? // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31893
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          `${new BigNumber(tokensReceived, 10)
            .div(transactionMeta.swapMetaData.token_to_amount, 10)
            .times(100)
            .toFixed(2)}%`
        : null;

      const estimatedVsUsedGasRatio =
        transactionMeta.txReceipt?.gasUsed &&
        transactionMeta.swapMetaData.estimated_gas
          ? // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31893
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            `${new BigNumber(transactionMeta.txReceipt.gasUsed, 16)
              .div(transactionMeta.swapMetaData.estimated_gas, 10)
              .times(100)
              .toFixed(2)}%`
          : null;

      const transactionsCost = calculateTransactionsCost(
        transactionMeta,
        approvalTransactionMeta,
      );

      trackEvent({
        event: MetaMetricsEventName.SwapCompleted,
        category: MetaMetricsEventCategory.Swaps,
        sensitiveProperties: {
          ...transactionMeta.swapMetaData,
          token_to_amount_received: tokensReceived,
          quote_vs_executionRatio: quoteVsExecutionRatio,
          estimated_vs_used_gasRatio: estimatedVsUsedGasRatio,
          approval_gas_cost_in_eth: transactionsCost.approvalGasCostInEth,
          trade_gas_cost_in_eth: transactionsCost.tradeGasCostInEth,
          trade_and_approval_gas_cost_in_eth:
            transactionsCost.tradeAndApprovalGasCostInEth,
          // Firefox and Chrome have different implementations of the APIs
          // that we rely on for communication accross the app. On Chrome big
          // numbers are converted into number strings, on firefox they remain
          // Big Number objects. As such, we convert them here for both
          // browsers.
          token_to_amount:
            transactionMeta.swapMetaData.token_to_amount.toString(10),
        },
        properties: {
          hd_entropy_index: getHDEntropyIndex(),
        },
      });
    }
  }
}

function calculateTransactionsCost(
  transactionMeta: TransactionMeta,
  approvalTransactionMeta?: TransactionMeta,
) {
  let approvalGasCost = '0x0';
  if (approvalTransactionMeta?.txReceipt) {
    approvalGasCost = calcGasTotal(
      approvalTransactionMeta.txReceipt.gasUsed,
      approvalTransactionMeta.txReceipt.effectiveGasPrice,
    );
  }
  const tradeGasCost = calcGasTotal(
    transactionMeta.txReceipt?.gasUsed,
    transactionMeta.txReceipt?.effectiveGasPrice,
  );
  const tradeAndApprovalGasCost = new BigNumber(tradeGasCost, 16)
    .plus(approvalGasCost, 16)
    .toString(16);
  return {
    approvalGasCostInEth: Number(hexWEIToDecETH(approvalGasCost)),
    tradeGasCostInEth: Number(hexWEIToDecETH(tradeGasCost)),
    tradeAndApprovalGasCostInEth: Number(
      hexWEIToDecETH(tradeAndApprovalGasCost),
    ),
  };
}
