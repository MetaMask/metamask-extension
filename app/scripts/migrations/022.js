
const version = 22

/*

This migration adds submittedTime to the txMeta if it is not their

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
      if (txMeta.status !== 'submitted' || txMeta.submittedTime) return txMeta
      txMeta.submittedTime = (new Date()).getTime()
      return txMeta
    })
  }
  return newState
}
