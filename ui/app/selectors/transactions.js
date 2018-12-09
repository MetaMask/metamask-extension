import { createSelector } from 'reselect'
import {
  UNAPPROVED_STATUS,
  APPROVED_STATUS,
  SUBMITTED_STATUS,
  CONFIRMED_STATUS,
} from '../constants/transactions'
import {
  TRANSACTION_TYPE_CANCEL,
  TRANSACTION_TYPE_RETRY,
} from '../../../app/scripts/controllers/transactions/enums'
import { hexToDecimal } from '../helpers/conversions.util'

import { selectedTokenAddressSelector } from './tokens'
import txHelper from '../../lib/tx-helper'

export const shapeShiftTxListSelector = state => state.metamask.shapeShiftTxList
export const unapprovedMsgsSelector = state => state.metamask.unapprovedMsgs
export const selectedAddressTxListSelector = state => state.metamask.selectedAddressTxList
export const unapprovedPersonalMsgsSelector = state => state.metamask.unapprovedPersonalMsgs
export const unapprovedTypedMessagesSelector = state => state.metamask.unapprovedTypedMessages
export const networkSelector = state => state.metamask.network

export const unapprovedMessagesSelector = createSelector(
  unapprovedMsgsSelector,
  unapprovedPersonalMsgsSelector,
  unapprovedTypedMessagesSelector,
  networkSelector,
  (
    unapprovedMsgs = {},
    unapprovedPersonalMsgs = {},
    unapprovedTypedMessages = {},
    network
  ) => txHelper(
    {},
    unapprovedMsgs,
    unapprovedPersonalMsgs,
    unapprovedTypedMessages,
    network
  ) || []
)

const pendingStatusHash = {
  [UNAPPROVED_STATUS]: true,
  [APPROVED_STATUS]: true,
  [SUBMITTED_STATUS]: true,
}

const priorityStatusHash = {
  ...pendingStatusHash,
  [CONFIRMED_STATUS]: true,
}

export const transactionsSelector = createSelector(
  selectedTokenAddressSelector,
  unapprovedMessagesSelector,
  shapeShiftTxListSelector,
  selectedAddressTxListSelector,
  (selectedTokenAddress, unapprovedMessages = [], shapeShiftTxList = [], transactions = []) => {
    const txsToRender = transactions.concat(unapprovedMessages, shapeShiftTxList)

    return selectedTokenAddress
      ? txsToRender
        .filter(({ txParams }) => txParams && txParams.to === selectedTokenAddress)
        .sort((a, b) => b.time - a.time)
      : txsToRender
        .sort((a, b) => b.time - a.time)
  }
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

    if (Number(hexToDecimal(nonce)) < Number(hexToDecimal(nonceToInsert))) {
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
 * @returns {transactionGroup[]}
 */
const insertTransactionGroupByTime = (transactionGroups, transactionGroup) => {
  const { primaryTransaction: { time } = {} } = transactionGroup

  let insertIndex = transactionGroups.length

  for (let i = 0; i < transactionGroups.length; i++) {
    const txGroup = transactionGroups[i]

    if (txGroup.time > time) {
      insertIndex = i
      break
    }
  }

  transactionGroups.splice(insertIndex, 0, transactionGroup)
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
    const orderedNonces = []
    const nonceToTransactionsMap = {}

    transactions.forEach(transaction => {
      const { txParams: { nonce } = {}, status, type, time: txTime } = transaction

      if (typeof nonce === 'undefined') {
        const transactionGroup = {
          transactions: [transaction],
          initialTransaction: transaction,
          primaryTransaction: transaction,
          hasRetried: false,
          hasCancelled: false,
        }

        insertTransactionGroupByTime(unapprovedTransactionGroups, transactionGroup)
      } else if (nonce in nonceToTransactionsMap) {
        const nonceProps = nonceToTransactionsMap[nonce]
        insertTransactionByTime(nonceProps.transactions, transaction)

        if (status in priorityStatusHash) {
          const { primaryTransaction: { time: primaryTxTime = 0 } = {} } = nonceProps

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
        nonceToTransactionsMap[nonce] = {
          nonce,
          transactions: [transaction],
          initialTransaction: transaction,
          primaryTransaction: transaction,
          hasRetried: transaction.type === TRANSACTION_TYPE_RETRY,
          hasCancelled: transaction.type === TRANSACTION_TYPE_CANCEL,
        }

        insertOrderedNonce(orderedNonces, nonce)
      }
    })

    const orderedTransactionGroups = orderedNonces.map(nonce => nonceToTransactionsMap[nonce])
    return unapprovedTransactionGroups.concat(orderedTransactionGroups)
  }
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
    transactions
      .filter(({ primaryTransaction }) => primaryTransaction.status in pendingStatusHash)
      .reverse()
  )
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
    transactions.filter(({ primaryTransaction }) => {
      return !(primaryTransaction.status in pendingStatusHash)
    })
  )
)

export const submittedPendingTransactionsSelector = createSelector(
  transactionsSelector,
  (transactions = []) => (
    transactions.filter(transaction => transaction.status === SUBMITTED_STATUS)
  )
)
