import { cloneDeep } from 'lodash';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { LegacyMigration, MigrationState } from '../lib/migrator';

const version = 47;

type LegacyTransactionMeta = TransactionMeta & {
  metamaskNetworkId?: number | string;
};

type LegacyState = MigrationState['data'] &
  Partial<
    Record<
      'TransactionController',
      { transactions?: LegacyTransactionMeta[]; [key: string]: unknown }
    >
  >;

/**
 * Stringify the `metamaskNetworkId` property of all transactions
 */
export default {
  version,
  async migrate(originalVersionedData: MigrationState) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = versionedData.data as LegacyState;
    versionedData.data = transformState(state);
    return versionedData;
  },
} satisfies LegacyMigration;

function transformState(state: LegacyState): LegacyState {
  const transactions = state?.TransactionController?.transactions;
  if (Array.isArray(transactions)) {
    transactions.forEach((transaction) => {
      if (typeof transaction.metamaskNetworkId === 'number') {
        transaction.metamaskNetworkId =
          transaction.metamaskNetworkId.toString();
      }
    });
  }
  return state;
}
