import { cloneDeep } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 95;

/**
 * This migration does the following:
 *
 * - Moves any incoming transactions from the IncomingTransactionsController to the TransactionController state.
 * - Generates the new lastFetchedBlockNumbers object in the TransactionController using any existing incoming transactions.
 * - Removes the IncomingTransactionsController state.
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
  migrateData(versionedData.data);
  return versionedData;
}

function migrateData(state: Record<string, unknown>): void {
  moveIncomingTransactions(state);
  generateLastFetchedBlockNumbers(state);
  removeIncomingTransactionsControllerState(state);
}

function moveIncomingTransactions(state: Record<string, any>) {
  const incomingTransactions: Record<string, any> =
    state.IncomingTransactionsController?.incomingTransactions || {};

  if (Object.keys(incomingTransactions).length === 0) {
    return;
  }

  const transactions = state.TransactionController?.transactions || {};

  const updatedTransactions = Object.values(incomingTransactions).reduce(
    (result: Record<string, any>, tx: any) => {
      result[tx.id] = tx;
      return result;
    },
    transactions,
  );

  state.TransactionController = {
    ...(state.TransactionController || {}),
    transactions: updatedTransactions,
  };
}

function generateLastFetchedBlockNumbers(state: Record<string, any>) {
  const incomingTransactions: Record<string, any> =
    state.IncomingTransactionsController?.incomingTransactions || {};

  if (Object.keys(incomingTransactions).length === 0) {
    return;
  }

  const lastFetchedBlockNumbers: Record<string, number> = {};

  for (const tx of Object.values(incomingTransactions)) {
    if (!tx.blockNumber || !tx.chainId || !tx.txParams.to) {
      continue;
    }

    const txBlockNumber = parseInt(tx.blockNumber, 10);
    const key = `${tx.chainId}#${tx.txParams.to.toLowerCase()}`;
    const highestBlockNumber = lastFetchedBlockNumbers[key] || -1;

    lastFetchedBlockNumbers[key] = Math.max(highestBlockNumber, txBlockNumber);
  }

  state.TransactionController = {
    ...state.TransactionController,
    lastFetchedBlockNumbers,
  };
}

function removeIncomingTransactionsControllerState(
  state: Record<string, unknown>,
) {
  delete state.IncomingTransactionsController;
}
