import { connect } from 'react-redux';
import { hideModal, hideWarning } from '../../../../../store/actions';
import ComplinaceModal from './compliance-modal.component';

function mapStateToProps() {
  return {};
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

export default connect(mapStateToProps, mapDispatchToProps)(ComplinaceModal);
