import { cloneDeep, keyBy } from 'lodash';
import createId from '../../../shared/modules/random-id';

const version = 57;

/**
 * replace 'incomingTxLastFetchedBlocksByNetwork' with 'incomingTxLastFetchedBlockByChainId'
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
  if (
    state?.TransactionController?.transactions &&
    Array.isArray(state.TransactionController.transactions) &&
    !state.TransactionController.transactions.some(
      (item) =>
        typeof item !== 'object' || typeof item.txParams === 'undefined',
    )
  ) {
    state.TransactionController.transactions = keyBy(
      state.TransactionController.transactions,
      // In case for some reason any of a user's transactions do not have an id
      // generate a new one for the transaction.
      (tx) => {
        if (typeof tx.id === 'undefined' || tx.id === null) {
          // This mutates the item in the array, so will result in a change to
          // the state.
          tx.id = createId();
        }
        return tx.id;
      },
    );
  }
  return state;
}
