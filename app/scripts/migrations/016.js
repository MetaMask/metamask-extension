const version = 16

/*

This migration sets transactions with the 'Gave up submitting tx.' err message
to a 'failed' stated

*/

const clone = require('clone')

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
      if (!txMeta.err) return txMeta
      if (txMeta.err === 'transaction with the same hash was already imported.') {
        txMeta.status = 'submitted'
        delete txMeta.err
      }
      return txMeta
    })
  }
  return newState
}
