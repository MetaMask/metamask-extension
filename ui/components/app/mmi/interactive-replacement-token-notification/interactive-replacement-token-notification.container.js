import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';
import { getMMIActions } from '../../../store/actions';
import { getCurrentKeyring } from '../../../selectors';
import InteractiveReplacementTokenNotification from './interactive-replacement-token-notification.component';

const mapStateToProps = (state) => {
  const { metamask, appState } = state;
  const { isUnlocked, interactiveReplacementToken } = metamask;
  const address =
    appState.modal.modalState.props.address || metamask.selectedAddress;

  return {
    keyring: getCurrentKeyring(state),
    isUnlocked,
    address,
    interactiveReplacementToken,
  };
};

const mapDispatchToProps = (dispatch) => {
  const MMIActions = getMMIActions();

  return {
    showInteractiveReplacementTokenModal: () =>
      dispatch(MMIActions.showInteractiveReplacementTokenModal()),
    getCustodianToken: async (custody) =>
      await dispatch(MMIActions.getCustodianToken(custody)),
    getCustodyAccountDetails: async (keyring, token) =>
      await dispatch(
        MMIActions.getAllCustodianAccountsWithToken(
          keyring.type.split(' - ')[1],
          token,
        ),
      ),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(InteractiveReplacementTokenNotification);
