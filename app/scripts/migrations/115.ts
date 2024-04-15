import { cloneDeep, isEmpty } from 'lodash';
import {
  TransactionMeta,
  TransactionStatus,
} from '@metamask/transaction-controller';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 115;

// Target date is December 8, 2023 - 00:00:00 UTC
export const TARGET_DATE = new Date('2023-12-08T00:00:00Z').getTime();

/**
 * This migration updates the status of transactions that were approved or signed before December 8, 2023 to failed.
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
  const transactionControllerState = state?.TransactionController || {};
  const transactions = transactionControllerState?.transactions || {};

  if (isEmpty(transactions)) {
    return;
  }

  const newTxs = Object.keys(transactions).reduce(
    (txs: { [key: string]: TransactionMeta }, id) => {
      const transaction = cloneDeep(transactions[id]);
      const transactionDate = transaction.time;

      if (
        transactionDate < TARGET_DATE &&
        (transaction.status === TransactionStatus.approved ||
          transaction.status === TransactionStatus.signed)
      ) {
        transaction.status = TransactionStatus.failed;
      }

      return {
        ...txs,
        [id]: transaction,
      };
    },
    {},
  );

  state.TransactionController = {
    ...transactionControllerState,
    transactions: newTxs,
  };
}
