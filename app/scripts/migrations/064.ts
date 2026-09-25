/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any -- Legacy migration state remains loosely typed during JS-to-TS conversion. */
import { cloneDeep, isPlainObject } from 'lodash';
import { TransactionType } from '@metamask/transaction-controller';

type LegacyState = Record<string, any>;
type VersionedData = { meta: { version?: number }; data?: LegacyState };

const version = 64;

const SENT_ETHER = 'sentEther'; // the legacy transaction type being replaced in this migration with TransactionType.simpleSend

/**
 * Removes metaMetricsSendCount from MetaMetrics controller
 */
const migration = {
  version,
  async migrate(originalVersionedData: VersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = (versionedData.data ?? {}) as LegacyState;
    const newState = transformState(state);
    versionedData.data = newState;
    return versionedData;
  },
};

export default migration;

function transformState(state: LegacyState) {
  const transactions = state?.TransactionController?.transactions;
  if (isPlainObject(transactions)) {
    for (const tx of Object.values(transactions)) {
      if (tx.type === SENT_ETHER) {
        tx.type = TransactionType.simpleSend;
      }
      if (tx.history) {
        tx.history.map((txEvent) => {
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
