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
    featureFlags: { sendHexData, advancedInlineGas } = {},
    useNonceField,
    ledgerTransportType,
    dismissSeedBackUpReminder,
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
    advancedInlineGas,
    showFiatInTestnets,
    showTestNetworks,
    autoLockTimeLimit,
    useNonceField,
    ledgerTransportType,
    dismissSeedBackUpReminder,
    userHasALedgerAccount,
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
    setAdvancedInlineGasFeatureFlag: (shouldShow) =>
      dispatch(setFeatureFlag('advancedInlineGas', shouldShow)),
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
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(AdvancedTab);
