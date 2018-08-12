import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { compose } from 'recompose'
import TransactionList from './transaction-list.component'
import {
  pendingTransactionsSelector,
  submittedPendingTransactionsSelector,
  completedTransactionsSelector,
} from '../../selectors/transactions'
import { getSelectedAddress } from '../../selectors'
import { selectedTokenSelector } from '../../selectors/tokens'
import { getLatestSubmittedTxWithNonce } from '../../helpers/transactions.util'
import { updateNetworkNonce } from '../../actions'

const mapStateToProps = state => {
  const pendingTransactions = pendingTransactionsSelector(state)
  const submittedPendingTransactions = submittedPendingTransactionsSelector(state)
  const networkNonce = state.appState.networkNonce

  return {
    completedTransactions: completedTransactionsSelector(state),
    pendingTransactions,
    transactionToRetry: getLatestSubmittedTxWithNonce(submittedPendingTransactions, networkNonce),
    selectedToken: selectedTokenSelector(state),
    selectedAddress: getSelectedAddress(state),
  }
}

const mapDispatchToProps = dispatch => {
  return {
    updateNetworkNonce: address => dispatch(updateNetworkNonce(address)),
  }
}

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const { selectedAddress, ...restStateProps } = stateProps
  const { updateNetworkNonce, ...restDispatchProps } = dispatchProps

  return {
    ...restStateProps,
    ...restDispatchProps,
    ...ownProps,
    updateNetworkNonce: () => updateNetworkNonce(selectedAddress),
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps, mergeProps)
)(TransactionList)
