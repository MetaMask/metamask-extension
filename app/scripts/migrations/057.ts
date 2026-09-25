/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any -- Legacy migration state remains loosely typed during JS-to-TS conversion. */
import { cloneDeep, keyBy } from 'lodash';
import createId from '../../../shared/lib/random-id';

type LegacyState = Record<string, any>;
type VersionedData = { meta: { version?: number }; data?: LegacyState };

const version = 57;

/**
 * replace 'incomingTxLastFetchedBlocksByNetwork' with 'incomingTxLastFetchedBlockByChainId'
 */
const migration = {
  version,
  async migrate(originalVersionedData: VersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = (versionedData.data ?? {}) as LegacyState;
    versionedData.data = transformState(state);
    return versionedData;
  },
};

export default migration;

function transformState(state: LegacyState) {
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
