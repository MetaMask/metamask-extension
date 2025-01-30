import { connect } from 'react-redux';
import {
  addNewAccount,
  setAccountLabel,
  forceUpdateMetamaskState,
  hideModal,
} from '../../../../store/actions';
import NewAccountModal from './new-account-modal.component';

function mapStateToProps(state) {
  return {
    ...(state.appState.modal.modalState.props || {}),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    hideModal: () => dispatch(hideModal()),
    createAccount: async (newAccountName) => {
      const newAccountAddress = await dispatch(addNewAccount());
      if (newAccountName) {
        dispatch(setAccountLabel(newAccountAddress, newAccountName));
      }
      await forceUpdateMetamaskState(dispatch);
      return newAccountAddress;
    },
  };
}

function mergeProps(stateProps, dispatchProps) {
  const { onCreateNewAccount } = stateProps;
  const { createAccount } = dispatchProps;

  return {
    ...stateProps,
    ...dispatchProps,
    onSave: (newAccountName) => {
      return createAccount(newAccountName).then((newAccountAddress) => {
        onCreateNewAccount(newAccountAddress);
      });
    },
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(NewAccountModal);
