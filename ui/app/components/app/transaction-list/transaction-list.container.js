import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { compose } from 'recompose'
import TransactionList from './transaction-list.component'
import {
  nonceSortedCompletedTransactionsSelector,
  nonceSortedPendingTransactionsSelector,
} from '../../../selectors/transactions'
import { getSelectedAddress, getAssetImages } from '../../../selectors/selectors'
import { selectedTokenSelector } from '../../../selectors/tokens'
import { updateNetworkNonce } from '../../../store/actions'

const mapStateToProps = state => {
  const selectedAddress = getSelectedAddress(state)
  const _incomingTransactions = Object.values(state.metamask.incomingTransactions)
    .filter(({ txParams }) => txParams.to === selectedAddress)

  return {
    completedTransactions: nonceSortedCompletedTransactionsSelector(state),
    pendingTransactions: nonceSortedPendingTransactionsSelector(state),
    selectedToken: selectedTokenSelector(state),
    selectedAddress,
    assetImages: getAssetImages(state),
    incomingTransactions: _incomingTransactions.map(incomingTx => ({
      transactions: _incomingTransactions,
      primaryTransaction: incomingTx,
      initialTransaction: incomingTx,
    })),
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
