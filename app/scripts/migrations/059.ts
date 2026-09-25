/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any -- Legacy migration state remains loosely typed during JS-to-TS conversion. */
import {
  cloneDeep,
  concat,
  groupBy,
  keyBy,
  pickBy,
  isPlainObject,
} from 'lodash';
import { TransactionType } from '@metamask/transaction-controller';

type LegacyState = Record<string, any>;
type VersionedData = { meta: { version?: number }; data?: LegacyState };

const version = 59;

/**
 * Removes orphaned cancel and retry transactions that no longer have the
 * original transaction in state, which results in bugs.
 */
const migration = {
  version,
  async migrate(originalVersionedData: VersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = (versionedData.data ?? {}) as LegacyState;
    versionedData.data = transformState(state);
    return versionedData;
  },
};

export default migration;

function transformState(state: LegacyState) {
  const transactions = state?.TransactionController?.transactions;
  if (isPlainObject(transactions)) {
    const nonceNetworkGroupedObject = groupBy(
      Object.values(transactions),
      (tx) => {
        return `${tx.txParams?.nonce}-${tx.chainId ?? tx.metamaskNetworkId}`;
      },
    );

    const withoutOrphans = pickBy(nonceNetworkGroupedObject, (group) => {
      return group.some(
        (tx) =>
          tx.type !== TransactionType.cancel &&
          tx.type !== TransactionType.retry,
      );
    });
    state.TransactionController.transactions = keyBy(
      concat(...Object.values(withoutOrphans)),
      (tx) => tx.id,
    );
  }

  return state;
}
