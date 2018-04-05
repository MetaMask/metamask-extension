
const version = 24

/*

This migration ensures that the from address in txParams is to lower case for
all unapproved transactions

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
  if (!newState.TransactionController) return newState
  const transactions = newState.TransactionController.transactions
  newState.TransactionController.transactions = transactions.map((txMeta, _, txList) => {
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
