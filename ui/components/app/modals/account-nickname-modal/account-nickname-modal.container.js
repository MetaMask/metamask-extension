import { connect } from 'react-redux';
import { hideModal } from '../../../../store/actions';
import AccountNicknameModal from './account-nickname-modal.component';

function mapStateToProps(state) {
  return {
    ...(state.appState.modal.modalState.props || {}),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    hideModal: () => {
      dispatch(hideModal());
    },
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(AccountNicknameModal);
