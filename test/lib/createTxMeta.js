import { snapshotFromTxMeta } from '../../app/scripts/controllers/transactions/lib/tx-state-history-helpers'

export default function createTxMeta(partialMeta) {
  const txMeta = {
    status: 'unapproved',
    txParams: {},
    ...partialMeta,
  }
  // initialize history
  txMeta.history = []
  // capture initial snapshot of txMeta for history
  const snapshot = snapshotFromTxMeta(txMeta)
  txMeta.history.push(snapshot)
  return txMeta
}
