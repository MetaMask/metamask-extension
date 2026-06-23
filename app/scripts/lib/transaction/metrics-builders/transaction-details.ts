/* eslint-disable @typescript-eslint/naming-convention */
import { TransactionMetaMetricsEvent } from '../../../../../shared/constants/transaction';
import type { TransactionMetricsBuilder } from './types';

export const getTransactionDetailsMetricsProperties: TransactionMetricsBuilder =
  ({ eventName, transactionEventPayload, transactionMeta, context }) => {
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

    const properties = {
      ...(transactionEventPayload.error
        ? { error: transactionEventPayload.error }
        : {}),
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
    };

    return {
      properties,
      sensitiveProperties: {},
    };
  };

function getTransactionCompletionTime(submittedTime: number) {
  return Math.round((Date.now() - submittedTime) / 1000).toString();
}
