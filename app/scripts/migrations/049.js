import { cloneDeep } from 'lodash'
import { generateMetaMaskTxId } from '../../../shared/helpers/transaction'

const version = 49

/**
 * Use a hash of txParams for metamask transaction id
 */
export default {
  version,
  async migrate (originalVersionedData) {
    console.log(originalVersionedData)
    const versionedData = cloneDeep(originalVersionedData)
    versionedData.meta.version = version
    const state = versionedData.data
    versionedData.data = transformState(state)
    return versionedData
  },
}

function transformState (state) {
  const transactions = state?.TransactionController?.transactions
  const incomingTransactionsState = state?.IncomingTransactionsController?.incomingTransactions
  if (Array.isArray(transactions)) {
    transactions.forEach((transaction) => {
      transaction.intentId = generateMetaMaskTxId(transaction.txParams, transaction.id)
    })
  }
  if (typeof incomingTransactionsState === 'object' && incomingTransactionsState !== null) {
    const incomingTransactions = Object.values(incomingTransactionsState)
    incomingTransactions.forEach((incomingTx) => {
      incomingTx.intentId = generateMetaMaskTxId(incomingTx.txParams)
    })
  }
  return state
}
