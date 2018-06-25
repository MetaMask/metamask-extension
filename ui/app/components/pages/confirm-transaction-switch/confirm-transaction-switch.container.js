import { connect } from 'react-redux'
import ConfirmTransactionSwitch from './confirm-transaction-switch.component'

const mapStateToProps = state => {
  const { confirmTransaction } = state

  return {
    confirmTransaction,
  }
}

export default connect(mapStateToProps)(ConfirmTransactionSwitch)
