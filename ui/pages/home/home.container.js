import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
import { showCustodianDeepLink } from '@metamask-institutional/extension';
import {
  getMmiPortfolioEnabled,
  getMmiPortfolioUrl,
  getCustodianDeepLink,
  getWaitForConfirmDeepLinkDialog,
} from '../../selectors/institutional/selectors';
import {
  mmiActionsFactory,
  setCustodianDeepLink,
} from '../../store/institutional/institution-background';
import { showCustodyConfirmLink } from '../../store/institutional/institution-actions';
import { getInstitutionalConnectRequests } from '../../ducks/institutional/institutional';
///: END:ONLY_INCLUDE_IF
import {
  activeTabHasPermissions,
  getUseExternalServices,
  getFirstPermissionRequest,
  getFirstSnapInstallOrUpdateRequest,
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
  getIsSigningQRHardwareTransaction,
  getNewNftAddedMessage,
  getNewTokensImported,
  getShouldShowSeedPhraseReminder,
  getRemoveNftMessage,
  getSuggestedTokens,
  getSuggestedNfts,
  getApprovalFlows,
  getNewTokensImportedError,
  hasPendingApprovals,
  getSelectedInternalAccount,
  getQueuedRequestCount,
  getEditedNetwork,
  getPrioritizedUnapprovedTemplatedConfirmations,
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  getAccountType,
  ///: END:ONLY_INCLUDE_IF
} from '../../selectors';
import { getIsSmartTransactionsOptInModalAvailable } from '../../../shared/modules/selectors';

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
  setNewTokensImportedError,
  setDataCollectionForMarketing,
  setEditedNetwork,
} from '../../store/actions';
import {
  hideWhatsNewPopup,
  openBasicFunctionalityModal,
} from '../../ducks/app/app';
import { getWeb3ShimUsageAlertEnabledness } from '../../ducks/metamask/metamask';
import { getSwapsFeatureIsLive } from '../../ducks/swaps/swaps';
import { fetchBuyableChains } from '../../ducks/ramps';
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
import { hasTransactionPendingApprovals } from '../../selectors/transactions';
import { getLocalNetworkMenuRedesignFeatureFlag } from '../../helpers/utils/feature-flags';
import Home from './home.component';

const mapStateToProps = (state) => {
  const { metamask, appState } = state;
  const {
    seedPhraseBackedUp,
    connectedStatusPopoverHasBeenShown,
    defaultHomeActiveTabName,
    swapsState,
    dataCollectionForMarketing,
    participateInMetaMetrics,
    firstTimeFlowType,
    completedOnboarding,
  } = metamask;
  const { address: selectedAddress } = getSelectedInternalAccount(state);
  const { forgottenPassword } = metamask;
  const totalUnapprovedCount = getTotalUnapprovedCount(state);
  const queuedRequestCount = getQueuedRequestCount(state);
  const totalUnapprovedAndQueuedRequestCount =
    totalUnapprovedCount + queuedRequestCount;
  const swapsEnabled = getSwapsFeatureIsLive(state);
  const pendingConfirmations = getUnapprovedTemplatedConfirmations(state);
  const pendingConfirmationsPrioritized =
    getPrioritizedUnapprovedTemplatedConfirmations(state);
  const networkMenuRedesign = getLocalNetworkMenuRedesignFeatureFlag(state);

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

  if (!firstPermissionsRequest) {
    firstPermissionsRequest = getFirstSnapInstallOrUpdateRequest(state);
    firstPermissionsRequestId = firstPermissionsRequest?.metadata.id || null;
  }

  const originOfCurrentTab = getOriginOfCurrentTab(state);
  const shouldShowWeb3ShimUsageNotification =
    isPopup &&
    getWeb3ShimUsageAlertEnabledness(state) &&
    activeTabHasPermissions(state) &&
    getWeb3ShimUsageStateForOrigin(state, originOfCurrentTab) ===
      Web3ShimUsageAlertStates.recorded;

  const hasWatchTokenPendingApprovals = getSuggestedTokens(state).length > 0;

  const hasWatchNftPendingApprovals = getSuggestedNfts(state).length > 0;

  const hasAllowedPopupRedirectApprovals = hasPendingApprovals(state, [
    ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
    SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountCreation,
    SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountRemoval,
    SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showNameSnapAccount,
    SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showSnapAccountRedirect,
    ///: END:ONLY_INCLUDE_IF
  ]);

  const TEMPORARY_DISABLE_WHATS_NEW = true;
  const showWhatsNewPopup = TEMPORARY_DISABLE_WHATS_NEW
    ? false
    : getShowWhatsNewPopup(state);

  return {
    useExternalServices: getUseExternalServices(state),
    isBasicConfigurationModalOpen: appState.showBasicFunctionalityModal,
    forgottenPassword,
    hasWatchTokenPendingApprovals,
    hasWatchNftPendingApprovals,
    swapsEnabled,
    hasTransactionPendingApprovals: hasTransactionPendingApprovals(state),
    shouldShowSeedPhraseReminder: getShouldShowSeedPhraseReminder(state),
    isPopup,
    isNotification,
    dataCollectionForMarketing,
    selectedAddress,
    firstPermissionsRequestId,
    totalUnapprovedCount,
    totalUnapprovedAndQueuedRequestCount,
    participateInMetaMetrics,
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
    pendingConfirmationsPrioritized,
    networkMenuRedesign,
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
    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    waitForConfirmDeepLinkDialog: getWaitForConfirmDeepLinkDialog(state),
    institutionalConnectRequests,
    modalOpen: state.appState.modal.open,
    mmiPortfolioUrl: getMmiPortfolioUrl(state),
    mmiPortfolioEnabled: getMmiPortfolioEnabled(state),
    notificationsToShow: getSortedAnnouncementsToShow(state).length > 0,
    custodianDeepLink: getCustodianDeepLink(state),
    accountType: getAccountType(state),
    ///: END:ONLY_INCLUDE_IF
    isSmartTransactionsOptInModalAvailable:
      getIsSmartTransactionsOptInModalAvailable(state),
  };
};

const mapDispatchToProps = (dispatch) => {
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  const mmiActions = mmiActionsFactory();
  ///: END:ONLY_INCLUDE_IF

  return {
    setDataCollectionForMarketing: (val) =>
      dispatch(setDataCollectionForMarketing(val)),
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
    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    setWaitForConfirmDeepLinkDialog: (wait) =>
      dispatch(mmiActions.setWaitForConfirmDeepLinkDialog(wait)),
    showCustodianDeepLink: ({
      txId = undefined,
      fromAddress,
      custodyId,
      onDeepLinkFetched = () => undefined,
      onDeepLinkShown = () => undefined,
      isSignature = false,
      isNotification = false,
    }) =>
      showCustodianDeepLink({
        dispatch,
        mmiActions,
        txId,
        fromAddress,
        custodyId,
        closeNotification: isNotification,
        onDeepLinkFetched,
        onDeepLinkShown,
        showCustodyConfirmLink,
        isSignature,
      }),
    cleanCustodianDeepLink: () => {
      dispatch(setCustodianDeepLink({}));
    },
    ///: END:ONLY_INCLUDE_IF
    setBasicFunctionalityModalOpen: () =>
      dispatch(openBasicFunctionalityModal()),
    fetchBuyableChains: () => dispatch(fetchBuyableChains()),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(Home);
