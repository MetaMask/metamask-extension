const txStateHistoryHelper = require('tx-state-manager/lib/tx-state-history-helper')

module.exports = createTxMeta

function createTxMeta (partialMeta) {
  const txMeta = Object.assign({
    status: 'unapproved',
    txParams: {},
  }, partialMeta)
  // initialize history
  txMeta.history = []
  // capture initial snapshot of txMeta for history
  const snapshot = txStateHistoryHelper.snapshotFromTxMeta(txMeta)
  txMeta.history.push(snapshot)
  return txMeta
}
