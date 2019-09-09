// next version number
const version = 37
const { getFinalStates, containsFinalStates } = require('../controllers/transactions/lib/util')
const { DEFAULT_TX_HISTORY_LIMIT } = require('../controllers/transactions/enums')

/*


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
  // transform state here
  if (newState.TransactionController) {
    if (newState.TransactionController.transactions) {
      const transactions = newState.TransactionController.transactions
      let txCount = transactions.length
      if (txCount > DEFAULT_TX_HISTORY_LIMIT) {
        do {
          const index = transactions.findIndex((txMeta) => {
            return getFinalStates().includes(txMeta.status)
          })
          if (index !== -1) {
            transactions.splice(index, 1)
          }
          txCount = transactions.length
        } while (txCount > 40 && containsFinalStates(transactions))
      }
    }
  }
  return newState
}
