import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import TransactionList from './transaction-list.component'
import {
  getAssetImages,
  getFeatureFlags,
  getSelectedAddress,
  selectedTokenSelector,
  nonceSortedCompletedTransactionsSelector,
  nonceSortedPendingTransactionsSelector,
} from '../../../selectors'
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
    fetchGasEstimates: (blockTime) => dispatch(fetchGasEstimates(blockTime)),
    fetchBasicGasAndTimeEstimates: () => dispatch(fetchBasicGasAndTimeEstimates()),
  }
}

const TransactionListContainer = connect(mapStateToProps, mapDispatchToProps)(TransactionList)

TransactionListContainer.propTypes = {
  isWideViewport: PropTypes.bool,
}

TransactionListContainer.defaultProps = {
  isWideViewport: false,
}

export default TransactionListContainer
