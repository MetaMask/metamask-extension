/* eslint-disable @typescript-eslint/naming-convention */
import { BigNumber } from 'bignumber.js';
import { TransactionType } from '@metamask/transaction-controller';
import { TRANSACTION_ENVELOPE_TYPE_NAMES } from '../../../../../shared/lib/transactions-controller-utils';
import {
  TransactionApprovalAmountType,
  TransactionMetaMetricsEvent,
} from '../../../../../shared/constants/transaction';
import {
  hexToDecimal,
  hexWEIToDecGWEI,
} from '../../../../../shared/modules/conversion.utils';
import { isEIP1559Transaction } from '../../../../../shared/modules/transaction.utils';
import type { TransactionMetricsBuilder } from './types';

export const getTransactionDetailsMetricsProperties: TransactionMetricsBuilder =
  ({
    eventName,
    transactionEventPayload,
    transactionMeta,
    context,
    transactionMetricsRequest,
  }) => {
    const replacedTransactionMeta = transactionMetricsRequest.getTransaction(
      transactionMeta.replacedById as string,
    );

    let transactionReplaced;
    if (
      eventName === TransactionMetaMetricsEvent.finalized &&
      transactionMeta.status === 'dropped'
    ) {
      transactionReplaced = 'other';
      if (replacedTransactionMeta?.type === TransactionType.cancel) {
        transactionReplaced = TransactionType.cancel;
      } else if (replacedTransactionMeta?.type === TransactionType.retry) {
        transactionReplaced = TransactionType.retry;
      }
    }

    const finalizedExtras =
      eventName === TransactionMetaMetricsEvent.finalized
        ? {
            ...(transactionEventPayload.error
              ? { error: transactionEventPayload.error }
              : {}),
            ...(transactionMeta.txReceipt?.gasUsed
              ? { gas_used: hexWEIToDecGWEI(transactionMeta.txReceipt.gasUsed) }
              : {}),
            ...(transactionMeta.txReceipt?.blockNumber
              ? {
                  block_number: hexToDecimal(
                    transactionMeta.txReceipt.blockNumber,
                  ),
                }
              : {}),
            ...(transactionMeta.status === 'dropped' ? { dropped: true } : {}),
            ...(transactionMeta.submittedTime
              ? {
                  completion_time: getTransactionCompletionTime(
                    transactionMeta.submittedTime,
                  ),
                }
              : {}),
            ...(transactionMeta.submittedTime && transactionMeta.blockTimestamp
              ? {
                  completion_time_onchain: getTransactionOnchainCompletionTime(
                    transactionMeta.submittedTime,
                    transactionMeta.blockTimestamp,
                  ),
                }
              : {}),
            ...(transactionMeta.txReceipt?.status === '0x0'
              ? { status: 'failed on-chain' }
              : {}),
          }
        : {};

    const hasBatchTransactions = Boolean(
      transactionMeta.nestedTransactions?.length,
    );

    return {
      properties: {},
      sensitiveProperties: {
        transaction_envelope_type: isEIP1559Transaction(transactionMeta)
          ? TRANSACTION_ENVELOPE_TYPE_NAMES.FEE_MARKET
          : TRANSACTION_ENVELOPE_TYPE_NAMES.LEGACY,
        first_seen: transactionMeta.time,
        transaction_replaced: transactionReplaced,
        ...(hasBatchTransactions
          ? {}
          : {
              transaction_contract_address:
                context.isContractInteraction && transactionMeta.txParams?.to
                  ? [transactionMeta.txParams.to]
                  : [],
            }),
        ...(context.isContractInteraction
          ? {
              transaction_contract_method_4byte: context.contractMethod4Byte,
            }
          : {}),
        ...finalizedExtras,
        ...(context.isApproveMethod
          ? {
              transaction_approval_amount_vs_balance_ratio:
                allowanceAmountInRelationToTokenBalance(
                  context.transactionApprovalAmountType,
                  transactionMeta.dappProposedTokenAmount,
                  transactionMeta.currentTokenBalance,
                ),
              transaction_approval_amount_vs_proposed_ratio:
                allowanceAmountInRelationToDappProposedValue(
                  context.transactionApprovalAmountType,
                  transactionMeta.originalApprovalAmount,
                  transactionMeta.finalApprovalAmount,
                ),
            }
          : {}),
      },
    };
  };

function allowanceAmountInRelationToDappProposedValue(
  transactionApprovalAmountType?: TransactionApprovalAmountType,
  originalApprovalAmount?: string,
  finalApprovalAmount?: string,
) {
  if (
    transactionApprovalAmountType === TransactionApprovalAmountType.custom &&
    originalApprovalAmount &&
    finalApprovalAmount
  ) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    return `${new BigNumber(originalApprovalAmount, 10)
      .div(finalApprovalAmount, 10)
      .times(100)
      .round(2)}`;
  }
  return null;
}

function allowanceAmountInRelationToTokenBalance(
  transactionApprovalAmountType?: TransactionApprovalAmountType,
  dappProposedTokenAmount?: string,
  currentTokenBalance?: string,
) {
  if (
    (transactionApprovalAmountType === TransactionApprovalAmountType.custom ||
      transactionApprovalAmountType ===
        TransactionApprovalAmountType.dappProposed) &&
    dappProposedTokenAmount &&
    currentTokenBalance
  ) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    return `${new BigNumber(dappProposedTokenAmount, 16)
      .div(currentTokenBalance, 10)
      .times(100)
      .round(2)}`;
  }
  return null;
}

function getTransactionCompletionTime(submittedTime: number) {
  return Math.round((Date.now() - submittedTime) / 1000).toString();
}

function getTransactionOnchainCompletionTime(
  submittedTimeMs: number,
  blockTimestampHex: string,
): string {
  const DECIMAL_DIGITS = 2;

  const blockTimestampSeconds = Number(hexToDecimal(blockTimestampHex));
  const completionTimeSeconds = blockTimestampSeconds - submittedTimeMs / 1000;
  const completionTimeSecondsRounded =
    Math.round(completionTimeSeconds * 10 ** DECIMAL_DIGITS) /
    10 ** DECIMAL_DIGITS;

  return completionTimeSecondsRounded.toString();
}
