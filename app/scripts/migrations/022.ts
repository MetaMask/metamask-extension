/*

This migration adds submittedTime to the txMeta if it is not their

*/

import {
  TransactionStatus,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { cloneDeep } from 'lodash';
import type { LegacyMigration, MigrationState } from '../lib/migrator';

const version = 22;

export default {
  version,

  migrate(originalVersionedData: MigrationState) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    try {
      const state = versionedData.data as LegacyTransactionState;
      const newState = transformState(state);
      versionedData.data = newState;
    } catch (err) {
      console.warn(`MetaMask Migration #${version}${(err as Error).stack}`);
    }
    return Promise.resolve(versionedData);
  },
} satisfies LegacyMigration;

type LegacyTransactionMeta = Pick<TransactionMeta, 'status' | 'submittedTime'>;

type LegacyTransactionState = MigrationState['data'] &
  Partial<
    Record<'TransactionController', { transactions?: LegacyTransactionMeta[] }>
  >;

function transformState(state: LegacyTransactionState) {
  const newState = state;
  const { TransactionController } = newState;
  if (TransactionController && TransactionController.transactions) {
    const { transactions } = TransactionController;

    TransactionController.transactions = transactions.map((txMeta) => {
      if (
        txMeta.status !== TransactionStatus.submitted ||
        txMeta.submittedTime
      ) {
        return txMeta;
      }
      txMeta.submittedTime = new Date().getTime();
      return txMeta;
    });
  }
  return newState;
}
