import { connect } from 'react-redux';
import { hideModal } from '../../../../store/actions';
import * as actions from '../../../../store/actions';
import UpdateAccountNicknameModal from './update-account-nickname-modal.component';

function mapStateToProps(state) {
  const { metamask } = state;

  const {
    addressBook,
    provider: { chainId },
  } = metamask;
  const address = state.appState?.modal?.modalState?.props?.address;
  const addressBookEntryObject =
    addressBook && addressBook[chainId] && addressBook[chainId][address];

  return {
    ...(state.appState?.modal?.modalState?.props || {}),
    addressBookEntry: addressBookEntryObject,
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
