import { createSelector } from 'reselect'
import { valuesFor } from '../util'
import {
  UNAPPROVED_STATUS,
  APPROVED_STATUS,
  SUBMITTED_STATUS,
} from '../constants/transactions'

export const shapeShiftTxListSelector = state => state.metamask.shapeShiftTxList
export const selectedTokenAddressSelector = state => state.metamask.selectedTokenAddress
export const unapprovedMsgsSelector = state => state.metamask.unapprovedMsgs
export const selectedAddressTxListSelector = state => state.metamask.selectedAddressTxList

const pendingStatusHash = {
  [UNAPPROVED_STATUS]: true,
  [APPROVED_STATUS]: true,
  [SUBMITTED_STATUS]: true,
}

export const transactionsSelector = createSelector(
  selectedTokenAddressSelector,
  unapprovedMsgsSelector,
  shapeShiftTxListSelector,
  selectedAddressTxListSelector,
  (selectedTokenAddress, unapprovedMsgs = {}, shapeShiftTxList = [], transactions = []) => {
    const unapprovedMsgsList = valuesFor(unapprovedMsgs)
    const txsToRender = transactions.concat(unapprovedMsgsList, shapeShiftTxList)

    return selectedTokenAddress
      ? txsToRender
        .filter(({ txParams }) => txParams && txParams.to === selectedTokenAddress)
        .sort((a, b) => b.time - a.time)
      : txsToRender
        .sort((a, b) => b.time - a.time)
  }
)

export const pendingTransactionsSelector = createSelector(
  transactionsSelector,
  (transactions = []) => (
    transactions.filter(transaction => transaction.status in pendingStatusHash)
  )
)

export const completedTransactionsSelector = createSelector(
  transactionsSelector,
  (transactions = []) => (
    transactions.filter(transaction => !(transaction.status in pendingStatusHash))
  )
)
