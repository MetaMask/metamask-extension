const version = 47
import { cloneDeep } from 'lodash'

/**
 * Stringify the `metamaskNetworkId` property of all transactions
 */
export default {
  version,
  migrate: async function (originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData)
    versionedData.meta.version = version
    const state = versionedData.data
    versionedData.data = transformState(state)
    return versionedData
  },
}

function transformState (state) {
  const transactions = state?.TransactionController?.transactions
  if (Array.isArray(transactions)) {
    transactions.forEach((transaction) => {
      if (typeof transaction.metamaskNetworkId === 'number') {
        transaction.metamaskNetworkId = transaction.metamaskNetworkId.toString()
      }
    })
  }
  return state
}
