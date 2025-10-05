import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  useNavigate,
  useLocation,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom-v5-compat';
import { useNavState } from '../../contexts/navigation-state';
import {
  ///: BEGIN:ONLY_INCLUDE_IF(build-main)
  MetaMetricsContextProp,
  ///: END:ONLY_INCLUDE_IF
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import TermsOfUsePopup from '../../components/app/terms-of-use-popup';
import RecoveryPhraseReminder from '../../components/app/recovery-phrase-reminder';
import WhatsNewModal from '../../components/app/whats-new-modal';
import { FirstTimeFlowType } from '../../../shared/constants/onboarding';
import HomeNotification from '../../components/app/home-notification';
import MultipleNotifications from '../../components/app/multiple-notifications';
import Typography from '../../components/ui/typography/typography';
import Button from '../../components/ui/button';
import Popover from '../../components/ui/popover';
import ConnectedSites from '../connected-sites';
import ConnectedAccounts from '../connected-accounts';
import { isMv3ButOffscreenDocIsMissing } from '../../../shared/modules/mv3.utils';
import ActionableMessage from '../../components/ui/actionable-message/actionable-message';

import {
  FontWeight,
  Display,
  TextColor,
  TextVariant,
  FlexDirection,
  BlockSize,
  AlignItems,
  JustifyContent,
} from '../../helpers/constants/design-system';
import { SECOND } from '../../../shared/constants/time';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Box,
  Text,
  Icon,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '../../components/component-library';
import MultiRpcEditModal from '../../components/app/multi-rpc-edit-modal/multi-rpc-edit-modal';
import UpdateModal from '../../components/app/update-modal/update-modal';
import {
  RESTORE_VAULT_ROUTE,
  CONNECTED_ROUTE,
  CONNECTED_ACCOUNTS_ROUTE,
  AWAITING_SWAP_ROUTE,
  PREPARE_SWAP_ROUTE,
  CROSS_CHAIN_SWAP_ROUTE,
  ONBOARDING_REVIEW_SRP_ROUTE,
} from '../../helpers/constants/routes';
import ZENDESK_URLS from '../../helpers/constants/zendesk-url';
import { METAMETRICS_SETTINGS_LINK } from '../../helpers/constants/common';
import {
  ///: BEGIN:ONLY_INCLUDE_IF(build-main)
  SUPPORT_LINK,
  ///: END:ONLY_INCLUDE_IF
} from '../../../shared/lib/ui-utils';
import { AccountOverview } from '../../components/multichain/account-overview';
import { navigateToConfirmation } from '../confirmations/hooks/useConfirmationNavigation';
import PasswordOutdatedModal from '../../components/app/password-outdated-modal';
import ConnectionsRemovedModal from '../../components/app/connections-removed-modal';
import ShieldEntryModal from '../../components/app/shield-entry-modal';
import { useI18nContext } from '../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../contexts/metametrics';
import {
  activeTabHasPermissions,
  getUseExternalServices,
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
  getShowUpdateModal,
  getShowConnectionsRemovedModal,
  getIsSocialLoginFlow,
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
  lookupSelectedNetworks,
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
///: BEGIN:ONLY_INCLUDE_IF(build-beta)
import BetaHomeFooter from './beta/beta-home-footer.component';
///: END:ONLY_INCLUDE_IF
///: BEGIN:ONLY_INCLUDE_IF(build-flask)
import FlaskHomeFooter from './flask/flask-home-footer.component';
///: END:ONLY_INCLUDE_IF

function shouldCloseNotificationPopup({
  isNotification,
  totalUnapprovedCount,
  hasApprovalFlows,
  isSigningQRHardwareTransaction,
}) {
  const shouldClose =
    isNotification &&
    totalUnapprovedCount === 0 &&
    !hasApprovalFlows &&
    !isSigningQRHardwareTransaction;

  return shouldClose;
}

function Home() {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const navigate = useNavigate();
  const location = useLocation();
  const navState = useNavState();
  const dispatch = useDispatch();

  // Redux selectors - equivalent to mapStateToProps
  const { metamask, appState } = useSelector((state) => state);
  const {
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

  const selectedAccount = useSelector(getSelectedInternalAccount);
  const totalUnapprovedCount = useSelector(getTotalUnapprovedCount);
  const pendingApprovals = useSelector(selectPendingApprovalsForNavigation);
  const redirectAfterDefaultPage = useSelector(getRedirectAfterDefaultPage);

  const envType = getEnvironmentType();
  const isPopup = envType === ENVIRONMENT_TYPE_POPUP;
  const isNotification = envType === ENVIRONMENT_TYPE_NOTIFICATION;

  const originOfCurrentTab = useSelector(getOriginOfCurrentTab);
  const web3ShimUsageAlertEnabledness = useSelector(
    getWeb3ShimUsageAlertEnabledness,
  );
  const activeTabPermissions = useSelector(activeTabHasPermissions);
  const web3ShimUsageState = useSelector((state) =>
    getWeb3ShimUsageStateForOrigin(state, originOfCurrentTab),
  );
  const shouldShowWeb3ShimUsageNotification =
    isPopup &&
    web3ShimUsageAlertEnabledness &&
    activeTabPermissions &&
    web3ShimUsageState === Web3ShimUsageAlertStates.recorded;

  const hasAllowedPopupRedirectApprovals = useSelector((state) =>
    hasPendingApprovals(state, [
      ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
      SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountCreation,
      SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountRemoval,
      SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showNameSnapAccount,
      SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showSnapAccountRedirect,
      ///: END:ONLY_INCLUDE_IF
    ]),
  );

  const TEMPORARY_DISABLE_WHATS_NEW = true;
  const showWhatsNewPopupSelector = useSelector(getShowWhatsNewPopup);
  const showWhatsNewPopup = TEMPORARY_DISABLE_WHATS_NEW
    ? false
    : showWhatsNewPopupSelector;

  const shouldShowSeedPhraseReminderSelector = useSelector((state) =>
    getShouldShowSeedPhraseReminder(state, selectedAccount),
  );
  const shouldShowSeedPhraseReminder =
    selectedAccount && shouldShowSeedPhraseReminderSelector;

  // All other selectors
  const useExternalServices = useSelector(getUseExternalServices);
  const hasApprovalFlows = useSelector(
    (state) => getApprovalFlows(state)?.length > 0,
  );
  const haveSwapsQuotes = Boolean(
    Object.values(swapsState.quotes || {}).length,
  );
  const swapsFetchParams = swapsState.fetchParams;
  const showAwaitingSwapScreen = swapsState.routeState === 'awaiting';
  const haveBridgeQuotes = Boolean(Object.values(quotes || {}).length);
  const infuraBlocked = useSelector(getInfuraBlocked);
  const announcementsToShow = useSelector(
    (state) => getSortedAnnouncementsToShow(state).length > 0,
  );
  const showRecoveryPhraseReminder = useSelector(getShowRecoveryPhraseReminder);
  const showTermsOfUsePopup = useSelector(getShowTermsOfUse);
  const showOutdatedBrowserWarningSelector = useSelector(
    getShowOutdatedBrowserWarning,
  );
  const showOutdatedBrowserWarning =
    getIsBrowserDeprecated() && showOutdatedBrowserWarningSelector;
  const newNetworkAddedName = useSelector(getNewNetworkAdded);
  const editedNetwork = useSelector(getEditedNetwork);
  const isSigningQRHardwareTransaction = useSelector(
    getIsSigningQRHardwareTransaction,
  );
  const newNftAddedMessage = useSelector(getNewNftAddedMessage);
  const removeNftMessage = useSelector(getRemoveNftMessage);
  const newTokensImported = useSelector(getNewTokensImported);
  const newTokensImportedError = useSelector(getNewTokensImportedError);
  const { newNetworkAddedConfigurationId, onboardedInThisUISession } = appState;
  const { showMultiRpcModal } = metamask.preferences;
  const showUpdateModal = useSelector(getShowUpdateModal);
  const isSeedlessPasswordOutdated = useSelector(getIsSeedlessPasswordOutdated);
  const isPrimarySeedPhraseBackedUp = useSelector(
    getIsPrimarySeedPhraseBackedUp,
  );
  const showConnectionsRemovedModal = useSelector(
    getShowConnectionsRemovedModal,
  );
  const showShieldEntryModal = false; // TODO: integrate condition to show shield entry modal
  const isSocialLoginFlow = useSelector(getIsSocialLoginFlow);

  // Dispatch functions - equivalent to mapDispatchToProps
  const dispatchSetDataCollectionForMarketing = useCallback(
    (val) => dispatch(setDataCollectionForMarketing(val)),
    [dispatch],
  );
  const dispatchAttemptCloseNotificationPopup = useCallback(
    () => dispatch(attemptCloseNotificationPopup()),
    [dispatch],
  );
  const dispatchSetConnectedStatusPopoverHasBeenShown = useCallback(
    () => dispatch(setConnectedStatusPopoverHasBeenShown()),
    [dispatch],
  );
  const onTabClick = useCallback(
    (name) => dispatch(setDefaultHomeActiveTabName(name)),
    [dispatch],
  );
  const dispatchSetWeb3ShimUsageAlertDismissed = useCallback(
    (origin) => dispatch(setWeb3ShimUsageAlertDismissed(origin)),
    [dispatch],
  );
  const disableWeb3ShimUsageAlert = useCallback(
    () => dispatch(setAlertEnabledness(AlertTypes.web3ShimUsage, false)),
    [dispatch],
  );
  const dispatchHideWhatsNewPopup = useCallback(
    () => dispatch(hideWhatsNewPopup()),
    [dispatch],
  );
  const dispatchSetRecoveryPhraseReminderHasBeenShown = useCallback(
    () => dispatch(setRecoveryPhraseReminderHasBeenShown()),
    [dispatch],
  );
  const dispatchSetRecoveryPhraseReminderLastShown = useCallback(
    (lastShown) => dispatch(setRecoveryPhraseReminderLastShown(lastShown)),
    [dispatch],
  );
  const dispatchSetTermsOfUseLastAgreed = useCallback(
    (lastAgreed) => dispatch(setTermsOfUseLastAgreed(lastAgreed)),
    [dispatch],
  );
  const dispatchSetOutdatedBrowserWarningLastShown = useCallback(
    (lastShown) => dispatch(setOutdatedBrowserWarningLastShown(lastShown)),
    [dispatch],
  );
  const dispatchSetNewNftAddedMessage = useCallback(
    (message) => {
      dispatch(setRemoveNftMessage(''));
      dispatch(setNewNftAddedMessage(message));
    },
    [dispatch],
  );
  const dispatchSetRemoveNftMessage = useCallback(
    (message) => {
      dispatch(setNewNftAddedMessage(''));
      dispatch(setRemoveNftMessage(message));
    },
    [dispatch],
  );
  const dispatchSetNewTokensImported = useCallback(
    (newTokens) => dispatch(setNewTokensImported(newTokens)),
    [dispatch],
  );
  const dispatchSetNewTokensImportedError = useCallback(
    (msg) => dispatch(setNewTokensImportedError(msg)),
    [dispatch],
  );
  const clearNewNetworkAdded = useCallback(
    () => dispatch(setNewNetworkAdded({})),
    [dispatch],
  );
  const clearEditedNetwork = useCallback(
    () => dispatch(setEditedNetwork()),
    [dispatch],
  );
  const dispatchSetActiveNetwork = useCallback(
    (networkConfigurationId) =>
      dispatch(setActiveNetwork(networkConfigurationId)),
    [dispatch],
  );
  const setBasicFunctionalityModalOpen = useCallback(
    () => dispatch(openBasicFunctionalityModal()),
    [dispatch],
  );
  const dispatchFetchBuyableChains = useCallback(
    () => dispatch(fetchBuyableChains()),
    [dispatch],
  );
  const dispatchClearRedirectAfterDefaultPage = useCallback(
    () => dispatch(clearRedirectAfterDefaultPage()),
    [dispatch],
  );
  const dispatchSetAccountDetailsAddress = useCallback(
    (address) => dispatch(setAccountDetailsAddress(address)),
    [dispatch],
  );
  const dispatchLookupSelectedNetworks = useCallback(
    () => dispatch(lookupSelectedNetworks()),
    [dispatch],
  );

  const [canShowBlockageNotification, setCanShowBlockageNotification] =
    useState(true);
  const [notificationClosing, setNotificationClosing] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // Check both router state (v5 fallback) and navigation context (v5-compat with HashRouter)
  const stayOnHomePage = Boolean(
    location?.state?.stayOnHomePage || navState?.stayOnHomePage,
  );

  const checkStatusAndNavigate = useCallback(() => {
    const canRedirect = !isNotification && !stayOnHomePage;
    if (canRedirect && showAwaitingSwapScreen) {
      navigate(AWAITING_SWAP_ROUTE);
    } else if (canRedirect && (haveSwapsQuotes || swapsFetchParams)) {
      navigate(PREPARE_SWAP_ROUTE);
    } else if (canRedirect && haveBridgeQuotes) {
      navigate(CROSS_CHAIN_SWAP_ROUTE + PREPARE_SWAP_ROUTE);
    } else if (pendingApprovals.length || hasApprovalFlows) {
      navigateToConfirmation(
        pendingApprovals?.[0]?.id,
        pendingApprovals,
        hasApprovalFlows,
        navigate,
      );
    }
  }, [
    isNotification,
    stayOnHomePage,
    showAwaitingSwapScreen,
    haveSwapsQuotes,
    swapsFetchParams,
    haveBridgeQuotes,
    pendingApprovals,
    hasApprovalFlows,
    navigate,
  ]);

  const checkRedirectAfterDefaultPage = useCallback(() => {
    if (
      redirectAfterDefaultPage?.shouldRedirect &&
      redirectAfterDefaultPage?.path
    ) {
      // Set the account details address if provided
      if (redirectAfterDefaultPage?.address) {
        dispatchSetAccountDetailsAddress(redirectAfterDefaultPage.address);
      }

      navigate(redirectAfterDefaultPage.path);
      dispatchClearRedirectAfterDefaultPage();
    }
  }, [
    redirectAfterDefaultPage,
    navigate,
    dispatchClearRedirectAfterDefaultPage,
    dispatchSetAccountDetailsAddress,
  ]);

  // Initialize state based on props
  useEffect(() => {
    const shouldClose = shouldCloseNotificationPopup({
      isNotification,
      totalUnapprovedCount,
      hasApprovalFlows,
      isSigningQRHardwareTransaction,
    });

    if (shouldClose) {
      setNotificationClosing(true);
      dispatchAttemptCloseNotificationPopup();
    } else if (
      pendingApprovals.length ||
      (!isNotification &&
        !stayOnHomePage &&
        (showAwaitingSwapScreen ||
          haveSwapsQuotes ||
          swapsFetchParams ||
          haveBridgeQuotes))
    ) {
      setRedirecting(true);
    }
  }, [
    isNotification,
    totalUnapprovedCount,
    hasApprovalFlows,
    isSigningQRHardwareTransaction,
    pendingApprovals.length,
    stayOnHomePage,
    showAwaitingSwapScreen,
    haveSwapsQuotes,
    swapsFetchParams,
    haveBridgeQuotes,
    dispatchAttemptCloseNotificationPopup,
  ]);

  // Component did mount equivalent
  useEffect(() => {
    checkStatusAndNavigate();
    dispatchFetchBuyableChains();
    checkRedirectAfterDefaultPage();
    dispatchLookupSelectedNetworks();
  }, [
    checkStatusAndNavigate,
    dispatchFetchBuyableChains,
    checkRedirectAfterDefaultPage,
    dispatchLookupSelectedNetworks,
  ]);

  // Handle notification closing
  useEffect(() => {
    const shouldClose = shouldCloseNotificationPopup({
      isNotification,
      totalUnapprovedCount,
      hasApprovalFlows,
      isSigningQRHardwareTransaction,
    });

    if (shouldClose) {
      setNotificationClosing(true);
    }
  }, [
    isNotification,
    totalUnapprovedCount,
    hasApprovalFlows,
    isSigningQRHardwareTransaction,
  ]);

  // Handle component updates
  useEffect(() => {
    if (notificationClosing) {
      dispatchAttemptCloseNotificationPopup();
    } else if (isNotification || hasAllowedPopupRedirectApprovals) {
      checkStatusAndNavigate();
    }

    checkRedirectAfterDefaultPage();
  }, [
    notificationClosing,
    isNotification,
    hasAllowedPopupRedirectApprovals,
    checkStatusAndNavigate,
    checkRedirectAfterDefaultPage,
    dispatchAttemptCloseNotificationPopup,
  ]);

  // Handle network changes
  useEffect(() => {
    if (newNetworkAddedConfigurationId) {
      dispatchSetActiveNetwork(newNetworkAddedConfigurationId);
      clearNewNetworkAdded();
    }
  }, [
    newNetworkAddedConfigurationId,
    dispatchSetActiveNetwork,
    clearNewNetworkAdded,
  ]);

  const onRecoveryPhraseReminderClose = useCallback(() => {
    dispatchSetRecoveryPhraseReminderHasBeenShown(true);
    dispatchSetRecoveryPhraseReminderLastShown(new Date().getTime());
  }, [
    dispatchSetRecoveryPhraseReminderHasBeenShown,
    dispatchSetRecoveryPhraseReminderLastShown,
  ]);

  const onAcceptTermsOfUse = useCallback(() => {
    dispatchSetTermsOfUseLastAgreed(new Date().getTime());
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.TermsOfUseAccepted,
      properties: {
        location: 'Terms Of Use Popover',
      },
    });
  }, [dispatchSetTermsOfUseLastAgreed, trackEvent]);

  ///: BEGIN:ONLY_INCLUDE_IF(build-main)
  const onSupportLinkClick = useCallback(() => {
    trackEvent(
      {
        category: MetaMetricsEventCategory.Home,
        event: MetaMetricsEventName.SupportLinkClicked,
        properties: {
          url: SUPPORT_LINK,
        },
      },
      {
        contextPropsIntoEventProperties: [MetaMetricsContextProp.PageTitle],
      },
    );
  }, [trackEvent]);
  ///: END:ONLY_INCLUDE_IF

  const onOutdatedBrowserWarningClose = useCallback(() => {
    dispatchSetOutdatedBrowserWarningLastShown(new Date().getTime());
  }, [dispatchSetOutdatedBrowserWarningLastShown]);

  const renderNotifications = () => {
    const onAutoHide = () => {
      dispatchSetNewNftAddedMessage('');
      dispatchSetRemoveNftMessage('');
      dispatchSetNewTokensImported(''); // Added this so we don't see the notif if user does not close it
      dispatchSetNewTokensImportedError('');
      clearEditedNetwork();
    };

    const autoHideDelay = 5 * SECOND;

    const outdatedBrowserNotificationDescriptionText =
      isMv3ButOffscreenDocIsMissing ? (
        <div>
          <Text>{t('outdatedBrowserNotification')}</Text>
          <br />
          <Text fontWeight={FontWeight.Bold} color={TextColor.warningDefault}>
            {t('noHardwareWalletOrSnapsSupport')}
          </Text>
        </div>
      ) : (
        t('outdatedBrowserNotification')
      );

    const items = [
      newNftAddedMessage === 'success' ? (
        <ActionableMessage
          key="new-nft-added"
          type="success"
          className="home__new-network-notification"
          autoHideTime={autoHideDelay}
          onAutoHide={onAutoHide}
          message={
            <Box display={Display.InlineFlex}>
              <i className="fa fa-check-circle home__new-nft-notification-icon" />
              <Text variant={TextVariant.bodySm} as="h6">
                {t('newNftAddedMessage')}
              </Text>
              <ButtonIcon
                iconName={IconName.Close}
                size={ButtonIconSize.Sm}
                ariaLabel={t('close')}
                onClick={onAutoHide}
              />
            </Box>
          }
        />
      ) : null,
      removeNftMessage === 'success' ? (
        <ActionableMessage
          key="remove-nft"
          type="success"
          className="home__new-network-notification"
          autoHideTime={autoHideDelay}
          onAutoHide={onAutoHide}
          message={
            <Box display={Display.InlineFlex}>
              <i className="fa fa-check-circle home__new-nft-notification-icon" />
              <Text variant={TextVariant.bodySm} as="h6">
                {t('removeNftMessage')}
              </Text>
              <ButtonIcon
                iconName={IconName.Close}
                size={ButtonIconSize.Sm}
                ariaLabel={t('close')}
                onClick={onAutoHide}
              />
            </Box>
          }
        />
      ) : null,
      removeNftMessage === 'error' ? (
        <ActionableMessage
          key="remove-nft-error"
          type="danger"
          className="home__new-network-notification"
          autoHideTime={autoHideDelay}
          onAutoHide={onAutoHide}
          message={
            <Box display={Display.InlineFlex}>
              <i className="fa fa-check-circle home__new-nft-notification-icon" />
              <Text variant={TextVariant.bodySm} as="h6">
                {t('removeNftErrorMessage')}
              </Text>
              <ButtonIcon
                iconName={IconName.Close}
                size={ButtonIconSize.Sm}
                ariaLabel={t('close')}
                onClick={onAutoHide}
              />
            </Box>
          }
        />
      ) : null,
      newNetworkAddedName ? (
        <ActionableMessage
          key="new-network-added"
          type="success"
          className="home__new-network-notification"
          message={
            <Box display={Display.InlineFlex}>
              <i className="fa fa-check-circle home__new-network-notification-icon" />
              <Text variant={TextVariant.bodySm} as="h6">
                {t('newNetworkAdded', [newNetworkAddedName])}
              </Text>
              <ButtonIcon
                iconName={IconName.Close}
                size={ButtonIconSize.Sm}
                ariaLabel={t('close')}
                onClick={() => clearNewNetworkAdded()}
                className="home__new-network-notification-close"
              />
            </Box>
          }
        />
      ) : null,
      editedNetwork?.editCompleted ? (
        <ActionableMessage
          key="edited-network"
          type="success"
          className="home__new-tokens-imported-notification"
          autoHideTime={autoHideDelay}
          onAutoHide={onAutoHide}
          message={
            <Box display={Display.InlineFlex}>
              <i className="fa fa-check-circle home__new-network-notification-icon" />
              <Text variant={TextVariant.bodySm} as="h6">
                {editedNetwork.newNetwork
                  ? t('newNetworkAdded', [editedNetwork.nickname])
                  : t('newNetworkEdited', [editedNetwork.nickname])}
              </Text>
              <ButtonIcon
                iconName={IconName.Close}
                size={ButtonIconSize.Sm}
                ariaLabel={t('close')}
                onClick={() => clearEditedNetwork()}
                className="home__new-network-notification-close"
              />
            </Box>
          }
        />
      ) : null,
      newTokensImported ? (
        <ActionableMessage
          key="new-tokens-imported"
          type="success"
          autoHideTime={autoHideDelay}
          onAutoHide={onAutoHide}
          className="home__new-tokens-imported-notification"
          message={
            <Box display={Display.InlineFlex}>
              <i className="fa fa-check-circle home__new-tokens-imported-notification-icon" />
              <Box>
                <Text
                  className="home__new-tokens-imported-notification-title"
                  variant={TextVariant.bodySmBold}
                  as="h6"
                >
                  {t('newTokensImportedTitle')}
                </Text>
                <Text
                  className="home__new-tokens-imported-notification-message"
                  variant={TextVariant.bodySm}
                  as="h6"
                >
                  {t('newTokensImportedMessage', [newTokensImported])}
                </Text>
              </Box>

              <ButtonIcon
                iconName={IconName.Close}
                size={ButtonIconSize.Sm}
                ariaLabel={t('close')}
                onClick={() => dispatchSetNewTokensImported('')}
                className="home__new-tokens-imported-notification-close"
              />
            </Box>
          }
        />
      ) : null,
      newTokensImportedError ? (
        <ActionableMessage
          key="new-tokens-imported-error"
          type="danger"
          className="home__new-tokens-imported-notification"
          autoHideTime={autoHideDelay}
          onAutoHide={onAutoHide}
          message={
            <Box display={Display.InlineFlex}>
              <Icon name={IconName.Danger} />
              <Text variant={TextVariant.bodySm} as="h6">
                {t('importTokensError')}
              </Text>
              <ButtonIcon
                iconName={IconName.Close}
                size={ButtonIconSize.Sm}
                ariaLabel={t('close')}
                onClick={onAutoHide}
              />
            </Box>
          }
        />
      ) : null,
      shouldShowWeb3ShimUsageNotification ? (
        <HomeNotification
          key="show-web3-shim"
          descriptionText={t('web3ShimUsageNotification', [
            <span
              key="web3ShimUsageNotificationLink"
              className="home-notification__text-link"
              onClick={() =>
                global.platform.openTab({ url: ZENDESK_URLS.LEGACY_WEB3 })
              }
            >
              {t('here')}
            </span>,
          ])}
          ignoreText={t('dismiss')}
          onIgnore={(disable) => {
            dispatchSetWeb3ShimUsageAlertDismissed(originOfCurrentTab);
            if (disable) {
              disableWeb3ShimUsageAlert();
            }
          }}
          checkboxText={t('dontShowThisAgain')}
          checkboxTooltipText={t('canToggleInSettings')}
        />
      ) : null,
      !isPrimarySeedPhraseBackedUp && shouldShowSeedPhraseReminder ? (
        <HomeNotification
          key="show-seed-phrase-reminder"
          descriptionText={t('backupApprovalNotice')}
          acceptText={t('backupNow')}
          onAccept={() => {
            const backUpSRPRoute = `${ONBOARDING_REVIEW_SRP_ROUTE}/?isFromReminder=true`;
            if (isPopup) {
              global.platform.openExtensionInBrowser(backUpSRPRoute);
            } else {
              navigate(backUpSRPRoute);
            }
          }}
          infoText={t('backupApprovalInfo')}
        />
      ) : null,
      infuraBlocked && canShowBlockageNotification ? (
        <HomeNotification
          key="infura-blocked"
          descriptionText={t('infuraBlockedNotification', [
            <span
              key="infuraBlockedNotificationLink"
              className="home-notification__text-link"
              onClick={() =>
                global.platform.openTab({ url: ZENDESK_URLS.INFURA_BLOCKAGE })
              }
            >
              {t('here')}
            </span>,
          ])}
          ignoreText={t('dismiss')}
          onIgnore={() => {
            setCanShowBlockageNotification(false);
          }}
        />
      ) : null,
      showOutdatedBrowserWarning ? (
        <HomeNotification
          key="outdated-browser-notification"
          descriptionText={outdatedBrowserNotificationDescriptionText}
          acceptText={t('gotIt')}
          onAccept={onOutdatedBrowserWarningClose}
        />
      ) : null,
    ].filter(Boolean);

    return items.length ? (
      <MultipleNotifications>{items}</MultipleNotifications>
    ) : null;
  };

  const renderOnboardingPopover = () => {
    const handleClose = () => {
      dispatchSetDataCollectionForMarketing(false);
      trackEvent({
        category: MetaMetricsEventCategory.Home,
        event: MetaMetricsEventName.AnalyticsPreferenceSelected,
        properties: {
          has_marketing_consent: false,
          location: 'marketing_consent_modal',
        },
      });
    };

    const handleConsent = (consent) => {
      dispatchSetDataCollectionForMarketing(consent);
      trackEvent({
        category: MetaMetricsEventCategory.Home,
        event: MetaMetricsEventName.AnalyticsPreferenceSelected,
        properties: {
          has_marketing_consent: consent,
          location: 'marketing_consent_modal',
        },
      });
    };

    return (
      <Modal isOpen onClose={handleClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader
            onClose={handleClose}
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            fontWeight={FontWeight.Bold}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
            gap={4}
            size={18}
            paddingBottom={0}
          >
            {t('onboardedMetametricsTitle')}
          </ModalHeader>
          <ModalBody>
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              gap={2}
              margin={4}
            >
              <Typography>
                {t('onboardedMetametricsParagraph1', [
                  <a
                    href={METAMETRICS_SETTINGS_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    key="retention-link"
                  >
                    {t('onboardedMetametricsLink')}
                  </a>,
                ])}
              </Typography>
              <Typography>{t('onboardedMetametricsParagraph2')}</Typography>
              <ul className="home__onboarding_list">
                <li>{t('onboardedMetametricsKey1')}</li>
                <li>{t('onboardedMetametricsKey2')}</li>
                <li>{t('onboardedMetametricsKey3')}</li>
              </ul>
              <Typography>{t('onboardedMetametricsParagraph3')}</Typography>
            </Box>
          </ModalBody>
          <ModalFooter>
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Row}
              gap={2}
              width={BlockSize.Full}
            >
              <Button type="secondary" onClick={() => handleConsent(false)}>
                {t('onboardedMetametricsDisagree')}
              </Button>
              <Button type="primary" onClick={() => handleConsent(true)}>
                {t('onboardedMetametricsAccept')}
              </Button>
            </Box>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  };

  const renderPopover = () => {
    return (
      <Popover
        title={t('whatsThis')}
        onClose={dispatchSetConnectedStatusPopoverHasBeenShown}
        className="home__connected-status-popover"
        showArrow
        CustomBackground={({ onClose }) => {
          return (
            <div
              className="home__connected-status-popover-bg-container"
              onClick={onClose}
            >
              <div className="home__connected-status-popover-bg" />
            </div>
          );
        }}
        footer={
          <>
            <a
              href={ZENDESK_URLS.USER_GUIDE_DAPPS}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('learnMoreUpperCase')}
            </a>
            <Button
              type="primary"
              onClick={dispatchSetConnectedStatusPopoverHasBeenShown}
            >
              {t('dismiss')}
            </Button>
          </>
        }
      >
        <main className="home__connect-status-text">
          <div>{t('metaMaskConnectStatusParagraphOne')}</div>
          <div>{t('metaMaskConnectStatusParagraphTwo')}</div>
          <div>{t('metaMaskConnectStatusParagraphThree')}</div>
        </main>
      </Popover>
    );
  };

  if (forgottenPassword) {
    return <Navigate to={{ pathname: RESTORE_VAULT_ROUTE }} replace />;
  } else if (notificationClosing || redirecting) {
    return null;
  }

  const canSeeModals =
    completedOnboarding &&
    (!onboardedInThisUISession ||
      firstTimeFlowType === FirstTimeFlowType.import) &&
    !newNetworkAddedConfigurationId;

  const showWhatsNew =
    canSeeModals &&
    announcementsToShow &&
    showWhatsNewPopup &&
    !process.env.IN_TEST;

  const showMultiRpcEditModal =
    canSeeModals && showMultiRpcModal && !showWhatsNew && !process.env.IN_TEST;

  const displayUpdateModal =
    canSeeModals && showUpdateModal && !showWhatsNew && !showMultiRpcEditModal;

  const showTermsOfUse =
    completedOnboarding &&
    !onboardedInThisUISession &&
    showTermsOfUsePopup &&
    !isSocialLoginFlow;

  return (
    <div className="main-container main-container--has-shadow">
      <Routes>
        <Route path={CONNECTED_ROUTE} element={<ConnectedSites />} />
        <Route
          path={CONNECTED_ACCOUNTS_ROUTE}
          element={<ConnectedAccounts />}
        />
      </Routes>
      <div className="home__container">
        {dataCollectionForMarketing === null &&
        participateInMetaMetrics === true
          ? renderOnboardingPopover()
          : null}
        {isSeedlessPasswordOutdated && <PasswordOutdatedModal />}
        {showMultiRpcEditModal && <MultiRpcEditModal />}
        {displayUpdateModal && <UpdateModal />}
        {showWhatsNew ? (
          <WhatsNewModal onClose={dispatchHideWhatsNewPopup} />
        ) : null}
        {!showWhatsNew &&
        showRecoveryPhraseReminder &&
        !isPrimarySeedPhraseBackedUp ? (
          <RecoveryPhraseReminder onConfirm={onRecoveryPhraseReminderClose} />
        ) : null}
        {showTermsOfUse ? (
          <TermsOfUsePopup onAccept={onAcceptTermsOfUse} />
        ) : null}
        {showConnectionsRemovedModal && <ConnectionsRemovedModal />}
        {showShieldEntryModal && (
          <ShieldEntryModal
            onClose={() => {
              // TODO: implement
            }}
            onGetStarted={() => {
              // TODO: implement
            }}
          />
        )}
        {isPopup && !connectedStatusPopoverHasBeenShown
          ? renderPopover()
          : null}
        <div className="home__main-view">
          <AccountOverview
            onTabClick={onTabClick}
            ///: BEGIN:ONLY_INCLUDE_IF(build-main)
            onSupportLinkClick={onSupportLinkClick}
            ///: END:ONLY_INCLUDE_IF
            defaultHomeActiveTabName={defaultHomeActiveTabName}
            useExternalServices={useExternalServices}
            setBasicFunctionalityModalOpen={setBasicFunctionalityModalOpen}
          ></AccountOverview>
          {
            ///: BEGIN:ONLY_INCLUDE_IF(build-beta)
            <div className="home__support">
              <BetaHomeFooter />
            </div>
            ///: END:ONLY_INCLUDE_IF
          }
          {
            ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
            <div className="home__support">
              <FlaskHomeFooter />
            </div>
            ///: END:ONLY_INCLUDE_IF
          }
        </div>
        {renderNotifications()}
      </div>
    </div>
  );
}

export default Home;
