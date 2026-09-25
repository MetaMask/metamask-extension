import {
  cloneDeep,
  concat,
  groupBy,
  keyBy,
  pickBy,
  isPlainObject,
} from 'lodash';
import { TransactionType } from '@metamask/transaction-controller';
import type { LegacyMigration, MigrationState } from '../lib/migrator';
import type { LegacyState, LegacyTransaction } from './legacy-migration-utils';
const version = 59;

/**
 * Removes orphaned cancel and retry transactions that no longer have the
 * original transaction in state, which results in bugs.
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

function transformState(state: LegacyState) {
  const transactions = state?.TransactionController?.transactions;
  if (isPlainObject(transactions)) {
    const transactionList = Object.values(
      transactions as Record<string, LegacyTransaction>,
    );
    const nonceNetworkGroupedObject = groupBy(transactionList, (tx) => {
      return `${tx.txParams?.nonce}-${tx.chainId ?? tx.metamaskNetworkId}`;
    });

    const withoutOrphans = pickBy(nonceNetworkGroupedObject, (group) => {
      return group.some(
        (tx) =>
          tx.type !== TransactionType.cancel &&
          tx.type !== TransactionType.retry,
      );
    });
    if (!state.TransactionController) {
      return state;
    }
    state.TransactionController.transactions = keyBy(
      concat(...Object.values(withoutOrphans)),
      (tx) => String(tx.id),
    ) as Record<string, LegacyTransaction>;
  }

  return state;
}
