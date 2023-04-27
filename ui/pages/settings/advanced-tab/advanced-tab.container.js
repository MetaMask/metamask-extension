import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import {
  displayWarning,
  setFeatureFlag,
  showModal,
  setShowFiatConversionOnTestnetsPreference,
  setShowTestNetworks,
  setAutoLockTimeLimit,
  setUseNonceField,
  setLedgerTransportPreference,
  setDismissSeedBackUpReminder,
  setDisabledRpcMethodPreference,
  backupUserData,
  restoreUserData,
} from '../../../store/actions';
import { getPreferences } from '../../../selectors';
import { doesUserHaveALedgerAccount } from '../../../ducks/metamask/metamask';
import AdvancedTab from './advanced-tab.component';

export const mapStateToProps = (state) => {
  const {
    appState: { warning },
    metamask,
  } = state;
  const {
    featureFlags: { sendHexData } = {},
    disabledRpcMethodPreferences,
    useNonceField,
    ledgerTransportType,
    dismissSeedBackUpReminder,
    ///: BEGIN:ONLY_INCLUDE_IN(desktop)
    desktopEnabled,
    ///: END:ONLY_INCLUDE_IN
  } = metamask;
  const {
    showFiatInTestnets,
    showTestNetworks,
    autoLockTimeLimit = 0,
  } = getPreferences(state);

  const userHasALedgerAccount = doesUserHaveALedgerAccount(state);

  return {
    warning,
    sendHexData,
    showFiatInTestnets,
    showTestNetworks,
    autoLockTimeLimit,
    useNonceField,
    ledgerTransportType,
    dismissSeedBackUpReminder,
    userHasALedgerAccount,
    disabledRpcMethodPreferences,
    ///: BEGIN:ONLY_INCLUDE_IN(desktop)
    desktopEnabled,
    ///: END:ONLY_INCLUDE_IN
  };
};

export const mapDispatchToProps = (dispatch) => {
  return {
    backupUserData: () => backupUserData(),
    restoreUserData: (jsonString) => restoreUserData(jsonString),
    setHexDataFeatureFlag: (shouldShow) =>
      dispatch(setFeatureFlag('sendHexData', shouldShow)),
    displayWarning: (warning) => dispatch(displayWarning(warning)),
    showResetAccountConfirmationModal: () =>
      dispatch(showModal({ name: 'CONFIRM_RESET_ACCOUNT' })),
    setUseNonceField: (value) => dispatch(setUseNonceField(value)),
    setShowFiatConversionOnTestnetsPreference: (value) => {
      return dispatch(setShowFiatConversionOnTestnetsPreference(value));
    },
    setShowTestNetworks: (value) => {
      return dispatch(setShowTestNetworks(value));
    },
    setAutoLockTimeLimit: (value) => {
      return dispatch(setAutoLockTimeLimit(value));
    },
    setLedgerTransportPreference: (value) => {
      return dispatch(setLedgerTransportPreference(value));
    },
    setDismissSeedBackUpReminder: (value) => {
      return dispatch(setDismissSeedBackUpReminder(value));
    },
    setDisabledRpcMethodPreference: (methodName, isEnabled) => {
      return dispatch(setDisabledRpcMethodPreference(methodName, isEnabled));
    },
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(AdvancedTab);
