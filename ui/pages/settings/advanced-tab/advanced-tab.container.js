import { connect } from 'react-redux';
import { DEFAULT_AUTO_LOCK_TIME_LIMIT } from '../../../../shared/constants/preferences';
import { getPreferences } from '../../../selectors';
import {
  backupUserData,
  setFeatureFlag,
  showModal,
} from '../../../store/actions';
import { getSmartTransactionsPreferenceEnabled } from '../../../../shared/lib/selectors';
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
  const {
    featureFlags: { sendHexData } = {},
    dismissSeedBackUpReminder,
    manageInstitutionalWallets,
  } = metamask;
  const {
    showFiatInTestnets,
    showTestNetworks,
    showExtensionInFullSizeView,
    autoLockTimeLimit = DEFAULT_AUTO_LOCK_TIME_LIMIT,
    dismissSmartAccountSuggestionEnabled,
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
    manageInstitutionalWallets,
    dismissSmartAccountSuggestionEnabled,
  };
};

export const mapDispatchToProps = (dispatch) => {
  return {
    backupUserData: () => backupUserData(),
    setHexDataFeatureFlag: (messenger, shouldShow) =>
      dispatch(setFeatureFlag(messenger, 'sendHexData', shouldShow)),
    displayErrorInSettings: (errorInSettings) =>
      dispatch(displayErrorInSettings(errorInSettings)),
    hideErrorInSettings: () => dispatch(hideErrorInSettings()),
    showResetAccountConfirmationModal: () =>
      dispatch(showModal({ name: 'CONFIRM_RESET_ACCOUNT' })),
    //========
    // We can get rid of all of the actions that merely end up calling the
    // background API, since we can use the messenger directly in the component
    // instead.
    //========
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(AdvancedTab);
