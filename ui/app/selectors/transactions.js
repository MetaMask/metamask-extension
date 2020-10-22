import { createSelector } from 'reselect'
import {
  SUBMITTED_STATUS,
  CONFIRMED_STATUS,
  FAILED_STATUS,
  PRIORITY_STATUS_HASH,
  PENDING_STATUS_HASH,
} from '../helpers/constants/transactions'
import {
  TRANSACTION_TYPE_CANCEL,
  TRANSACTION_TYPE_RETRY,
} from '../../../app/scripts/controllers/transactions/enums'
import { hexToDecimal } from '../helpers/utils/conversions.util'
import txHelper from '../../lib/tx-helper'
import {
  getSelectedAddress,
} from '.'

export const incomingTxListSelector = (state) => {
  const { showIncomingTransactions } = state.metamask.featureFlags
  if (!showIncomingTransactions) {
    return []
  }

  const { network } = state.metamask
  const selectedAddress = getSelectedAddress(state)
  return Object.values(state.metamask.incomingTransactions)
    .filter(({ metamaskNetworkId, txParams }) => (
      txParams.to === selectedAddress && metamaskNetworkId === network
    ))
}
export const unapprovedMsgsSelector = (state) => state.metamask.unapprovedMsgs
export const currentNetworkTxListSelector = (state) => state.metamask.currentNetworkTxList
export const unapprovedPersonalMsgsSelector = (state) => state.metamask.unapprovedPersonalMsgs
export const unapprovedDecryptMsgsSelector = (state) => state.metamask.unapprovedDecryptMsgs
export const unapprovedEncryptionPublicKeyMsgsSelector = (state) => state.metamask.unapprovedEncryptionPublicKeyMsgs
export const unapprovedTypedMessagesSelector = (state) => state.metamask.unapprovedTypedMessages
export const networkSelector = (state) => state.metamask.network

export const selectedAddressTxListSelector = createSelector(
  getSelectedAddress,
  currentNetworkTxListSelector,
  (selectedAddress, transactions = []) => {
    return transactions.filter(({ txParams }) => txParams.from === selectedAddress)
  },
)

export const unapprovedMessagesSelector = createSelector(
  unapprovedMsgsSelector,
  unapprovedPersonalMsgsSelector,
  unapprovedDecryptMsgsSelector,
  unapprovedEncryptionPublicKeyMsgsSelector,
  unapprovedTypedMessagesSelector,
  networkSelector,
  (
    unapprovedMsgs = {},
    unapprovedPersonalMsgs = {},
    unapprovedDecryptMsgs = {},
    unapprovedEncryptionPublicKeyMsgs = {},
    unapprovedTypedMessages = {},
    network,
  ) => txHelper(
    {},
    unapprovedMsgs,
    unapprovedPersonalMsgs,
    unapprovedDecryptMsgs,
    unapprovedEncryptionPublicKeyMsgs,
    unapprovedTypedMessages,
    network,
  ) || [],
)

export const transactionSubSelector = createSelector(
  unapprovedMessagesSelector,
  incomingTxListSelector,
  (unapprovedMessages = [], incomingTxList = []) => {
    return unapprovedMessages.concat(incomingTxList)
  },
)

export const transactionsSelector = createSelector(
  transactionSubSelector,
  selectedAddressTxListSelector,
  (subSelectorTxList = [], selectedAddressTxList = []) => {
    const txsToRender = selectedAddressTxList.concat(subSelectorTxList)

    return txsToRender
      .sort((a, b) => b.time - a.time)
  },
)

/**
 * @name insertOrderedNonce
 * @private
 * @description Inserts (mutates) a nonce into an array of ordered nonces, sorted in ascending
 * order.
 * @param {string[]} nonces - Array of nonce strings in hex
 * @param {string} nonceToInsert - Nonce string in hex to be inserted into the array of nonces.
 * @returns {string[]}
 */
const insertOrderedNonce = (nonces, nonceToInsert) => {
  let insertIndex = nonces.length

  for (let i = 0; i < nonces.length; i++) {
    const nonce = nonces[i]

    if (Number(hexToDecimal(nonce)) > Number(hexToDecimal(nonceToInsert))) {
      insertIndex = i
      break
    }
  }

  nonces.splice(insertIndex, 0, nonceToInsert)
}

/**
 * @name insertTransactionByTime
 * @private
 * @description Inserts (mutates) a transaction object into an array of ordered transactions, sorted
 * in ascending order by time.
 * @param {Object[]} transactions - Array of transaction objects.
 * @param {Object} transaction - Transaction object to be inserted into the array of transactions.
 * @returns {Object[]}
 */
const insertTransactionByTime = (transactions, transaction) => {
  const { time } = transaction

  let insertIndex = transactions.length

  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i]

    if (tx.time > time) {
      insertIndex = i
      break
    }
  }

  transactions.splice(insertIndex, 0, transaction)
}

/**
 * Contains transactions and properties associated with those transactions of the same nonce.
 * @typedef {Object} transactionGroup
 * @property {string} nonce - The nonce that the transactions within this transactionGroup share.
 * @property {Object[]} transactions - An array of transaction (txMeta) objects.
 * @property {Object} initialTransaction - The transaction (txMeta) with the lowest "time".
 * @property {Object} primaryTransaction - Either the latest transaction or the confirmed
 * transaction.
 * @property {boolean} hasRetried - True if a transaction in the group was a retry transaction.
 * @property {boolean} hasCancelled - True if a transaction in the group was a cancel transaction.
 */

/**
 * @name insertTransactionGroupByTime
 * @private
 * @description Inserts (mutates) a transactionGroup object into an array of ordered
 * transactionGroups, sorted in ascending order by nonce.
 * @param {transactionGroup[]} transactionGroups - Array of transactionGroup objects.
 * @param {transactionGroup} transactionGroup - transactionGroup object to be inserted into the
 * array of transactionGroups.
 */
const insertTransactionGroupByTime = (transactionGroups, transactionGroup) => {
  const { primaryTransaction: { time: groupToInsertTime } = {} } = transactionGroup

  let insertIndex = transactionGroups.length

  for (let i = 0; i < transactionGroups.length; i++) {
    const txGroup = transactionGroups[i]
    const { primaryTransaction: { time } = {} } = txGroup

    if (time > groupToInsertTime) {
      insertIndex = i
      break
    }
  }

  transactionGroups.splice(insertIndex, 0, transactionGroup)
}

/**
 * @name mergeNonNonceTransactionGroups
 * @private
 * @description Inserts (mutates) transactionGroups that are not to be ordered by nonce into an array
 * of nonce-ordered transactionGroups by time.
 * @param {transactionGroup[]} orderedTransactionGroups - Array of transactionGroups ordered by
 * nonce.
 * @param {transactionGroup[]} nonNonceTransactionGroups - Array of transactionGroups not intended to be ordered by nonce,
 * but intended to be ordered by timestamp
 */
const mergeNonNonceTransactionGroups = (orderedTransactionGroups, nonNonceTransactionGroups) => {
  nonNonceTransactionGroups.forEach((transactionGroup) => {
    insertTransactionGroupByTime(orderedTransactionGroups, transactionGroup)
  })
}

/**
 * @name nonceSortedTransactionsSelector
 * @description Returns an array of transactionGroups sorted by nonce in ascending order.
 * @returns {transactionGroup[]}
 */
export const nonceSortedTransactionsSelector = createSelector(
  transactionsSelector,
  (transactions = []) => {
    const unapprovedTransactionGroups = []
    const incomingTransactionGroups = []
    const orderedNonces = []
    const nonceToTransactionsMap = {}

    console.log("------------------------")
    console.log('nonceSortedTransactionsSelector start; transactions', transactions);

    transactions.forEach((transaction) => {
      const { txParams: { nonce } = {}, status, type, time: txTime, transactionCategory } = transaction

      if (typeof nonce === 'undefined' || transactionCategory === 'incoming') {
        const transactionGroup = {
          transactions: [transaction],
          initialTransaction: transaction,
          primaryTransaction: transaction,
          hasRetried: false,
          hasCancelled: false,
        }

        if (transactionCategory === 'incoming') {
          incomingTransactionGroups.push(transactionGroup)
        } else {
          insertTransactionGroupByTime(unapprovedTransactionGroups, transactionGroup)
        }
      } else if (nonce in nonceToTransactionsMap) {
        const nonceProps = nonceToTransactionsMap[nonce]
        insertTransactionByTime(nonceProps.transactions, transaction)

        if (status in PRIORITY_STATUS_HASH) {
          // Accommodates for no primary transaction due to failure
          const primaryTxTime = nonceProps?.primaryTransaction?.time ?? 0;

          if (status === CONFIRMED_STATUS || txTime > primaryTxTime) {
            nonceProps.primaryTransaction = transaction
          }
        }

        const { initialTransaction: { time: initialTxTime = 0 } = {} } = nonceProps

        // Used to display the transaction action, since we don't want to overwrite the action if
        // it was replaced with a cancel attempt transaction.
        if (txTime < initialTxTime) {
          nonceProps.initialTransaction = transaction
        }

        if (type === TRANSACTION_TYPE_RETRY) {
          nonceProps.hasRetried = true
        }

        if (type === TRANSACTION_TYPE_CANCEL) {
          nonceProps.hasCancelled = true
        }
      } else {
        /*
          Error:
          {
            message: "Error: [ethjs-rpc] rpc error with payload {\"id\":428016472614,\"jsonrpc\":\"2.0\",\"params\":[\"0xf8650a843b9aca00843b9aca00940bd88c9c99be119dbbcd493699bfbffab0904d6980802ca0f511cd1297503b5a670e9459a174eceb4a2b7786df212821873eb2302727a49ba05ac22d6732af3e21539a2cbb738f53ccac2477de1e5a2d2a389f46b88693432f\"],\"method\":\"eth_sendRawTransaction\"} [object Object]",
​​​            rpc: {
              code: -32000
              message: "exceeds block gas limit"
            }
          }
        */
        let primaryTransaction = transaction
        if(transaction.status === FAILED_STATUS && Boolean(transaction?.err?.message)) {
          primaryTransaction = null;
        }

        nonceToTransactionsMap[nonce] = {
          nonce,
          transactions: [transaction],
          initialTransaction: transaction,
          primaryTransaction,
          hasRetried: transaction.type === TRANSACTION_TYPE_RETRY,
          hasCancelled: transaction.type === TRANSACTION_TYPE_CANCEL,
        }

        insertOrderedNonce(orderedNonces, nonce)
      }
    })

    const orderedTransactionGroups = orderedNonces.map((nonce) => nonceToTransactionsMap[nonce])
    mergeNonNonceTransactionGroups(orderedTransactionGroups, incomingTransactionGroups)
    const returnValue = unapprovedTransactionGroups.concat(orderedTransactionGroups)

    console.log('nonceSortedTransactionsSelector end; returnValue', returnValue);
    
    return returnValue;
  },
)

/**
 * @name nonceSortedPendingTransactionsSelector
 * @description Returns an array of transactionGroups where transactions are still pending sorted by
 * nonce in descending order.
 * @returns {transactionGroup[]}
 */
export const nonceSortedPendingTransactionsSelector = createSelector(
  nonceSortedTransactionsSelector,
  (transactions = []) => (
    transactions.filter(({ primaryTransaction }) => primaryTransaction.status in PENDING_STATUS_HASH)
  ),
)

/**
 * @name nonceSortedCompletedTransactionsSelector
 * @description Returns an array of transactionGroups where transactions are confirmed sorted by
 * nonce in descending order.
 * @returns {transactionGroup[]}
 */
export const nonceSortedCompletedTransactionsSelector = createSelector(
  nonceSortedTransactionsSelector,
  (transactions = []) => (
    transactions
      .filter(({ primaryTransaction }) => !(primaryTransaction.status in PENDING_STATUS_HASH))
      .reverse()
  ),
)

export const submittedPendingTransactionsSelector = createSelector(
  transactionsSelector,
  (transactions = []) => (
    transactions.filter((transaction) => transaction.status === SUBMITTED_STATUS)
  ),
)
