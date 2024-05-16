import { TransactionMeta } from '@metamask/transaction-controller';
import { TransactionMetricsRequest } from '../../app/scripts/lib/transaction/metrics';

type SmartTransactionMetricsProperties = {
  is_smart_transaction: boolean;
  smart_transaction_duplicated?: boolean;
  smart_transaction_timed_out?: boolean;
  smart_transaction_proxied?: boolean;
};

export const getSmartTransactionMetricsProperties = (
  transactionMetricsRequest: TransactionMetricsRequest,
  transactionMeta: TransactionMeta,
) => {
  const isSmartTransaction = transactionMetricsRequest.getIsSmartTransaction();
  const properties = {
    is_smart_transaction: isSmartTransaction,
  } as SmartTransactionMetricsProperties;
  if (!isSmartTransaction) {
    return properties;
  }
  const smartTransaction =
    transactionMetricsRequest.getSmartTransactionByMinedTxHash(
      transactionMeta.hash,
    );
  const smartTransactionStatusMetadata = smartTransaction?.statusMetadata;
  if (!smartTransactionStatusMetadata) {
    return properties;
  }
  properties.smart_transaction_duplicated =
    smartTransactionStatusMetadata.duplicated;
  properties.smart_transaction_timed_out =
    smartTransactionStatusMetadata.timedOut;
  properties.smart_transaction_proxied = smartTransactionStatusMetadata.proxied;
  return properties;
};
