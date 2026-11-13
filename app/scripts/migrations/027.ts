// next version number
/*

normalizes txParams on unconfirmed txs

*/
import { cloneDeep } from 'lodash';
import {
  TransactionStatus,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import type { LegacyMigration, MigrationState } from '../lib/migrator';

const version = 27;

type LegacyTransactionMeta = Pick<TransactionMeta, 'status'>;

type LegacyState = MigrationState['data'] &
  Partial<
    Record<'TransactionController', { transactions?: LegacyTransactionMeta[] }>
  >;

export default {
  version,

  async migrate(originalVersionedData: MigrationState) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = versionedData.data as LegacyState;
    const newState = transformState(state);
    versionedData.data = newState;
    return versionedData;
  },
} satisfies LegacyMigration;

function transformState(state: LegacyState): LegacyState {
  const newState = state;

  if (newState.TransactionController) {
    if (newState.TransactionController.transactions) {
      const { transactions } = newState.TransactionController;
      newState.TransactionController.transactions = transactions.filter(
        (txMeta) => txMeta.status !== TransactionStatus.rejected,
      );
    }
  }

  return newState;
}
