import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
import {
  getMmiPortfolioEnabled,
  getMmiPortfolioUrl,
  getWaitForConfirmDeepLinkDialog,
} from '../../selectors/institutional/selectors';
import { mmiActionsFactory } from '../../store/institutional/institution-background';
import { getInstitutionalConnectRequests } from '../../ducks/institutional/institutional';
///: END:ONLY_INCLUDE_IF
import {
  activeTabHasPermissions,
  getFirstPermissionRequest,
  ///: BEGIN:ONLY_INCLUDE_IF(snaps)
  getFirstSnapInstallOrUpdateRequest,
  ///: END:ONLY_INCLUDE_IF
  getIsMainnet,
  getOriginOfCurrentTab,
  getTotalUnapprovedCount,
  getUnapprovedTemplatedConfirmations,
  getWeb3ShimUsageStateForOrigin,
  getInfuraBlocked,
  getShowWhatsNewPopup,
  getSortedAnnouncementsToShow,
  getShowRecoveryPhraseReminder,
  getShowTermsOfUse,
  getShowOutdatedBrowserWarning,
  getNewNetworkAdded,
  hasUnsignedQRHardwareTransaction,
  hasUnsignedQRHardwareMessage,
  getNewNftAddedMessage,
  getNewTokensImported,
  getShouldShowSeedPhraseReminder,
  getRemoveNftMessage,
  getSuggestedTokens,
  getSuggestedNfts,
  getApprovalFlows,
} from '../../selectors';

import {
  closeNotificationPopup,
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
} from '../../store/actions';
import { hideWhatsNewPopup } from '../../ducks/app/app';
import { getWeb3ShimUsageAlertEnabledness } from '../../ducks/metamask/metamask';
import { getSwapsFeatureIsLive } from '../../ducks/swaps/swaps';
import { getEnvironmentType } from '../../../app/scripts/lib/util';
import { getIsBrowserDeprecated } from '../../helpers/utils/util';
import {
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_POPUP,
} from '../../../shared/constants/app';
import {
  AlertTypes,
  Web3ShimUsageAlertStates,
} from '../../../shared/constants/alerts';
import { hasTransactionPendingApprovals } from '../../selectors/transactions';
import Home from './home.component';

const mapStateToProps = (state) => {
  const { metamask, appState } = state;
  const {
    seedPhraseBackedUp,
    selectedAddress,
    connectedStatusPopoverHasBeenShown,
    defaultHomeActiveTabName,
    swapsState,
    firstTimeFlowType,
    completedOnboarding,
  } = metamask;
  const { forgottenPassword } = metamask;
  const totalUnapprovedCount = getTotalUnapprovedCount(state);
  const swapsEnabled = getSwapsFeatureIsLive(state);
  const pendingConfirmations = getUnapprovedTemplatedConfirmations(state);
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  const institutionalConnectRequests = getInstitutionalConnectRequests(state);
  ///: END:ONLY_INCLUDE_IF

  const envType = getEnvironmentType();
  const isPopup = envType === ENVIRONMENT_TYPE_POPUP;
  const isNotification = envType === ENVIRONMENT_TYPE_NOTIFICATION;

  let firstPermissionsRequest, firstPermissionsRequestId;
  firstPermissionsRequest = getFirstPermissionRequest(state);
  firstPermissionsRequestId = firstPermissionsRequest?.metadata.id || null;

  // getFirstPermissionRequest should be updated with snap update logic once we hit main extension release

  ///: BEGIN:ONLY_INCLUDE_IF(snaps)
  if (!firstPermissionsRequest) {
    firstPermissionsRequest = getFirstSnapInstallOrUpdateRequest(state);
    firstPermissionsRequestId = firstPermissionsRequest?.metadata.id || null;
  }
  ///: END:ONLY_INCLUDE_IF

  const originOfCurrentTab = getOriginOfCurrentTab(state);
  const shouldShowWeb3ShimUsageNotification =
    isPopup &&
    getWeb3ShimUsageAlertEnabledness(state) &&
    activeTabHasPermissions(state) &&
    getWeb3ShimUsageStateForOrigin(state, originOfCurrentTab) ===
      Web3ShimUsageAlertStates.recorded;

  const isSigningQRHardwareTransaction =
    hasUnsignedQRHardwareTransaction(state) ||
    hasUnsignedQRHardwareMessage(state);

  const hasWatchTokenPendingApprovals = getSuggestedTokens(state).length > 0;

  const hasWatchNftPendingApprovals = getSuggestedNfts(state).length > 0;

  return {
    forgottenPassword,
    hasWatchTokenPendingApprovals,
    hasWatchNftPendingApprovals,
    swapsEnabled,
    hasTransactionPendingApprovals: hasTransactionPendingApprovals(state),
    shouldShowSeedPhraseReminder: getShouldShowSeedPhraseReminder(state),
    isPopup,
    isNotification,
    selectedAddress,
    firstPermissionsRequestId,
    totalUnapprovedCount,
    hasApprovalFlows: getApprovalFlows(state)?.length > 0,
    connectedStatusPopoverHasBeenShown,
    defaultHomeActiveTabName,
    firstTimeFlowType,
    completedOnboarding,
    haveSwapsQuotes: Boolean(Object.values(swapsState.quotes || {}).length),
    swapsFetchParams: swapsState.fetchParams,
    showAwaitingSwapScreen: swapsState.routeState === 'awaiting',
    isMainnet: getIsMainnet(state),
    originOfCurrentTab,
    shouldShowWeb3ShimUsageNotification,
    pendingConfirmations,
    infuraBlocked: getInfuraBlocked(state),
    announcementsToShow: getSortedAnnouncementsToShow(state).length > 0,
    showWhatsNewPopup: getShowWhatsNewPopup(state),
    showRecoveryPhraseReminder: getShowRecoveryPhraseReminder(state),
    showTermsOfUsePopup: getShowTermsOfUse(state),
    showOutdatedBrowserWarning:
      getIsBrowserDeprecated() && getShowOutdatedBrowserWarning(state),
    seedPhraseBackedUp,
    newNetworkAddedName: getNewNetworkAdded(state),
    isSigningQRHardwareTransaction,
    newNftAddedMessage: getNewNftAddedMessage(state),
    removeNftMessage: getRemoveNftMessage(state),
    newTokensImported: getNewTokensImported(state),
    newNetworkAddedConfigurationId: appState.newNetworkAddedConfigurationId,
    onboardedInThisUISession: appState.onboardedInThisUISession,
    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    waitForConfirmDeepLinkDialog: getWaitForConfirmDeepLinkDialog(state),
    institutionalConnectRequests,
    modalOpen: state.appState.modal.open,
    mmiPortfolioUrl: getMmiPortfolioUrl(state),
    mmiPortfolioEnabled: getMmiPortfolioEnabled(state),
    notificationsToShow: getSortedAnnouncementsToShow(state).length > 0,
    ///: END:ONLY_INCLUDE_IF
  };
};

const mapDispatchToProps = (dispatch) => {
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  const mmiActions = mmiActionsFactory();
  ///: END:ONLY_INCLUDE_IF

  return {
    closeNotificationPopup: () => closeNotificationPopup(),
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
    clearNewNetworkAdded: () => {
      dispatch(setNewNetworkAdded({}));
    },
    setActiveNetwork: (networkConfigurationId) => {
      dispatch(setActiveNetwork(networkConfigurationId));
    },
    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    setWaitForConfirmDeepLinkDialog: (wait) =>
      dispatch(mmiActions.setWaitForConfirmDeepLinkDialog(wait)),
    ///: END:ONLY_INCLUDE_IF
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(Home);
