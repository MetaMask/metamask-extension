import { TransactionMeta } from '@metamask/transaction-controller';
import { TransactionMetricsRequest } from '../types/metametrics';

type SmartTransactionMetricsProperties = {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  is_smart_transactions_user_opt_in: boolean;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  is_smart_transactions_available: boolean;
  /**
   * @deprecated Use `is_smart_transactions_user_opt_in` and `is_smart_transactions_available` instead.
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  is_smart_transaction: boolean;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  stx_original_transaction_status?: string;
};

export const getSmartTransactionMetricsProperties = (
  transactionMetricsRequest: TransactionMetricsRequest,
  transactionMeta: TransactionMeta,
) => {
  const isSmartTransactionsUserOptIn =
    transactionMetricsRequest.getSmartTransactionsPreferenceEnabled();
  const isSmartTransactionsAvailable =
    transactionMetricsRequest.getSmartTransactionsEnabled(
      transactionMeta.chainId,
    );
  const isSmartTransaction = transactionMetricsRequest.getIsSmartTransaction(
    transactionMeta.chainId,
  );
  const properties = {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    is_smart_transactions_user_opt_in: isSmartTransactionsUserOptIn,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    is_smart_transactions_available: isSmartTransactionsAvailable,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    is_smart_transaction: isSmartTransaction,
  } as SmartTransactionMetricsProperties;
  if (!isSmartTransactionsUserOptIn || !isSmartTransactionsAvailable) {
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
  properties.stx_original_transaction_status =
    smartTransactionStatusMetadata.originalTransactionStatus;
  return properties;
};
