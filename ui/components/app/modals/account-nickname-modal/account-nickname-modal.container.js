import { connect } from 'react-redux';
import { hideModal, showModal } from '../../../../store/actions';
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
    addNicknameModal: (address, nickname) =>
      dispatch(
        showModal({
          name: 'ADD_UPDATE_NICKNAME_MODAL',
          address,
          nickname,
        }),
      ),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(AccountNicknameModal);
