/*

This migration sets transactions with the 'Gave up submitting tx.' err message
to a 'failed' stated

*/

import { TransactionStatus } from '@metamask/transaction-controller';
import { cloneDeep } from 'lodash';

const version = 15;

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
    const { transactions } = TransactionController;
    newState.TransactionController.transactions = transactions.map((txMeta) => {
      if (!txMeta.err) {
        return txMeta;
      } else if (txMeta.err.message === 'Gave up submitting tx.') {
        txMeta.status = TransactionStatus.failed;
      }
      return txMeta;
    });
  }
  return newState;
}
