/*

This migration sets transactions who were retried and marked as failed to submitted

*/

import { TransactionStatus } from '@metamask/transaction-controller';
import { cloneDeep } from 'lodash';

const version = 17;

export default {
  version,

  migrate(originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    try {
      const state = versionedData.data;
      const newState = transformState(state);
      versionedData.data = newState;
    } catch (err) {
      console.warn(`MetaMask Migration #${version}${err.stack}`);
    }
    return Promise.resolve(versionedData);
  },
};

function transformState(state) {
  const newState = state;
  const { TransactionController } = newState;
  if (TransactionController && TransactionController.transactions) {
    const { transactions } = newState.TransactionController;
    newState.TransactionController.transactions = transactions.map((txMeta) => {
      if (!txMeta.status === TransactionStatus.failed) {
        return txMeta;
      }
      if (txMeta.retryCount > 0 && txMeta.retryCount < 2) {
        txMeta.status = TransactionStatus.submitted;
        delete txMeta.err;
      }
      return txMeta;
    });
  }
  return newState;
}
