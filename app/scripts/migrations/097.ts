import { cloneDeep, isEmpty } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 97;

/**
 * Remove `nonceDetail` from transactions
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

  const newTxs = Object.keys(transactions).reduce((txs, txId) => {
    const transaction = transactions[txId];
    if (transaction?.nonceDetails) {
      delete transaction.nonceDetails;
    }
    return {
      ...txs,
      [txId]: transaction,
    };
  }, {});

  state.TransactionController = {
    ...transactionControllerState,
    transactions: newTxs,
  };
}
