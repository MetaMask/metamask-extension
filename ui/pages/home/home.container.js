import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import {
  activeTabHasPermissions,
  getUseExternalServices,
  getIsMainnet,
  getOriginOfCurrentTab,
  getTotalUnapprovedCount,
  getWeb3ShimUsageStateForOrigin,
  getShowWhatsNewPopup,
  getSortedAnnouncementsToShow,
  getShowRecoveryPhraseReminder,
  getShowTermsOfUse,
  getShowOutdatedBrowserWarning,
  getNewNetworkAdded,
  getIsSigningQRHardwareTransaction,
  getNewNftAddedMessage,
  getNewTokensImported,
  getRemoveNftMessage,
  getApprovalFlows,
  getNewTokensImportedError,
  hasPendingApprovals,
  getSelectedInternalAccount,
  getEditedNetwork,
  selectPendingApprovalsForNavigation,
  ///: BEGIN:ONLY_INCLUDE_IF(solana)
  getIsSolanaSupportEnabled,
  ///: END:ONLY_INCLUDE_IF
  getShowUpdateModal,
  getShowConnectionsRemovedModal,
} from '../../selectors';
import { getInfuraBlocked } from '../../../shared/modules/selectors/networks';
import {
  attemptCloseNotificationPopup,
  setConnectedStatusPopoverHasBeenShown,
  setDefaultHomeActiveTabName,
  setWeb3ShimUsageAlertDismissed,
  setAlertEnabledness,
  setRecoveryPhraseReminderHasBeenShown,
  setRecoveryPhraseReminderLastShown,
  setTermsOfUseLastAgreed,
  setOutdatedBrowserWarningLastShown,
  setNewNetworkAdded,
  setNewNftAddedMessage,
  setRemoveNftMessage,
  setNewTokensImported,
  setActiveNetwork,
  setNewTokensImportedError,
  setDataCollectionForMarketing,
  setEditedNetwork,
  setAccountDetailsAddress,
} from '../../store/actions';
import {
  hideWhatsNewPopup,
  openBasicFunctionalityModal,
} from '../../ducks/app/app';
import {
  getIsPrimarySeedPhraseBackedUp,
  getIsSeedlessPasswordOutdated,
  getWeb3ShimUsageAlertEnabledness,
} from '../../ducks/metamask/metamask';
import { getSwapsFeatureIsLive } from '../../ducks/swaps/swaps';
import { fetchBuyableChains } from '../../ducks/ramps';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../app/scripts/lib/util';
import { getIsBrowserDeprecated } from '../../helpers/utils/util';
import {
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_POPUP,
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES,
  ///: END:ONLY_INCLUDE_IF
} from '../../../shared/constants/app';
import {
  AlertTypes,
  Web3ShimUsageAlertStates,
} from '../../../shared/constants/alerts';
import { getShouldShowSeedPhraseReminder } from '../../selectors/multi-srp/multi-srp';
import {
  getRedirectAfterDefaultPage,
  clearRedirectAfterDefaultPage,
} from '../../ducks/history/history';

import Home from './home.component';

const mapStateToProps = (state) => {
  const { metamask, appState } = state;
  const {
    seedPhraseBackedUp,
    connectedStatusPopoverHasBeenShown,
    defaultHomeActiveTabName,
    swapsState,
    quotes,
    dataCollectionForMarketing,
    participateInMetaMetrics,
    firstTimeFlowType,
    completedOnboarding,
    forgottenPassword,
  } = metamask;
  const selectedAccount = getSelectedInternalAccount(state);
  const { address: selectedAddress } = selectedAccount;
  const totalUnapprovedCount = getTotalUnapprovedCount(state);
  const swapsEnabled = getSwapsFeatureIsLive(state);
  const pendingApprovals = selectPendingApprovalsForNavigation(state);
  const redirectAfterDefaultPage = getRedirectAfterDefaultPage(state);

  const envType = getEnvironmentType();
  const isPopup = envType === ENVIRONMENT_TYPE_POPUP;
  const isNotification = envType === ENVIRONMENT_TYPE_NOTIFICATION;

  const originOfCurrentTab = getOriginOfCurrentTab(state);
  const shouldShowWeb3ShimUsageNotification =
    isPopup &&
    getWeb3ShimUsageAlertEnabledness(state) &&
    activeTabHasPermissions(state) &&
    getWeb3ShimUsageStateForOrigin(state, originOfCurrentTab) ===
      Web3ShimUsageAlertStates.recorded;

  const hasAllowedPopupRedirectApprovals = hasPendingApprovals(state, [
    ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
    SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountCreation,
    SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountRemoval,
    SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showNameSnapAccount,
    SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showSnapAccountRedirect,
    ///: END:ONLY_INCLUDE_IF
  ]);

  let TEMPORARY_DISABLE_WHATS_NEW = true;

  ///: BEGIN:ONLY_INCLUDE_IF(solana)
  const solanaSupportEnabled = getIsSolanaSupportEnabled(state);

  // TODO: Remove this once the feature flag is enabled by default
  // If the feature flag is enabled, we should show the whats new modal
  if (solanaSupportEnabled) {
    TEMPORARY_DISABLE_WHATS_NEW = false;
  }
  ///: END:ONLY_INCLUDE_IF

  const showWhatsNewPopup = TEMPORARY_DISABLE_WHATS_NEW
    ? false
    : getShowWhatsNewPopup(state);

  const shouldShowSeedPhraseReminder =
    selectedAccount && getShouldShowSeedPhraseReminder(state, selectedAccount);

  return {
    useExternalServices: getUseExternalServices(state),
    isBasicConfigurationModalOpen: appState.showBasicFunctionalityModal,
    forgottenPassword,
    swapsEnabled,
    shouldShowSeedPhraseReminder,
    isPopup,
    isNotification,
    dataCollectionForMarketing,
    selectedAddress,
    totalUnapprovedCount,
    participateInMetaMetrics,
    hasApprovalFlows: getApprovalFlows(state)?.length > 0,
    connectedStatusPopoverHasBeenShown,
    defaultHomeActiveTabName,
    firstTimeFlowType,
    completedOnboarding,
    haveSwapsQuotes: Boolean(Object.values(swapsState.quotes || {}).length),
    swapsFetchParams: swapsState.fetchParams,
    showAwaitingSwapScreen: swapsState.routeState === 'awaiting',
    haveBridgeQuotes: Boolean(Object.values(quotes || {}).length),
    isMainnet: getIsMainnet(state),
    originOfCurrentTab,
    shouldShowWeb3ShimUsageNotification,
    pendingApprovals,
    infuraBlocked: getInfuraBlocked(state),
    announcementsToShow: getSortedAnnouncementsToShow(state).length > 0,
    showWhatsNewPopup,
    showRecoveryPhraseReminder: getShowRecoveryPhraseReminder(state),
    showTermsOfUsePopup: getShowTermsOfUse(state),
    showOutdatedBrowserWarning:
      getIsBrowserDeprecated() && getShowOutdatedBrowserWarning(state),
    seedPhraseBackedUp,
    newNetworkAddedName: getNewNetworkAdded(state),
    editedNetwork: getEditedNetwork(state),
    isSigningQRHardwareTransaction: getIsSigningQRHardwareTransaction(state),
    newNftAddedMessage: getNewNftAddedMessage(state),
    removeNftMessage: getRemoveNftMessage(state),
    newTokensImported: getNewTokensImported(state),
    newTokensImportedError: getNewTokensImportedError(state),
    newNetworkAddedConfigurationId: appState.newNetworkAddedConfigurationId,
    onboardedInThisUISession: appState.onboardedInThisUISession,
    hasAllowedPopupRedirectApprovals,
    showMultiRpcModal: state.metamask.preferences.showMultiRpcModal,
    showUpdateModal: getShowUpdateModal(state),
    redirectAfterDefaultPage,
    isSeedlessPasswordOutdated: getIsSeedlessPasswordOutdated(state),
    isPrimarySeedPhraseBackedUp: getIsPrimarySeedPhraseBackedUp(state),
    showConnectionsRemovedModal: getShowConnectionsRemovedModal(state),
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setDataCollectionForMarketing: (val) =>
      dispatch(setDataCollectionForMarketing(val)),
    attemptCloseNotificationPopup: () => attemptCloseNotificationPopup(),
    setConnectedStatusPopoverHasBeenShown: () =>
      dispatch(setConnectedStatusPopoverHasBeenShown()),
    onTabClick: (name) => dispatch(setDefaultHomeActiveTabName(name)),
    setWeb3ShimUsageAlertDismissed: (origin) =>
      setWeb3ShimUsageAlertDismissed(origin),
    disableWeb3ShimUsageAlert: () =>
      setAlertEnabledness(AlertTypes.web3ShimUsage, false),
    hideWhatsNewPopup: () => dispatch(hideWhatsNewPopup()),
    setRecoveryPhraseReminderHasBeenShown: () =>
      dispatch(setRecoveryPhraseReminderHasBeenShown()),
    setRecoveryPhraseReminderLastShown: (lastShown) =>
      dispatch(setRecoveryPhraseReminderLastShown(lastShown)),
    setTermsOfUseLastAgreed: (lastAgreed) => {
      dispatch(setTermsOfUseLastAgreed(lastAgreed));
    },
    setOutdatedBrowserWarningLastShown: (lastShown) => {
      dispatch(setOutdatedBrowserWarningLastShown(lastShown));
    },
    setNewNftAddedMessage: (message) => {
      dispatch(setRemoveNftMessage(''));
      dispatch(setNewNftAddedMessage(message));
    },
    setRemoveNftMessage: (message) => {
      dispatch(setNewNftAddedMessage(''));
      dispatch(setRemoveNftMessage(message));
    },
    setNewTokensImported: (newTokens) => {
      dispatch(setNewTokensImported(newTokens));
    },
    setNewTokensImportedError: (msg) => {
      dispatch(setNewTokensImportedError(msg));
    },
    clearNewNetworkAdded: () => {
      dispatch(setNewNetworkAdded({}));
    },
    clearEditedNetwork: () => {
      dispatch(setEditedNetwork());
    },
    setActiveNetwork: (networkConfigurationId) => {
      dispatch(setActiveNetwork(networkConfigurationId));
    },
    setBasicFunctionalityModalOpen: () =>
      dispatch(openBasicFunctionalityModal()),
    fetchBuyableChains: () => dispatch(fetchBuyableChains()),
    clearRedirectAfterDefaultPage: () =>
      dispatch(clearRedirectAfterDefaultPage()),
    setAccountDetailsAddress: (address) =>
      dispatch(setAccountDetailsAddress(address)),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(Home);
