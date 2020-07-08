const version = 47
import { cloneDeep } from 'lodash'

/**
 * Stringify numbers:
 *  - PreferencesController.frequentRpcListDetail item chainId
 *  - TransactionsController.transactions item metamaskNetworkId
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
  const transactions = state?.TransactionsController?.transactions
  if (Array.isArray(transactions)) {
    transactions.forEach((transaction) => {
      if (typeof transaction.metamaskNetworkId === 'number') {
        transaction.metamaskNetworkId = transaction.metamaskNetworkId.toString()
      }
    })
  }
  return state
}
