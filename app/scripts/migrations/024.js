
const version = 24

/*

This migration ensures that the from address in txParams is to lower case for
all unapproved transactions

*/

const clone = require('clone')

module.exports = {
  version,

  migrate: async function (originalVersionedData) {
    const versionedData = clone(originalVersionedData)
    versionedData.meta.version = version
    const state = versionedData.data
    const newState = transformState(state)
    versionedData.data = newState
    return versionedData
  },
}

function transformState (state) {
  const newState = state
  if (!newState.TransactionController) return newState
  const transactions = newState.TransactionController.transactions
  newState.TransactionController.transactions = transactions.map((txMeta, _) => {
    if (
      txMeta.status === 'unapproved' &&
      txMeta.txParams &&
      txMeta.txParams.from
    ) {
      txMeta.txParams.from = txMeta.txParams.from.toLowerCase()
    }
    return txMeta
  })
  return newState
}
