import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { compose } from 'recompose'
import withMethodData from '../../higher-order-components/with-method-data'
import TransactionListItem from './transaction-list-item.component'
import { setSelectedToken, showModal, showSidebar } from '../../actions'
import { hexToDecimal } from '../../helpers/conversions.util'
import { getTokenData } from '../../helpers/transactions.util'
import { increaseLastGasPrice } from '../../helpers/confirm-transaction/util'
import { formatDate } from '../../util'
import {
  fetchBasicGasAndTimeEstimates,
  fetchGasEstimates,
  setCustomGasPrice,
  setCustomGasLimit,
} from '../../ducks/gas.duck'

const mapDispatchToProps = dispatch => {
  return {
    fetchBasicGasAndTimeEstimates: () => dispatch(fetchBasicGasAndTimeEstimates()),
    fetchGasEstimates: (blockTime) => dispatch(fetchGasEstimates(blockTime)),
    setSelectedToken: tokenAddress => dispatch(setSelectedToken(tokenAddress)),
    retryTransaction: (transaction, gasPrice) => {
      dispatch(setCustomGasPrice(gasPrice || transaction.txParams.gasPrice))
      dispatch(setCustomGasLimit(transaction.txParams.gas))
      dispatch(showSidebar({
        transitionName: 'sidebar-left',
        type: 'customize-gas',
        props: { transaction },
      }))
    },
    showCancelModal: (transactionId, originalGasPrice) => {
      return dispatch(showModal({ name: 'CANCEL_TRANSACTION', transactionId, originalGasPrice }))
    },
  }
}

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const { transactionGroup: { primaryTransaction, initialTransaction } = {} } = ownProps
  const { retryTransaction, ...restDispatchProps } = dispatchProps
  const { txParams: { nonce, data } = {}, time } = initialTransaction
  const { txParams: { value } = {} } = primaryTransaction

  const tokenData = data && getTokenData(data)
  const nonceAndDate = nonce ? `#${hexToDecimal(nonce)} - ${formatDate(time)}` : formatDate(time)

  return {
    ...stateProps,
    ...restDispatchProps,
    ...ownProps,
    value,
    nonceAndDate,
    tokenData,
    transaction: initialTransaction,
    primaryTransaction,
    retryTransaction: (transactionId, gasPrice) => {
      const { transactionGroup: { transactions = [] } } = ownProps
      const transaction = transactions.find(tx => tx.id === transactionId) || {}
      const increasedGasPrice = increaseLastGasPrice(gasPrice)
      retryTransaction(transaction, increasedGasPrice)
    },
  }
}

export default compose(
  withRouter,
  connect(null, mapDispatchToProps, mergeProps),
  withMethodData,
)(TransactionListItem)
