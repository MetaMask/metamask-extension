/*

This migration updates "transaction state history" to diffs style

*/

import jsonDiffer from 'fast-json-patch';
import { cloneDeep } from 'lodash';

const version = 18;

export default {
  version,

  migrate(originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    try {
      const state = versionedData.data;
      const newState = transformState(state);
      versionedData.data = newState;
    } catch (err) {
      console.warn(`MetaMask Migration #${version}${err.stack}`);
    }
    return Promise.resolve(versionedData);
  },
};

function transformState(state) {
  const newState = state;
  const { TransactionController } = newState;
  if (TransactionController && TransactionController.transactions) {
    const { transactions } = newState.TransactionController;
    newState.TransactionController.transactions = transactions.map((txMeta) => {
      // no history: initialize
      if (!txMeta.history || txMeta.history.length === 0) {
        const snapshot = snapshotFromTxMeta(txMeta);
        txMeta.history = [snapshot];
        return txMeta;
      }
      // has history: migrate
      const newHistory = migrateFromSnapshotsToDiffs(txMeta.history)
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
 * @param {object} txMeta - the tx metadata object
 * @returns {object} a deep clone without history
 */
function snapshotFromTxMeta(txMeta) {
  const shallow = { ...txMeta };
  delete shallow.history;
  return cloneDeep(shallow);
}

/**
 * converts non-initial history entries into diffs
 *
 * @param {Array} longHistory
 * @returns {Array}
 */
function migrateFromSnapshotsToDiffs(longHistory) {
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
 * @param {object} previousState - the previous state of the object
 * @param {object} newState - the update object
 * @param {string} [note] - a optional note for the state change
 * @returns {Array}
 */
function generateHistoryEntry(previousState, newState, note) {
  const entry = jsonDiffer.compare(previousState, newState);
  // Add a note to the first op, since it breaks if we append it to the entry
  if (entry[0]) {
    if (note) {
      entry[0].note = note;
    }
    entry[0].timestamp = Date.now();
  }
  return entry;
}
