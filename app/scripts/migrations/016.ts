/*

This migration sets transactions with the 'Gave up submitting tx.' err message
to a 'failed' stated

*/

import { TransactionStatus } from '@metamask/transaction-controller';
import { cloneDeep } from 'lodash';
import type { LegacyMigration, MigrationState } from '../lib/migrator';

const version = 16;

export default {
  version,

  migrate(originalVersionedData: MigrationState) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    try {
      const state = versionedData.data as LegacyState;
      const newState = transformState(state);
      versionedData.data = newState;
    } catch (err) {
      console.warn(`MetaMask Migration #${version}${(err as Error).stack}`);
    }
    return Promise.resolve(versionedData);
  },
} satisfies LegacyMigration;

type LegacyTransaction = {
  err?: string;
  status?: TransactionStatus;
};

type LegacyState = MigrationState['data'] &
  Partial<
    Record<
      'TransactionController',
      {
        transactions?: LegacyTransaction[];
      }
    >
  >;

function transformState(state: LegacyState): LegacyState {
  const newState = state;
  const { TransactionController } = newState;
  if (TransactionController && TransactionController.transactions) {
    const { transactions } = TransactionController;

    TransactionController.transactions = transactions.map((txMeta) => {
      if (!txMeta.err) {
        return txMeta;
      }
      if (
        txMeta.err === 'transaction with the same hash was already imported.'
      ) {
        txMeta.status = TransactionStatus.submitted;
        delete txMeta.err;
      }
      return txMeta;
    });
  }
  return newState;
}
