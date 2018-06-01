import { connect } from 'react-redux'
import ConfirmResetAccount from './confirm-reset-account.component'

const { hideModal, resetAccount } = require('../../../actions')

const mapDispatchToProps = dispatch => {
  return {
    hideModal: () => dispatch(hideModal()),
    resetAccount: () => dispatch(resetAccount()),
  }
}

export default connect(null, mapDispatchToProps)(ConfirmResetAccount)
