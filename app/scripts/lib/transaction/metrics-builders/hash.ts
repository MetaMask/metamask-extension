/* eslint-disable @typescript-eslint/naming-convention */
import { TransactionStatus } from '@metamask/transaction-controller';
import type { MetricsProperties, TransactionMetricsBuilder } from './types';

export const getHashMetricsProperties: TransactionMetricsBuilder = ({
  transactionMeta,
  transactionMetricsRequest,
}) => {
  const properties: MetricsProperties = {};

  const isExtensionUxPna25Enabled =
    transactionMetricsRequest.getFeatureFlags()?.extensionUxPna25;
  const isPna25Acknowledged = transactionMetricsRequest.getPna25Acknowledged();
  const isMetricsOptedIn = transactionMetricsRequest.getParticipateInMetrics();
  const isFinalisedStatus = [
    TransactionStatus.confirmed,
    TransactionStatus.dropped,
    TransactionStatus.failed,
  ].includes(transactionMeta.status);

  if (
    isExtensionUxPna25Enabled &&
    isPna25Acknowledged &&
    isMetricsOptedIn &&
    isFinalisedStatus
  ) {
    properties.transaction_hash = transactionMeta.hash;
  }

  return {
    properties,
    sensitiveProperties: {},
  };
};
