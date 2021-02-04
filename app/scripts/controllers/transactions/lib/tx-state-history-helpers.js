import jsonDiffer from 'fast-json-patch';
import { cloneDeep } from 'lodash';

/**
  converts non-initial history entries into diffs
  @param {Array} longHistory
  @returns {Array}
*/
export function migrateFromSnapshotsToDiffs(longHistory) {
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
  Generates an array of history objects sense the previous state.
  The object has the keys
    op (the operation performed),
    path (the key and if a nested object then each key will be separated with a `/`)
    value
  with the first entry having the note and a timestamp when the change took place
  @param {Object} previousState - the previous state of the object
  @param {Object} newState - the update object
  @param {string} [note] - a optional note for the state change
  @returns {Array}
*/
export function generateHistoryEntry(previousState, newState, note) {
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

/**
  Recovers previous txMeta state obj
  @returns {Object}
*/
export function replayHistory(_shortHistory) {
  const shortHistory = cloneDeep(_shortHistory);
  return shortHistory.reduce(
    (val, entry) => jsonDiffer.applyPatch(val, entry).newDocument,
  );
}

/**
 * Snapshot {@code txMeta}
 * @param {Object} txMeta - the tx metadata object
 * @returns {Object} a deep clone without history
 */
export function snapshotFromTxMeta(txMeta) {
  const shallow = { ...txMeta };
  delete shallow.history;
  return cloneDeep(shallow);
}
