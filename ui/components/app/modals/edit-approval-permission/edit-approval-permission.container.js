import { connect } from 'react-redux';
import { compose } from 'redux';
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props';
import { getSelectedIdentity } from '../../../../selectors';
import EditApprovalPermission from './edit-approval-permission.component';

const mapStateToProps = (state) => {
  const modalStateProps = state.appState.modal.modalState.props || {};
  return {
    selectedIdentity: getSelectedIdentity(state),
    ...modalStateProps,
  };
};

export default compose(
  withModalProps,
  connect(mapStateToProps),
)(EditApprovalPermission);
