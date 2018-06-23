import { connect } from 'react-redux'
import ConfirmTransactionSwitch from './confirm-transaction-switch.component'
import { unconfirmedTransactionsListSelector } from '../../../selectors/confirm-transaction'

const mapStateToProps = state => {
  return {
    unconfirmedTransactions: unconfirmedTransactionsListSelector(state),
  }
}

export default connect(mapStateToProps)(ConfirmTransactionSwitch)
