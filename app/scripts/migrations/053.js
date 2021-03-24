import { cloneDeep } from 'lodash';
import { TRANSACTION_TYPES } from '../../../shared/constants/transaction';

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
      if (
        transaction.type !== TRANSACTION_TYPES.RETRY &&
        transaction.type !== TRANSACTION_TYPES.CANCEL
      ) {
        transaction.type = transaction.transactionCategory;
      }
      delete transaction.transactionCategory;
    });
  }
  if (incomingTransactions) {
    const incomingTransactionsEntries = Object.entries(incomingTransactions);
    incomingTransactionsEntries.forEach(([key, transaction]) => {
      delete transaction.transactionCategory;
      state.IncomingTransactionsController.incomingTransactions[key] = {
        ...transaction,
        type: TRANSACTION_TYPES.INCOMING,
      };
    });
  }
  return state;
}
