import { cloneDeep } from 'lodash'
import { TRANSACTION_TYPE_CANCEL, TRANSACTION_TYPE_INCOMING, TRANSACTION_TYPE_RETRY } from '../../../shared/constants/transaction'

const version = 49

/**
 * Deprecate transactionCategory and consolidate on 'type'
 */
export default {
  version,
  async migrate (originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData)
    versionedData.meta.version = version
    const state = versionedData.data
    versionedData.data = transformState(state)
    return versionedData
  },
}

function transformState (state) {
  const transactions = state?.TransactionController?.transactions
  const incomingTransactions = state?.IncomingTransactionsController?.incomingTransactions
  if (Array.isArray(transactions)) {
    transactions.forEach((transaction) => {
      if (transaction.type !== TRANSACTION_TYPE_RETRY && transaction.type !== TRANSACTION_TYPE_CANCEL) {
        transaction.type = transaction.transactionCategory
      }
      delete transaction.transactionCategory
    })
  }
  if (incomingTransactions) {
    const incomingTransactionsEntries = Object.entries(incomingTransactions)
    incomingTransactionsEntries.forEach(([key, transaction]) => {
      delete transaction.transactionCategory
      state.IncomingTransactionsController.incomingTransactions[key] = {
        ...transaction,
        type: TRANSACTION_TYPE_INCOMING,
      }
    })
  }
  return state
}
