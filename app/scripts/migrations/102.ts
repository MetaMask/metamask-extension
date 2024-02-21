import { cloneDeep, isEmpty } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 102;

/**
 * The core TransactionController uses `error` to log transaction error information.
 * For the sake of standardization and minimizing code maintenance, `err` is renamed as part of the unification of the Transaction Controller effort.
 * This migration adds an `error` property by copying the old `err` and deleting it afterwards.
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

function transformState(state: Record<string, any>) {
  const transactionControllerState = state?.TransactionController || {};
  const transactions = transactionControllerState?.transactions || {};

  if (isEmpty(transactions)) {
    return;
  }

  const newTxs = Object.keys(transactions).reduce(
    (txs: { [key: string]: any }, txId) => {
      // Clone the transaction
      const transaction = cloneDeep(transactions[txId]);

      // Check if 'err' exists before assigning it to 'error'
      if (transaction?.err) {
        transaction.error = transaction.err;
        delete transaction.err;
      }

      return {
        ...txs,
        [txId]: transaction,
      };
    },
    {},
  );

  state.TransactionController = {
    ...transactionControllerState,
    transactions: newTxs,
  };
}
