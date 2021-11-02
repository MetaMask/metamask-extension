import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import {
  displayWarning,
  setFeatureFlag,
  showModal,
  setShowFiatConversionOnTestnetsPreference,
  setAutoLockTimeLimit,
  setThreeBoxSyncingPermission,
  turnThreeBoxSyncingOnAndInitialize,
  setUseNonceField,
  setIpfsGateway,
  setLedgerLivePreference,
  setDismissSeedBackUpReminder,
} from '../../../store/actions';
import { getPreferences } from '../../../selectors';
import AdvancedTab from './advanced-tab.component';

export const mapStateToProps = (state) => {
  const {
    appState: { warning },
    metamask,
  } = state;
  const {
    featureFlags: { sendHexData, advancedInlineGas } = {},
    threeBoxSyncingAllowed,
    threeBoxDisabled,
    useNonceField,
    ipfsGateway,
    useLedgerLive,
    dismissSeedBackUpReminder,
  } = metamask;
  const { showFiatInTestnets, autoLockTimeLimit } = getPreferences(state);

  return {
    warning,
    sendHexData,
    advancedInlineGas,
    showFiatInTestnets,
    autoLockTimeLimit,
    threeBoxSyncingAllowed,
    threeBoxDisabled,
    useNonceField,
    ipfsGateway,
    useLedgerLive,
    dismissSeedBackUpReminder,
  };
};

export const mapDispatchToProps = (dispatch) => {
  return {
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
    setAutoLockTimeLimit: (value) => {
      return dispatch(setAutoLockTimeLimit(value));
    },
    setThreeBoxSyncingPermission: (newThreeBoxSyncingState) => {
      if (newThreeBoxSyncingState) {
        dispatch(turnThreeBoxSyncingOnAndInitialize());
      } else {
        dispatch(setThreeBoxSyncingPermission(newThreeBoxSyncingState));
      }
    },
    setIpfsGateway: (value) => {
      return dispatch(setIpfsGateway(value));
    },
    setLedgerLivePreference: (value) => {
      return dispatch(setLedgerLivePreference(value));
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
