import { cloneDeep } from 'lodash';
import {
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import type { LegacyMigration, MigrationState } from '../lib/migrator';

const version = 53;

type LegacyTransactionMeta = TransactionMeta & {
  transactionCategory?: TransactionMeta['type'];
};

type LegacyIncomingTransaction = Record<string, unknown> & {
  transactionCategory?: unknown;
  type?: TransactionMeta['type'];
};

type LegacyState = MigrationState['data'] &
  Partial<
    Record<
      'TransactionController',
      { transactions?: LegacyTransactionMeta[]; [key: string]: unknown }
    >
  > &
  Partial<
    Record<
      'IncomingTransactionsController',
      {
        incomingTransactions?: Record<string, LegacyIncomingTransaction>;
        [key: string]: unknown;
      }
    >
  >;

/**
 * Deprecate transactionCategory and consolidate on 'type'
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
  const incomingTransactions =
    state?.IncomingTransactionsController?.incomingTransactions;
  if (Array.isArray(transactions)) {
    transactions.forEach((transaction) => {
      if (transaction) {
        if (
          transaction.type !== TransactionType.retry &&
          transaction.type !== TransactionType.cancel
        ) {
          transaction.type = transaction.transactionCategory;
        }
        delete transaction.transactionCategory;
      }
    });
  }
  if (incomingTransactions) {
    const incomingTransactionsEntries = Object.entries(incomingTransactions);
    incomingTransactionsEntries.forEach(([key, transaction]) => {
      if (transaction) {
        delete transaction.transactionCategory;
        incomingTransactions[key] = {
          ...transaction,
          type: TransactionType.incoming,
        };
      }
    });
  }
  return state;
}
