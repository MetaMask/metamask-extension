import { cloneDeep } from 'lodash'

export default function failTxsThat(version, reason, condition) {
  return function (originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData)
    versionedData.meta.version = version
    try {
      const state = versionedData.data
      const newState = transformState(state, condition, reason)
      versionedData.data = newState
    } catch (err) {
      console.warn(`MetaMask Migration #${version}${err.stack}`)
    }
    return Promise.resolve(versionedData)
  }
}

function transformState(state, condition, reason) {
  const newState = state
  const { TransactionController } = newState
  if (TransactionController && TransactionController.transactions) {
    const { transactions } = TransactionController

    newState.TransactionController.transactions = transactions.map((txMeta) => {
      if (!condition(txMeta)) {
        return txMeta
      }

      txMeta.status = 'failed'
      txMeta.err = {
        message: reason,
        note: `Tx automatically failed by migration because ${reason}`,
      }

      return txMeta
    })
  }
  return newState
}
