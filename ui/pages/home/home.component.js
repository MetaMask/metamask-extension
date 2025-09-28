import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  useNavigate,
  useLocation,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom-v5-compat';
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
  ONBOARDING_SECURE_YOUR_WALLET_ROUTE,
} from '../../helpers/constants/routes';
import ZENDESK_URLS from '../../helpers/constants/zendesk-url';
import { METAMETRICS_SETTINGS_LINK } from '../../helpers/constants/common';
import {
  ///: BEGIN:ONLY_INCLUDE_IF(build-main)
  SUPPORT_LINK,
  ///: END:ONLY_INCLUDE_IF
} from '../../../shared/lib/ui-utils';
import { AccountOverview } from '../../components/multichain';
import { navigateToConfirmation } from '../confirmations/hooks/useConfirmationNavigation';

// Selectors
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
  getShowUpdateModal,
  getShowConnectionsRemovedModal,
  getIsSocialLoginFlow,
} from '../../selectors';
import { getInfuraBlocked } from '../../../shared/modules/selectors/networks';

// Actions
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
import { fetchBuyableChains } from '../../ducks/ramps';
import {
  getRedirectAfterDefaultPage,
  clearRedirectAfterDefaultPage,
} from '../../ducks/history/history';

// Utils and constants
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
import PasswordOutdatedModal from '../../components/app/password-outdated-modal';
import ConnectionsRemovedModal from '../../components/app/connections-removed-modal';
import ShieldEntryModal from '../../components/app/shield-entry-modal';
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

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const t = useCallback((key, substitutions) => {
    if (global.platform?.t) {
      return global.platform.t(key, substitutions);
    }
    return key;
  }, []);

  const trackEvent = useCallback((event, options) => {
    if (global.platform?.trackEvent) {
      global.platform.trackEvent(event, options);
    }
  }, []);

  const state = useSelector((state) => state);
  const { metamask, appState } = state;
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
  const shouldShowWeb3ShimUsageNotification =
    isPopup &&
    useSelector(getWeb3ShimUsageAlertEnabledness) &&
    useSelector(activeTabHasPermissions) &&
    useSelector((state) =>
      getWeb3ShimUsageStateForOrigin(state, originOfCurrentTab),
    ) === Web3ShimUsageAlertStates.recorded;

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
  const showWhatsNewPopup = TEMPORARY_DISABLE_WHATS_NEW
    ? false
    : useSelector(getShowWhatsNewPopup);

  const shouldShowSeedPhraseReminder =
    selectedAccount &&
    useSelector((state) =>
      getShouldShowSeedPhraseReminder(state, selectedAccount),
    );

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
  const isMainnet = useSelector(getIsMainnet);
  const infuraBlocked = useSelector(getInfuraBlocked);
  const announcementsToShow = useSelector(
    (state) => getSortedAnnouncementsToShow(state).length > 0,
  );
  const showRecoveryPhraseReminder = useSelector(getShowRecoveryPhraseReminder);
  const showTermsOfUsePopup = useSelector(getShowTermsOfUse);
  const showOutdatedBrowserWarning =
    getIsBrowserDeprecated() && useSelector(getShowOutdatedBrowserWarning);
  const newNetworkAddedName = useSelector(getNewNetworkAdded);
  const editedNetwork = useSelector(getEditedNetwork);
  const isSigningQRHardwareTransaction = useSelector(
    getIsSigningQRHardwareTransaction,
  );
  const newNftAddedMessage = useSelector(getNewNftAddedMessage);
  const removeNftMessage = useSelector(getRemoveNftMessage);
  const newTokensImported = useSelector(getNewTokensImported);
  const newTokensImportedError = useSelector(getNewTokensImportedError);
  const { newNetworkAddedConfigurationId } = appState;
  const { onboardedInThisUISession } = appState;
  const { showMultiRpcModal } = state.metamask.preferences;
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

  const onTabClick = useCallback(
    (name) => {
      dispatch(setDefaultHomeActiveTabName(name));
    },
    [dispatch],
  );

  const [canShowBlockageNotification, setCanShowBlockageNotification] =
    useState(true);
  const [notificationClosing, setNotificationClosing] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const initialNavigationAttempted = useRef(false);
  const mountedRef = useRef(false);
  const navigationAttempted = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!initialNavigationAttempted.current && mountedRef.current) {
      initialNavigationAttempted.current = true;

      const stayOnHomePage = Boolean(location?.state?.stayOnHomePage);

      const propsForCheck = {
        isNotification,
        totalUnapprovedCount,
        hasApprovalFlows,
        isSigningQRHardwareTransaction,
      };

      if (shouldCloseNotificationPopup(propsForCheck)) {
        setNotificationClosing(true);
        attemptCloseNotificationPopup();
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
    }
  }, [
    isNotification,
    totalUnapprovedCount,
    hasApprovalFlows,
    isSigningQRHardwareTransaction,
    pendingApprovals,
    showAwaitingSwapScreen,
    haveSwapsQuotes,
    swapsFetchParams,
    haveBridgeQuotes,
    location?.state?.stayOnHomePage,
  ]);

  useEffect(() => {
    if (mountedRef.current) {
      dispatch(fetchBuyableChains());
    }
  }, [dispatch]);

  useEffect(() => {
    const propsForCheck = {
      isNotification,
      totalUnapprovedCount,
      hasApprovalFlows,
      isSigningQRHardwareTransaction,
    };

    if (shouldCloseNotificationPopup(propsForCheck)) {
      setNotificationClosing(true);
    }
  }, [
    isNotification,
    totalUnapprovedCount,
    hasApprovalFlows,
    isSigningQRHardwareTransaction,
  ]);

  useEffect(() => {
    if (newNetworkAddedConfigurationId) {
      dispatch(setActiveNetwork(newNetworkAddedConfigurationId));
      dispatch(setNewNetworkAdded({}));
    }
  }, [newNetworkAddedConfigurationId, dispatch]);

  useEffect(() => {
    if (notificationClosing) {
      attemptCloseNotificationPopup();
    }
  }, [notificationClosing]);

  useEffect(() => {
    if (
      mountedRef.current &&
      (isNotification || hasAllowedPopupRedirectApprovals)
    ) {
      const stayOnHomePage = Boolean(location?.state?.stayOnHomePage);
      const canRedirect = !isNotification && !stayOnHomePage;

      if (canRedirect && showAwaitingSwapScreen) {
        navigate(AWAITING_SWAP_ROUTE);
      } else if (canRedirect && (haveSwapsQuotes || swapsFetchParams)) {
        navigate(PREPARE_SWAP_ROUTE);
      } else if (canRedirect && haveBridgeQuotes) {
        navigate(CROSS_CHAIN_SWAP_ROUTE + PREPARE_SWAP_ROUTE);
      } else if (pendingApprovals.length || hasApprovalFlows) {
        setTimeout(
          () =>
            navigateToConfirmation(
              pendingApprovals?.[0]?.id,
              pendingApprovals,
              hasApprovalFlows,
              navigate,
            ),
          0,
        );
      }
    }
  }, [
    isNotification,
    hasAllowedPopupRedirectApprovals,
    location?.state?.stayOnHomePage,
    showAwaitingSwapScreen,
    haveSwapsQuotes,
    swapsFetchParams,
    haveBridgeQuotes,
    pendingApprovals,
    hasApprovalFlows,
    navigate,
  ]);

  useEffect(() => {
    if (
      mountedRef.current &&
      redirectAfterDefaultPage?.shouldRedirect &&
      redirectAfterDefaultPage?.path
    ) {
      if (redirectAfterDefaultPage?.address) {
        dispatch(setAccountDetailsAddress(redirectAfterDefaultPage.address));
      }
      setTimeout(() => navigate(redirectAfterDefaultPage.path), 0);
      dispatch(clearRedirectAfterDefaultPage());
    }
  }, [redirectAfterDefaultPage, navigate, dispatch]);

  const onRecoveryPhraseReminderClose = useCallback(() => {
    dispatch(setRecoveryPhraseReminderHasBeenShown(true));
    dispatch(setRecoveryPhraseReminderLastShown(new Date().getTime()));
  }, [dispatch]);

  const onAcceptTermsOfUse = useCallback(() => {
    dispatch(setTermsOfUseLastAgreed(new Date().getTime()));
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.TermsOfUseAccepted,
      properties: {
        location: 'Terms Of Use Popover',
      },
    });
  }, [dispatch, trackEvent]);

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
    dispatch(setOutdatedBrowserWarningLastShown(new Date().getTime()));
  }, [dispatch]);

  const renderNotifications = useCallback(() => {
    const onAutoHide = () => {
      dispatch(setNewNftAddedMessage(''));
      dispatch(setRemoveNftMessage(''));
      dispatch(setNewTokensImported(''));
      dispatch(setNewTokensImportedError(''));
      dispatch(setEditedNetwork());
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
                onClick={() => dispatch(setNewNetworkAdded({}))}
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
                onClick={() => dispatch(setEditedNetwork())}
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
                onClick={() => dispatch(setNewTokensImported(''))}
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
            setWeb3ShimUsageAlertDismissed(originOfCurrentTab);
            if (disable) {
              dispatch(setAlertEnabledness(AlertTypes.web3ShimUsage, false));
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
            const backUpSRPRoute = `${ONBOARDING_SECURE_YOUR_WALLET_ROUTE}/?isFromReminder=true`;
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
            this.setState({
              canShowBlockageNotification: false,
            });
          }}
        />
      ) : null,
      showOutdatedBrowserWarning ? (
        <HomeNotification
          key="outdated-browser-notification"
          descriptionText={outdatedBrowserNotificationDescriptionText}
          acceptText={t('gotIt')}
          onAccept={this.onOutdatedBrowserWarningClose}
        />
      ) : null,
    ].filter(Boolean);

    return items.length ? (
      <MultipleNotifications>{items}</MultipleNotifications>
    ) : null;
  }, [
    dispatch,
    t,
    newNftAddedMessage,
    removeNftMessage,
    newNetworkAddedName,
    editedNetwork,
    newTokensImported,
    newTokensImportedError,
    shouldShowWeb3ShimUsageNotification,
    originOfCurrentTab,
    isPrimarySeedPhraseBackedUp,
    shouldShowSeedPhraseReminder,
    isPopup,
    navigate,
    infuraBlocked,
    canShowBlockageNotification,
    showOutdatedBrowserWarning,
    onOutdatedBrowserWarningClose,
  ]);

  const renderOnboardingPopover = useCallback(() => {
    const handleClose = () => {
      dispatch(setDataCollectionForMarketing(false));
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
      dispatch(setDataCollectionForMarketing(consent));
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
  }, [dispatch, trackEvent, t]);

  const renderPopover = useCallback(() => {
    const handleClose = () => {
      dispatch(setConnectedStatusPopoverHasBeenShown());
    };

    return (
      <Popover
        title={t('whatsThis')}
        onClose={handleClose}
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
            <Button type="primary" onClick={handleClose}>
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
  }, [dispatch, t]);

  if (forgottenPassword) {
    return <Navigate to={RESTORE_VAULT_ROUTE} replace />;
  }

  if (notificationClosing || redirecting) {
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
          <WhatsNewModal onClose={() => dispatch(hideWhatsNewPopup())} />
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
            setBasicFunctionalityModalOpen={() =>
              dispatch(openBasicFunctionalityModal())
            }
          />
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
};

export default Home;
