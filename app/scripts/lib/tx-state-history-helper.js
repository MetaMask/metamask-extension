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
      return generateHistoryEntry(longHistory[index-1], entry)
    })
  )
}

function generateHistoryEntry(previousState, newState) {
  return jsonDiffer.compare(previousState, newState)
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