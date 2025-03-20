import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';
import { DEFAULT_AUTO_LOCK_TIME_LIMIT } from '../../../../shared/constants/preferences';
import { getPreferences } from '../../../selectors';
import {
  backupUserData,
  setAutoLockTimeLimit,
  setDismissSeedBackUpReminder,
  setFeatureFlag,
  setShowExtensionInFullSizeView,
  setShowFiatConversionOnTestnetsPreference,
  setShowTestNetworks,
  setSmartTransactionsPreferenceEnabled,
  showModal,
} from '../../../store/actions';
import { getSmartTransactionsPreferenceEnabled } from '../../../../shared/modules/selectors';
import {
  displayErrorInSettings,
  hideErrorInSettings,
} from '../../../ducks/app/app';
import AdvancedTab from './advanced-tab.component';

export const mapStateToProps = (state) => {
  const {
    appState: { errorInSettings },
    metamask,
  } = state;
  const { featureFlags: { sendHexData } = {}, dismissSeedBackUpReminder } =
    metamask;
  const {
    showFiatInTestnets,
    showTestNetworks,
    showExtensionInFullSizeView,
    autoLockTimeLimit = DEFAULT_AUTO_LOCK_TIME_LIMIT,
  } = getPreferences(state);

  return {
    errorInSettings,
    sendHexData,
    showFiatInTestnets,
    showTestNetworks,
    showExtensionInFullSizeView,
    smartTransactionsEnabled: getSmartTransactionsPreferenceEnabled(state),
    autoLockTimeLimit,
    dismissSeedBackUpReminder,
  };
};

export const mapDispatchToProps = (dispatch) => {
  return {
    backupUserData: () => backupUserData(),
    setHexDataFeatureFlag: (shouldShow) =>
      dispatch(setFeatureFlag('sendHexData', shouldShow)),
    displayErrorInSettings: (errorInSettings) =>
      dispatch(displayErrorInSettings(errorInSettings)),
    hideErrorInSettings: () => dispatch(hideErrorInSettings()),
    showResetAccountConfirmationModal: () =>
      dispatch(showModal({ name: 'CONFIRM_RESET_ACCOUNT' })),
    setShowFiatConversionOnTestnetsPreference: (value) => {
      return dispatch(setShowFiatConversionOnTestnetsPreference(value));
    },
    setShowTestNetworks: (value) => {
      return dispatch(setShowTestNetworks(value));
    },
    setShowExtensionInFullSizeView: (value) => {
      return dispatch(setShowExtensionInFullSizeView(value));
    },
    setSmartTransactionsEnabled: (value) => {
      return dispatch(setSmartTransactionsPreferenceEnabled(value));
    },
    setAutoLockTimeLimit: (value) => {
      return dispatch(setAutoLockTimeLimit(value));
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
