import { cloneDeep } from 'lodash';
import { TransactionType } from '@metamask/transaction-controller';

const version = 53;

/**
 * Deprecate transactionCategory and consolidate on 'type'
 */
export default {
  version,
  async migrate(originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = versionedData.data;
    versionedData.data = transformState(state);
    return versionedData;
  },
};

function transformState(state) {
  const transactions = state?.TransactionController?.transactions;
  const incomingTransactions =
    state?.IncomingTransactionsController?.incomingTransactions;
  if (Array.isArray(transactions)) {
    transactions.forEach((transaction) => {
      if (transaction) {
        if (
          transaction.type !== TransactionType.retry &&
          transaction.type !== TransactionType.cancel
        ) {
          transaction.type = transaction.transactionCategory;
        }
        delete transaction.transactionCategory;
      }
    });
  }
  if (incomingTransactions) {
    const incomingTransactionsEntries = Object.entries(incomingTransactions);
    incomingTransactionsEntries.forEach(([key, transaction]) => {
      if (transaction) {
        delete transaction.transactionCategory;
        state.IncomingTransactionsController.incomingTransactions[key] = {
          ...transaction,
          type: TransactionType.incoming,
        };
      }
    });
  }
  return state;
}
