import { connect } from 'react-redux'
import ConfirmTransactionSwitch from './confirm-transaction-switch.component'
import {
  TOKEN_METHOD_TRANSFER,
  TOKEN_METHOD_APPROVE,
  TOKEN_METHOD_TRANSFER_FROM,
} from '../../helpers/constants/transactions'

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
    isTokenMethod: [TOKEN_METHOD_APPROVE, TOKEN_METHOD_TRANSFER, TOKEN_METHOD_TRANSFER_FROM].includes(methodData.name)
  }
}

export default connect(mapStateToProps)(ConfirmTransactionSwitch)
