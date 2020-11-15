import { connect } from 'react-redux'
import { compose } from 'recompose'
import { withRouter } from 'react-router-dom'
import {
  setTransactionToConfirm,
  clearConfirmTransaction,
} from '../../ducks/confirm-transaction/confirm-transaction.duck'
import { isTokenMethodAction } from '../../helpers/utils/transactions.util'
import { fetchBasicGasAndTimeEstimates } from '../../ducks/gas/gas.duck'

import {
  getContractMethodData,
  getTokenParams,
  setSelectedAddress,
} from '../../store/actions'
import ConfirmTransaction from './confirm-transaction.component'
import {
  getAddressConnectedToCurrentTab,
  getDomainToConnectedAddressMap,
} from '../../selectors/selectors'

import { unconfirmedTransactionsListSelector } from '../../selectors/confirm-transaction'

const mapStateToProps = (state, ownProps) => {
  const {
    metamask: {
      send,
      unapprovedTxs,
      abTests: { fullScreenVsPopup },
    },
  } = state
  const {
    match: { params = {} },
  } = ownProps
  const { id } = params

  const unconfirmedTransactions = unconfirmedTransactionsListSelector(state)
  const totalUnconfirmed = unconfirmedTransactions.length
  const transaction = totalUnconfirmed
    ? unapprovedTxs[id] || unconfirmedTransactions[0]
    : {}
  const origin = transaction?.msgParams?.origin
  console.log('transaction', transaction)
  const domainToConnectedAddressMap = getDomainToConnectedAddressMap(state)
  console.log('domainToConnectedAddressMap = ', domainToConnectedAddressMap)
  const addressConnectedToCurrentTab =
    getAddressConnectedToCurrentTab(state) ||
    domainToConnectedAddressMap?.[origin]?.[0] ||
    undefined
  const { id: transactionId, transactionCategory } = transaction

  const trackABTest = false

  return {
    selectedAddress: state.metamask.selectedAddress,
    addressConnectedToCurrentTab,
    totalUnapprovedCount: totalUnconfirmed,
    send,
    unapprovedTxs,
    id,
    paramsTransactionId: id && String(id),
    transactionId: transactionId && String(transactionId),
    transaction,
    isTokenMethodAction: isTokenMethodAction(transactionCategory),
    trackABTest,
    fullScreenVsPopupTestGroup: fullScreenVsPopup,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    setSelectedAddress: address => dispatch(setSelectedAddress(address)),
    setTransactionToConfirm: transactionId => {
      dispatch(setTransactionToConfirm(transactionId))
    },
    clearConfirmTransaction: () => dispatch(clearConfirmTransaction()),
    fetchBasicGasAndTimeEstimates: () =>
      dispatch(fetchBasicGasAndTimeEstimates()),
    getContractMethodData: data => dispatch(getContractMethodData(data)),
    getTokenParams: tokenAddress => dispatch(getTokenParams(tokenAddress)),
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(ConfirmTransaction)
