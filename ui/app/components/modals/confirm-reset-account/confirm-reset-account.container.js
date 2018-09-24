import { connect } from 'react-redux'
import { compose } from 'recompose'
import withModalProps from '../../../higher-order-components/with-modal-props'
import ConfirmResetAccount from './confirm-reset-account.component'
import { resetAccount } from '../../../actions'

const mapDispatchToProps = dispatch => {
  return {
    resetAccount: () => dispatch(resetAccount()),
  }
}

export default compose(
  withModalProps,
  connect(null, mapDispatchToProps)
)(ConfirmResetAccount)
