import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { compose } from 'recompose'
import TransactionList from './transaction-list.component'
import {
  pendingTransactionsSelector,
  completedTransactionsSelector,
} from '../../selectors/transactions'

const mapStateToProps = state => {
  return {
    pendingTransactions: pendingTransactionsSelector(state),
    completedTransactions: completedTransactionsSelector(state),
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps)
)(TransactionList)
