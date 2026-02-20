import { TransactionMeta } from '@metamask/transaction-controller';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';
import { TransactionMetaMetricsEvent } from '../../../../shared/constants/transaction';
import type {
  TransactionEventPayload,
  TransactionMetaEventPayload,
  TransactionMetricsRequest,
} from '../../../../shared/types/metametrics';
import { getBuilderMetrics } from './metrics-builders';
import { handleSwapPostTransactionMetricHandler } from './swap-post-transaction-metric-handler';

export const handleTransactionAdded = async (
  transactionMetricsRequest: TransactionMetricsRequest,
  transactionEventPayload: TransactionEventPayload,
) => {
  await trackTransactionEvent({
    eventName: TransactionMetaMetricsEvent.added,
    transactionMetricsRequest,
    transactionEventPayload,
  });
};

export const handleTransactionApproved = async (
  transactionMetricsRequest: TransactionMetricsRequest,
  transactionEventPayload: TransactionEventPayload,
) => {
  await trackTransactionEvent({
    eventName: TransactionMetaMetricsEvent.approved,
    transactionMetricsRequest,
    transactionEventPayload,
  });
};

export const handleTransactionFailed = async (
  transactionMetricsRequest: TransactionMetricsRequest,
  transactionEventPayload: TransactionEventPayload,
) => {
  await trackTransactionEvent({
    eventName: TransactionMetaMetricsEvent.finalized,
    transactionMetricsRequest,
    transactionEventPayload,
  });
};

export const handleTransactionConfirmed = async (
  transactionMetricsRequest: TransactionMetricsRequest,
  transactionEventPayload: TransactionMetaEventPayload,
) => {
  await trackTransactionEvent({
    eventName: TransactionMetaMetricsEvent.finalized,
    transactionMetricsRequest,
    transactionEventPayload: {
      actionId: transactionEventPayload.actionId,
      transactionMeta: transactionEventPayload,
    },
  });
};

export const handleTransactionDropped = async (
  transactionMetricsRequest: TransactionMetricsRequest,
  transactionEventPayload: TransactionEventPayload,
) => {
  await trackTransactionEvent({
    eventName: TransactionMetaMetricsEvent.finalized,
    transactionMetricsRequest,
    transactionEventPayload,
  });
};

export const handleTransactionRejected = async (
  transactionMetricsRequest: TransactionMetricsRequest,
  transactionEventPayload: TransactionEventPayload,
) => {
  await trackTransactionEvent({
    eventName: TransactionMetaMetricsEvent.rejected,
    transactionMetricsRequest,
    transactionEventPayload,
  });
};

export const handleTransactionSubmitted = async (
  transactionMetricsRequest: TransactionMetricsRequest,
  transactionEventPayload: TransactionEventPayload,
) => {
  await trackTransactionEvent({
    eventName: TransactionMetaMetricsEvent.submitted,
    transactionMetricsRequest,
    transactionEventPayload,
  });
};

async function trackTransactionEvent({
  eventName,
  transactionMetricsRequest,
  transactionEventPayload,
}: {
  eventName: TransactionMetaMetricsEvent;
  transactionMetricsRequest: TransactionMetricsRequest;
  transactionEventPayload: TransactionEventPayload;
}) {
  if (!transactionEventPayload.transactionMeta) {
    return;
  }

  const { properties, sensitiveProperties } = await getBuilderMetrics({
    eventName,
    transactionEventPayload,
    transactionMeta: transactionEventPayload.transactionMeta,
    transactionMetricsRequest,
  });

  transactionMetricsRequest.trackEvent({
    event: eventName,
    category: MetaMetricsEventCategory.Transactions,
    properties,
    sensitiveProperties,
    actionId: transactionEventPayload.actionId,
  });
}

export const handlePostTransactionBalanceUpdate = async (
  transactionMetricsRequest: TransactionMetricsRequest,
  {
    transactionMeta,
    approvalTransactionMeta,
  }: {
    transactionMeta: TransactionMeta;
    approvalTransactionMeta?: TransactionMeta;
  },
) => {
  await handleSwapPostTransactionMetricHandler(transactionMetricsRequest, {
    transactionMeta,
    approvalTransactionMeta,
  });
};
