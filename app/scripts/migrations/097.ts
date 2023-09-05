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
  const TransactionController = state?.TransactionController || {};
  const transactions = state?.TransactionController?.transactions || {};

  if (isEmpty(TransactionController) || isEmpty(transactions)) {
    return;
  }

  const newTxs = Object.keys(transactions).reduce((txs, txId) => {
    const transaction = transactions[txId];
    if (transaction?.nonceDetail) {
      delete transaction.nonceDetail;
    }
    return {
      ...txs,
      [txId]: transaction,
    };
  }, {});

  state.TransactionController = {
    ...TransactionController,
    transactions: {
      ...newTxs,
    },
  };
}
