import { SmartTransactionStatuses } from '@metamask/smart-transactions-controller';
import { TransactionStatus as EvmTransactionStatus } from '@metamask/transaction-controller';
import { type TransactionStatus } from '../../../helpers/utils/transaction-display';

export const smartTransactionEvmFailureStatuses = new Set<string>([
  EvmTransactionStatus.failed,
  EvmTransactionStatus.dropped,
  EvmTransactionStatus.rejected,
  EvmTransactionStatus.cancelled,
]);

export const smartTransactionFailureStatuses = new Set<string>([
  SmartTransactionStatuses.CANCELLED,
  SmartTransactionStatuses.CANCELLED_USER_CANCELLED,
  SmartTransactionStatuses.REVERTED,
  SmartTransactionStatuses.UNKNOWN,
]);

export function mapSmartTransactionToastStatus(
  status?: string,
  evmStatus?: string,
): TransactionStatus | undefined {
  if (status === SmartTransactionStatuses.SUCCESS) {
    return 'success';
  }

  if (status && smartTransactionFailureStatuses.has(status)) {
    return 'failed';
  }

  // STX is pending/undefined — check the underlying EVM status to handle Cancel and Speed Up
  if (evmStatus && smartTransactionEvmFailureStatuses.has(evmStatus)) {
    return 'failed';
  }

  if (evmStatus === EvmTransactionStatus.confirmed) {
    return 'success';
  }

  if (!status || status === SmartTransactionStatuses.PENDING) {
    return 'pending';
  }

  return undefined;
}
