/*

This migration ensures that the from address in txParams is to lower case for
all unapproved transactions

*/

import { cloneDeep } from 'lodash';
import { TransactionStatus } from '@metamask/transaction-controller';

const version = 24;

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
  const newState = state;
  if (!newState.TransactionController) {
    return newState;
  }
  const { transactions } = newState.TransactionController;
  newState.TransactionController.transactions = transactions.map(
    (txMeta, _) => {
      if (
        txMeta.status === TransactionStatus.unapproved &&
        txMeta.txParams &&
        txMeta.txParams.from
      ) {
        txMeta.txParams.from = txMeta.txParams.from.toLowerCase();
      }
      return txMeta;
    },
  );
  return newState;
}
