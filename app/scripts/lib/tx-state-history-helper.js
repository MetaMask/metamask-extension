const jsonDiffer = require('fast-json-patch')
const clone = require('clone')

module.exports = {
  generateHistoryEntry,
  replayHistory,
  snapshotFromTxMeta,
  migrateFromSnapshotsToDiffs,
}


function migrateFromSnapshotsToDiffs(longHistory) {
  return (
    longHistory
    // convert non-initial history entries into diffs
    .map((entry, index) => {
      if (index === 0) return entry
      return generateHistoryEntry(longHistory[index - 1], entry)
    })
  )
}

function generateHistoryEntry(previousState, newState, note) {
  const entry = jsonDiffer.compare(previousState, newState)
  // Add a note to the first op, since it breaks if we append it to the entry
  if (note && entry[0]) entry[0].note = note
  return entry
}

function replayHistory(shortHistory) {
  return shortHistory.reduce((val, entry) => jsonDiffer.applyPatch(val, entry).newDocument)
}

function snapshotFromTxMeta(txMeta) {
  // create txMeta snapshot for history
  const snapshot = clone(txMeta)
  // dont include previous history in this snapshot
  delete snapshot.history
  return snapshot
}