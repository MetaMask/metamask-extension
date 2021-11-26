import { connect } from 'react-redux';
import { hideModal } from '../../../../store/actions';
import * as actions from '../../../../store/actions';
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
    addToAddressBook: (recipient, nickname, memo) =>
      dispatch(actions.addToAddressBook(recipient, nickname, memo)),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(UpdateAccountNicknameModal);
