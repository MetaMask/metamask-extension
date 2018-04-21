const version = 18

/*

This migration updates "transaction state history" to diffs style

*/

const clone = require('clone')
const txStateHistoryHelper = require('../lib/tx-state-history-helper')


module.exports = {
  version,

  migrate: function (originalVersionedData) {
    const versionedData = clone(originalVersionedData)
    versionedData.meta.version = version
    try {
      const state = versionedData.data
      const newState = transformState(state)
      versionedData.data = newState
    } catch (err) {
      console.warn(`MetaMask Migration #${version}` + err.stack)
    }
    return Promise.resolve(versionedData)
  },
}

function transformState (state) {
  const newState = state
  const { TransactionController } = newState
  if (TransactionController && TransactionController.transactions) {
    const transactions = newState.TransactionController.transactions
    newState.TransactionController.transactions = transactions.map((txMeta) => {
      // no history: initialize
      if (!txMeta.history || txMeta.history.length === 0) {
        const snapshot = txStateHistoryHelper.snapshotFromTxMeta(txMeta)
        txMeta.history = [snapshot]
        return txMeta
      }
      // has history: migrate
      const newHistory = (
        txStateHistoryHelper.migrateFromSnapshotsToDiffs(txMeta.history)
        // remove empty diffs
        .filter((entry) => {
          return !Array.isArray(entry) || entry.length > 0
        })
      )
      txMeta.history = newHistory
      return txMeta
    })
  }
  return newState
}
