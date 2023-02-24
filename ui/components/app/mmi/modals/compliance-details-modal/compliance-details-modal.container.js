import { connect } from 'react-redux';
import { hideModal, hideWarning } from '../../../../store/actions';
import ComplianceDetailsModal from './compliance-details-modal.component';

function mapStateToProps(state) {
  const modalStateProps = state.appState.modal.modalState.props || {};
  return {
    ...modalStateProps,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    hideModal: () => {
      dispatch(hideModal());
    },
    hideWarning: () => {
      dispatch(hideWarning());
    },
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ComplianceDetailsModal);
