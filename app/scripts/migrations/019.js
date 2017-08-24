
const version = 19

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
  const transactions = newState.TransactionController.transactions
  newState.TransactionController.transactions = transactions.map((txMeta, _, txList) => {
    if (txMeta.status !== 'submitted') return txMeta

    const confirmedTxs = txList.filter((tx) => tx.status === 'confirmed')
    .filter((tx) => tx.txParams.from === txMeta.txParams.from)
    .filter((tx) => tx.metamaskNetworkId.from === txMeta.metamaskNetworkId.from)
    const highestConfirmedNonce = getHighestNonce(confirmedTxs)

    if (parseInt(txMeta.txParams.nonce, 16) > highestConfirmedNonce + 1) {
      txMeta.status = 'failed'
      txMeta.err = {
        message: 'nonce too high',
        note: 'migration 019 custom error',
      }
    }
    return txMeta
  })
  return newState
}

function getHighestNonce (txList) {
  const nonces = txList.map((txMeta) => {
  const nonce = txMeta.txParams.nonce
    return parseInt(nonce || '0x0', 16)
  })
  const highestNonce = Math.max.apply(null, nonces)
  return highestNonce
}
