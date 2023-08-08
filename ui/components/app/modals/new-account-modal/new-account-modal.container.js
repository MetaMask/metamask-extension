import { connect } from 'react-redux';
import * as actions from '../../../../store/actions';
import NewAccountModal from './new-account-modal.component';

function mapStateToProps(state) {
  return {
    ...(state.appState.modal.modalState.props || {}),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    hideModal: () => dispatch(actions.hideModal()),
    createAccount: (newAccountName) => {
      return dispatch(actions.addNewAccount(newAccountName)).then((account) => {
        if (newAccountName) {
          dispatch(actions.setAccountLabel(account.id, newAccountName));
        }
        return account.id;
      });
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
      return createAccount(newAccountName).then((account) =>
        onCreateNewAccount(account),
      );
    },
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(NewAccountModal);
