import { cloneDeep, isEmpty } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 98; // Increment the version number

/**
 * Add `verifiedOnBlockchain` property to transactions based on the presence of `txReceipt`
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly what we persist to dist.
 * @param originalVersionedData.meta - State metadata.
 * @param originalVersionedData.meta.version - The current state version.
 * @param originalVersionedData.data - The persisted MetaMask state, keyed by controller.
 * @returns Updated versioned MetaMask extension state.
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

    // Add the `verifiedOnBlockchain` property based on the presence of `txReceipt`
    transaction.verifiedOnBlockchain = Boolean(transaction.txReceipt);

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
