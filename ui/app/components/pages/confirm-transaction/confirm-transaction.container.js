import { connect } from 'react-redux'
import { compose } from 'recompose'
import { withRouter } from 'react-router-dom'
import {
  setTransactionToConfirm,
  clearConfirmTransaction,
} from '../../../ducks/confirm-transaction.duck'
import {
  fetchBasicGasEstimates,
} from '../../../ducks/gas.duck'
import ConfirmTransaction from './confirm-transaction.component'
import { getTotalUnapprovedCount } from '../../../selectors'
import { unconfirmedTransactionsListSelector } from '../../../selectors/confirm-transaction'

const mapStateToProps = state => {
  const { metamask: { send }, confirmTransaction } = state

  return {
    totalUnapprovedCount: getTotalUnapprovedCount(state),
    send,
    confirmTransaction,
    unconfirmedTransactions: unconfirmedTransactionsListSelector(state),
  }
}

const mapDispatchToProps = dispatch => {
  return {
    setTransactionToConfirm: transactionId => dispatch(setTransactionToConfirm(transactionId)),
    clearConfirmTransaction: () => dispatch(clearConfirmTransaction()),
    fetchBasicGasEstimates: () => dispatch(fetchBasicGasEstimates()),
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(ConfirmTransaction)
