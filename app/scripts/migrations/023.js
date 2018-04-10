
const version = 23

/*

This migration removes transactions that are no longer usefull down to 40 total

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

    if (transactions.length <= 40) return newState

    let reverseTxList = transactions.reverse()
    let stripping = true
    while (reverseTxList.length > 40 && stripping) {
      let txIndex = reverseTxList.findIndex((txMeta) => {
        return (txMeta.status === 'failed' ||
        txMeta.status === 'rejected' ||
        txMeta.status === 'confirmed' ||
        txMeta.status === 'dropped')
      })
      if (txIndex < 0) stripping = false
      else reverseTxList.splice(txIndex, 1)
    }

    newState.TransactionController.transactions = reverseTxList.reverse()
  }
  return newState
}
