import { connect } from 'react-redux';
import { hideModal } from '../../../../store/actions';
import UpdateAccountNicknameModal from './update-account-nickname-modal.component';

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
)(UpdateAccountNicknameModal);
