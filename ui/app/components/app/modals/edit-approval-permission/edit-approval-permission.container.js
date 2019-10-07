import { connect } from 'react-redux'
import { compose } from 'recompose'
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props'
import EditApprovalPermission from './edit-approval-permission.component'
import { resetAccount } from '../../../../store/actions'
import { getSelectedIdentity } from '../../../../selectors/selectors'

const mapStateToProps = (state) => {
  const modalStateProps = state.appState.modal.modalState.props || {}
  return {
    selectedIdentity: getSelectedIdentity(state),
    ...modalStateProps,
  }
}


const mapDispatchToProps = dispatch => {
  return {
    resetAccount: () => dispatch(resetAccount()),
  }
}

export default compose(
  withModalProps,
  connect(mapStateToProps, mapDispatchToProps)
)(EditApprovalPermission)
