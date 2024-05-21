import { cloneDeep } from 'lodash';
import {
  TransactionMeta,
  TransactionStatus,
  TransactionError,
} from '@metamask/transaction-controller';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 116;

// Target date is December 8, 2023 - 00:00:00 UTC
export const TARGET_DATE = new Date('2023-12-08T00:00:00Z').getTime();

const STUCK_STATES = [TransactionStatus.approved, TransactionStatus.signed];

type FailedTransactionMeta = TransactionMeta & {
  status: TransactionStatus.failed;
  error: TransactionError;
};

export const StuckTransactionError = {
  name: 'StuckTransactionDueToStatus',
  message: 'Transaction is stuck due to status - migration 115',
};

/**
 * This migration sets the `status` to `failed` for all transactions created before December 8, 2023 that are still `approved` or `signed`.
 *
 * @param originalVersionedData
 */
export async function migrate(
  originalVersionedData: VersionedData,
): Promise<VersionedData> {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;
  transformState(versionedData.data);
  return versionedData;
}

// TODO: Replace `any` with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformState(state: Record<string, any>) {
  const transactions: TransactionMeta[] =
    state?.TransactionController?.transactions ?? [];

  for (const transaction of transactions) {
    if (
      transaction.time < TARGET_DATE &&
      STUCK_STATES.includes(transaction.status)
    ) {
      transaction.status = TransactionStatus.failed;

      const failedTransaction = transaction as FailedTransactionMeta;

      failedTransaction.error = StuckTransactionError;
    }
  }
}
