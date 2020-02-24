import { connect } from 'react-redux'
import TransactionList from './transaction-list.component'
import {
  nonceSortedCompletedTransactionsSelector,
  nonceSortedPendingTransactionsSelector,
} from '../../../selectors/transactions'
import { getSelectedAddress, getAssetImages, getFeatureFlags } from '../../../selectors/selectors'
import { selectedTokenSelector } from '../../../selectors/tokens'
import { updateNetworkNonce } from '../../../store/actions'
import { fetchBasicGasAndTimeEstimates, fetchGasEstimates } from '../../../ducks/gas/gas.duck'

const mapStateToProps = (state) => {
  const pendingTransactions = nonceSortedPendingTransactionsSelector(state)
  const firstPendingTransactionId = pendingTransactions[0] && pendingTransactions[0].primaryTransaction.id
  return {
    completedTransactions: nonceSortedCompletedTransactionsSelector(state),
    pendingTransactions,
    firstPendingTransactionId,
    selectedToken: selectedTokenSelector(state),
    selectedAddress: getSelectedAddress(state),
    assetImages: getAssetImages(state),
    transactionTimeFeatureActive: getFeatureFlags(state).transactionTime,
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    updateNetworkNonce: (address) => dispatch(updateNetworkNonce(address)),
    fetchGasEstimates: (blockTime) => dispatch(fetchGasEstimates(blockTime)),
    fetchBasicGasAndTimeEstimates: () => dispatch(fetchBasicGasAndTimeEstimates()),
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

export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(TransactionList)
