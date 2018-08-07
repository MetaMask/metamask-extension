import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { compose } from 'recompose'
import TransactionList from './transaction-list.component'
import {
  pendingTransactionsSelector,
  submittedPendingTransactionsSelector,
  completedTransactionsSelector,
} from '../../selectors/transactions'
import { selectedTokenSelector } from '../../selectors/tokens'
import { getLatestSubmittedTxWithEarliestNonce } from '../../helpers/transactions.util'

const mapStateToProps = state => {
  const pendingTransactions = pendingTransactionsSelector(state)
  const submittedPendingTransactions = submittedPendingTransactionsSelector(state)

  return {
    completedTransactions: completedTransactionsSelector(state),
    pendingTransactions,
    transactionToRetry: getLatestSubmittedTxWithEarliestNonce(submittedPendingTransactions),
    selectedToken: selectedTokenSelector(state),
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps)
)(TransactionList)
