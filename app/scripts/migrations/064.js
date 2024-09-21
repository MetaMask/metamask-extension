import { cloneDeep, isPlainObject } from 'lodash';
import { TransactionType } from '@metamask/transaction-controller';

const version = 64;

const SENT_ETHER = 'sentEther'; // the legacy transaction type being replaced in this migration with TransactionType.simpleSend

/**
 * Removes metaMetricsSendCount from MetaMetrics controller
 */
export default {
  version,
  async migrate(originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = versionedData.data;
    const newState = transformState(state);
    versionedData.data = newState;
    return versionedData;
  },
};

function transformState(state) {
  const transactions = state?.TransactionController?.transactions;
  if (isPlainObject(transactions)) {
    for (const tx of Object.values(transactions)) {
      if (tx.type === SENT_ETHER) {
        tx.type = TransactionType.simpleSend;
      }
      if (tx.history) {
        tx.history.map((txEvent) => {
          if (txEvent.type && txEvent.type === SENT_ETHER) {
            txEvent.type = TransactionType.simpleSend;
          }
          return txEvent;
        });
      }
    }
  }
  return state;
}
