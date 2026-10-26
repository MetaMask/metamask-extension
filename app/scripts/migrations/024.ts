/*

This migration ensures that the from address in txParams is to lower case for
all unapproved transactions

*/

import { cloneDeep } from 'lodash';
import {
  TransactionStatus,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import type { LegacyMigration, MigrationState } from '../lib/migrator';

const version = 24;

export default {
  version,

  async migrate(originalVersionedData: MigrationState) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = versionedData.data as LegacyTransactionState;
    const newState = transformState(state);
    versionedData.data = newState;
    return versionedData;
  },
} satisfies LegacyMigration;

type LegacyTransactionMeta = Pick<TransactionMeta, 'status'> & {
  txParams?: Pick<TransactionMeta['txParams'], 'from'>;
};

type LegacyTransactionState = MigrationState['data'] &
  Partial<
    Record<'TransactionController', { transactions: LegacyTransactionMeta[] }>
  >;

function transformState(state: LegacyTransactionState) {
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
