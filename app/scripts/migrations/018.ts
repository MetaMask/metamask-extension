/*

This migration updates "transaction state history" to diffs style

*/

import jsonDiffer from 'fast-json-patch';
import type { Operation } from 'fast-json-patch';
import { cloneDeep } from 'lodash';
import type { LegacyMigration, MigrationState } from '../lib/migrator';

const version = 18;

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

type LegacyOperation = Operation & {
  note?: string;
  timestamp?: number;
};

type LegacySnapshot = object;
type LegacyHistoryEntry = LegacySnapshot | LegacyOperation[];
type LegacyTransaction = {
  history?: LegacyHistoryEntry[];
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
      // no history: initialize
      if (!txMeta.history || txMeta.history.length === 0) {
        const snapshot = snapshotFromTxMeta(txMeta);
        txMeta.history = [snapshot];
        return txMeta;
      }
      // has history: migrate
      const newHistory = migrateFromSnapshotsToDiffs(
        txMeta.history as LegacySnapshot[],
      )
        // remove empty diffs
        .filter((entry) => {
          return !Array.isArray(entry) || entry.length > 0;
        });
      txMeta.history = newHistory;
      return txMeta;
    });
  }
  return newState;
}

/**
 * Snapshot {@code txMeta}
 *
 * @param txMeta - the tx metadata object
 * @returns a deep clone without history
 */
function snapshotFromTxMeta(txMeta: LegacyTransaction): LegacySnapshot {
  const shallow = { ...txMeta };
  delete shallow.history;
  return cloneDeep(shallow);
}

/**
 * converts non-initial history entries into diffs
 *
 * @param longHistory
 * @returns
 */
function migrateFromSnapshotsToDiffs(
  longHistory: LegacySnapshot[],
): LegacyHistoryEntry[] {
  return (
    longHistory
      // convert non-initial history entries into diffs
      .map((entry, index) => {
        if (index === 0) {
          return entry;
        }
        return generateHistoryEntry(longHistory[index - 1], entry);
      })
  );
}

/**
 * Generates an array of history objects sense the previous state.
 * The object has the keys
 * op (the operation performed),
 * path (the key and if a nested object then each key will be separated with a `/`)
 * value
 * with the first entry having the note and a timestamp when the change took place
 *
 * @param previousState - the previous state of the object
 * @param newState - the update object
 * @param [note] - a optional note for the state change
 * @returns
 */
function generateHistoryEntry(
  previousState: LegacySnapshot,
  newState: LegacySnapshot,
  note?: string,
): LegacyOperation[] {
  const entry = jsonDiffer.compare(
    previousState,
    newState,
  ) as LegacyOperation[];
  // Add a note to the first op, since it breaks if we append it to the entry
  if (entry[0]) {
    if (note) {
      entry[0].note = note;
    }
    entry[0].timestamp = Date.now();
  }
  return entry;
}
