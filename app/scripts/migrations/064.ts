import { cloneDeep, isPlainObject } from 'lodash';
import { TransactionType } from '@metamask/transaction-controller';
import type { LegacyMigration, MigrationState } from '../lib/migrator';
import type { LegacyState, LegacyTransaction } from './legacy-migration-utils';
const version = 64;

const SENT_ETHER = 'sentEther'; // the legacy transaction type being replaced in this migration with TransactionType.simpleSend

/**
 * Removes metaMetricsSendCount from MetaMetrics controller
 */
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

function transformState(state: LegacyState) {
  const transactions = state?.TransactionController?.transactions;
  if (isPlainObject(transactions)) {
    for (const tx of Object.values(
      transactions as Record<string, LegacyTransaction>,
    )) {
      if (tx.type === SENT_ETHER) {
        tx.type = TransactionType.simpleSend;
      }
      if (tx.history) {
        (tx.history as Record<string, unknown>[]).map((txEvent) => {
          if (txEvent.type && txEvent.type === SENT_ETHER) {
            txEvent.type = TransactionType.simpleSend;
          }
          return txEvent;
        });
      }
    }
  }
  return state;
}
