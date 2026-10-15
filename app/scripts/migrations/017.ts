/*

This migration sets transactions who were retried and marked as failed to submitted

*/

import { TransactionStatus } from '@metamask/transaction-controller';
import { cloneDeep } from 'lodash';
import type { LegacyMigration, MigrationState } from '../lib/migrator';

const version = 17;

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
  retryCount: number;
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
      // @ts-expect-error Preserving the legacy boolean-to-status comparison.
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
