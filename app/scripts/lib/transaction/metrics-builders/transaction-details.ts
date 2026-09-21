/* eslint-disable @typescript-eslint/naming-convention */
import { TransactionMetaMetricsEvent } from '../../../../../shared/constants/transaction';
import type { TransactionMetricsBuilder } from './types';

export const getTransactionDetailsMetricsProperties: TransactionMetricsBuilder =
  ({ eventName, transactionEventPayload, transactionMeta, context }) => {
    const transactionParams =
      transactionMeta.containerTypes?.length && transactionMeta.txParamsOriginal
        ? transactionMeta.txParamsOriginal
        : transactionMeta.txParams;
    const finalizedExtras =
      eventName === TransactionMetaMetricsEvent.finalized
        ? {
            ...(transactionMeta.submittedTime
              ? {
                  completion_time: getTransactionCompletionTime(
                    transactionMeta.submittedTime,
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

    const onChainError =
      eventName === TransactionMetaMetricsEvent.finalized
        ? transactionMeta.revert?.receipt?.message
        : undefined;
    const error = transactionEventPayload.error ?? onChainError;

    const properties = {
      ...(error ? { error } : {}),
      ...(hasBatchTransactions
        ? {}
        : {
            transaction_contract_address:
              context.isContractInteraction && transactionParams.to
                ? [transactionParams.to]
                : [],
          }),
      ...(context.isContractInteraction
        ? {
            transaction_contract_method_4byte: transactionParams.data?.slice(
              0,
              10,
            ),
          }
        : {}),
      ...finalizedExtras,
    };

    return {
      properties,
      sensitiveProperties: {},
    };
  };

function getTransactionCompletionTime(submittedTime: number) {
  return Math.round((Date.now() - submittedTime) / 1000).toString();
}
