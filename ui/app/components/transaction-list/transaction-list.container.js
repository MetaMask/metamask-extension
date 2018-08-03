import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { compose } from 'recompose'
import TransactionList from './transaction-list.component'
import {
  pendingTransactionsSelector,
  completedTransactionsSelector,
} from '../../selectors/transactions'
import { getLatestSubmittedTxWithEarliestNonce } from '../../helpers/transactions.util'

const mapStateToProps = state => {
  const pendingTransactions = pendingTransactionsSelector(state)

  return {
    completedTransactions: completedTransactionsSelector(state),
    pendingTransactions,
    transactionToRetry: getLatestSubmittedTxWithEarliestNonce(pendingTransactions),
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps)
)(TransactionList)
