import { connect } from 'react-redux'
import ConfirmTransactionSwitch from './confirm-transaction-switch.component'

const mapStateToProps = state => {
  const {
    confirmTransaction: {
      txData,
      methodData,
      fetchingData,
      toSmartContract,
    },
  } = state

  return {
    txData,
    methodData,
    fetchingData,
    isEtherTransaction: !toSmartContract,
  }
}

export default connect(mapStateToProps)(ConfirmTransactionSwitch)
