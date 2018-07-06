import { connect } from 'react-redux'
import ConfirmTransactionSwitch from './confirm-transaction-switch.component'

const mapStateToProps = state => {
  const {
    confirmTransaction: {
      txData,
      methodData,
      fetchingMethodData,
    },
  } = state

  return {
    txData,
    methodData,
    fetchingMethodData,
  }
}

export default connect(mapStateToProps)(ConfirmTransactionSwitch)
