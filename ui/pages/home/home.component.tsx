import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import {
  Navigate,
  type NavigateFunction,
  type Location as RouterLocation,
} from 'react-router-dom';
import { Text, TextVariant, TextColor } from '@metamask/design-system-react';
import { COHORT_NAMES } from '@metamask/subscription-controller';
import {
  MetaMetricsContextProp,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsUserTrait,
} from '../../../shared/constants/metametrics';
import { wasPerpsUnmountedInAppRecently } from '../../helpers/perps/in-app-leave-marker';
import TermsOfUsePopup from '../../components/app/terms-of-use-popup';
import RecoveryPhraseReminder from '../../components/app/recovery-phrase-reminder';
import { FirstTimeFlowType } from '../../../shared/constants/onboarding';
import HomeNotification from '../../components/app/home-notification';
import MultipleNotifications from '../../components/app/multiple-notifications';
import Button from '../../components/ui/button';
import Popover from '../../components/ui/popover';
// eslint-disable-next-line import-x/no-restricted-paths -- TODO(ADR-0021): route-isolation backlog
import ConnectedSites from '../connected-sites';
// eslint-disable-next-line import-x/no-restricted-paths -- TODO(ADR-0021): route-isolation backlog
import ConnectedAccounts from '../connected-accounts';
import { isMv3ButOffscreenDocIsMissing } from '../../../shared/lib/mv3.utils';
import ActionableMessage from '../../components/ui/actionable-message/actionable-message';
import { ScrollContainer } from '../../contexts/scroll-container';
import {
  FontWeight,
  Display,
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
  Icon,
  Modal,
  ModalBody,
  ModalContent,
  ModalContentSize,
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
  ONBOARDING_REVIEW_SRP_ROUTE,
  PERPS_ROUTE,
  PERPS_REOPEN_TTL_MS,
} from '../../helpers/constants/routes';
import ZENDESK_URLS from '../../helpers/constants/zendesk-url';
import { METAMETRICS_SETTINGS_LINK } from '../../helpers/constants/common';
import { SUPPORT_LINK } from '../../../shared/lib/ui-utils';
import { AccountOverview } from '../../components/multichain';
import PasswordOutdatedModal from '../../components/app/password-outdated-modal';
import ShieldEntryModal from '../../components/app/shield-entry-modal';
import RewardsModal from '../../components/app/rewards/onboarding/RewardsModal';
import { Pna25Modal } from '../../components/app/modals/pna25-modal';
import { DeeplinkQRCode } from '../../components/app/deeplink-qr-code';
import { isBeta, isFlask, isMain } from '../../../shared/lib/build-types';
import { type UITrackEventMethod } from '../../contexts/metametrics';
import BetaAndFlaskHomeFooter from './beta-and-flask-home-footer.component';
import { HomeDeepLinkActions } from './HomeDeepLinkActions';

// ---------------------------------------------------------------------------
// Local types
// ---------------------------------------------------------------------------

type EditedNetwork = {
  editCompleted?: boolean;
  newNetwork?: boolean;
  nickname?: string;
};

type PendingRedirectRoute = {
  path: string;
  search?: string;
  environmentType?: string;
};

type RedirectAfterDefaultPage = {
  shouldRedirect?: boolean;
  path?: string;
};

type LastVisitedPerpsRoute = {
  path: string;
  timestamp: number;
};

type DeepLinkQrCodeData = {
  titleKey: string;
  descriptionKey: string;
  deeplinkUrl: string;
};

type HomeContext = {
  t: (key: string, args?: unknown[]) => string;
  trackEvent: UITrackEventMethod;
};

export type HomeProps = {
  navigate?: NavigateFunction;
  forgottenPassword?: boolean;
  isNotification?: boolean;
  hasApprovalFlows?: boolean;
  setConnectedStatusPopoverHasBeenShown?: () => void;
  shouldShowSeedPhraseReminder: boolean;
  isPopup?: boolean;
  connectedStatusPopoverHasBeenShown?: boolean;
  showRecoveryPhraseReminder: boolean;
  showTermsOfUsePopup: boolean;
  firstTimeFlowType?: string;
  completedOnboarding?: boolean;
  onboardedInThisUISession?: boolean;
  showMultiRpcModal: boolean;
  showUpdateModal: boolean;
  newNetworkAddedConfigurationId?: string;
  totalUnapprovedCount: number;
  participateInMetaMetrics?: boolean;
  setDataCollectionForMarketing: (val: boolean) => void;
  dataCollectionForMarketing?: boolean | null;
  location?: RouterLocation;
  shouldShowWeb3ShimUsageNotification: boolean;
  setWeb3ShimUsageAlertDismissed: (origin: string) => void;
  originOfCurrentTab?: string;
  disableWeb3ShimUsageAlert: () => void;
  infuraBlocked: boolean;
  setRecoveryPhraseReminderHasBeenShown: () => void;
  setRecoveryPhraseReminderLastShown: (lastShown: number) => void;
  setTermsOfUseLastAgreed: (lastAgreed: number) => void;
  showOutdatedBrowserWarning: boolean;
  setOutdatedBrowserWarningLastShown: (lastShown: number) => void;
  newNetworkAddedName?: string;
  editedNetwork?: EditedNetwork;
  isSigningQRHardwareTransaction?: boolean;
  isHardwareWalletErrorModalVisible?: boolean;
  attemptCloseNotificationPopup: () => void;
  newTokensImported?: string;
  newTokensImportedError?: string;
  setNewTokensImported: (newTokens: string) => void;
  setNewTokensImportedError: (msg: string) => void;
  clearNewNetworkAdded?: () => void;
  clearEditedNetwork?: () => void;
  setActiveNetwork?: (networkConfigurationId: string) => void;
  useExternalServices?: boolean;
  setBasicFunctionalityModalOpen?: () => void;
  fetchBuyableChains: () => void;
  redirectAfterDefaultPage?: RedirectAfterDefaultPage;
  setRedirectAfterDefaultPage?: (redirect: { path: string }) => void;
  clearRedirectAfterDefaultPage?: () => void;
  isSeedlessPasswordOutdated?: boolean;
  isPrimarySeedPhraseBackedUp?: boolean;
  showShieldEntryModal?: boolean;
  isSocialLoginFlow?: boolean;
  lookupSelectedNetworks: () => void;
  evaluateCohortEligibility?: (cohort: string) => void;
  pendingShieldCohort?: string;
  setPendingShieldCohort?: (cohort: string) => void;
  isSignedIn?: boolean;
  rewardsEnabled?: boolean;
  rewardsModalOpen?: boolean;
  showPna25Modal: boolean;
  envType?: string;
  pendingRedirectRoute?: PendingRedirectRoute | null;
  clearPendingRedirectRoute?: () => void;
  lastVisitedPerpsRoute?: LastVisitedPerpsRoute | null;
  clearLastVisitedPerpsRoute?: () => void;
};

type HomeState = {
  canShowBlockageNotification: boolean;
  deepLinkQrCode: DeepLinkQrCodeData | null;
  notificationClosing: boolean;
  shouldEvaluateCohortEligibility: boolean;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type CloseNotificationArgs = Pick<
  HomeProps,
  | 'isNotification'
  | 'totalUnapprovedCount'
  | 'hasApprovalFlows'
  | 'isSigningQRHardwareTransaction'
  | 'isHardwareWalletErrorModalVisible'
>;

function shouldCloseNotificationPopup({
  isNotification,
  totalUnapprovedCount,
  hasApprovalFlows,
  isSigningQRHardwareTransaction,
  isHardwareWalletErrorModalVisible,
}: CloseNotificationArgs): boolean {
  const baseCondition =
    isNotification &&
    totalUnapprovedCount === 0 &&
    !hasApprovalFlows &&
    !isSigningQRHardwareTransaction;

  const isHardwareWalletErrorModalBlockingClose =
    isHardwareWalletErrorModalVisible;

  return Boolean(baseCondition && !isHardwareWalletErrorModalBlockingClose);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default class Home extends PureComponent<HomeProps, HomeState> {
  // Legacy context API — required for class components consuming this context.
  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  /** Typed accessor for the legacy React context. */
  private get ctx(): HomeContext {
    return this.context as HomeContext;
  }

  state: HomeState = {
    canShowBlockageNotification: true,
    deepLinkQrCode: null,
    notificationClosing: false,
    shouldEvaluateCohortEligibility: true,
  };

  constructor(props: HomeProps) {
    super(props);

    const {
      attemptCloseNotificationPopup,
      isNotification,
      totalUnapprovedCount,
      hasApprovalFlows,
      isSigningQRHardwareTransaction,
      isHardwareWalletErrorModalVisible,
    } = this.props;
    if (
      shouldCloseNotificationPopup({
        isNotification,
        totalUnapprovedCount,
        hasApprovalFlows,
        isSigningQRHardwareTransaction,
        isHardwareWalletErrorModalVisible,
      })
    ) {
      // Safe to mutate state directly before first render
      // eslint-disable-next-line react/no-direct-mutation-state
      this.state = { ...this.state, notificationClosing: true };
      attemptCloseNotificationPopup();
    }
  }

  checkRedirectAfterDefaultPage() {
    const {
      redirectAfterDefaultPage,
      navigate,
      clearRedirectAfterDefaultPage,
    } = this.props;

    if (
      redirectAfterDefaultPage?.shouldRedirect &&
      redirectAfterDefaultPage?.path
    ) {
      navigate?.(redirectAfterDefaultPage.path);
      clearRedirectAfterDefaultPage?.();
    }
  }

  /**
   * Hydrate history duck from persisted pendingRedirectRoute (cross-session redirect).
   * Must only be called once per arrival of a new pendingRedirectRoute, because
   * clearPendingRedirectRoute is an async thunk — the prop stays non-null across
   * several render cycles, so calling this unconditionally in componentDidUpdate
   * would create a re-render loop.
   */
  checkPendingRedirectRoute() {
    if (this.props.pendingRedirectRoute) {
      const { path, search, environmentType } = this.props.pendingRedirectRoute;
      const shouldRedirect =
        !environmentType || environmentType === this.props.envType;

      if (shouldRedirect) {
        this.props.setRedirectAfterDefaultPage?.({
          path: search ? `${path}${search}` : path,
        });
      }
      this.props.clearPendingRedirectRoute?.();
    }
  }

  /**
   * Resume a recent Perps session if the user reopened the extension within
   * {@link PERPS_REOPEN_TTL_MS}. Explicit `pendingRedirectRoute` always wins
   * to avoid overriding a route set by a background flow. The persisted entry
   * is cleared after inspection so it never hijacks a later home mount.
   */
  checkLastVisitedPerpsRoute() {
    const {
      lastVisitedPerpsRoute,
      pendingRedirectRoute,
      envType,
      setRedirectAfterDefaultPage,
      clearLastVisitedPerpsRoute,
    } = this.props;

    if (!lastVisitedPerpsRoute) {
      return;
    }

    const { path, timestamp } = lastVisitedPerpsRoute;
    const isFresh = Date.now() - timestamp < PERPS_REOPEN_TTL_MS;
    // Exact match on `/perps` or a `/perps/...` sub-route only. Prevents a
    // future sibling like `/perpsNew` from silently resuming off a stale
    // persisted path. Strip any query/hash suffix first so a stored path
    // like `/perps?tab=1` still matches.
    const pathname = typeof path === 'string' ? path.split(/[?#]/u)[0] : '';
    const isPerpsPath =
      pathname === PERPS_ROUTE || pathname.startsWith(`${PERPS_ROUTE}/`);

    // An in-app departure from `/perps/*` scheduled a Redux clear in the
    // passive-effect phase — React fires this `componentDidMount` first, so
    // the clear hasn't landed yet. The module-level marker tells us this is
    // an in-app transition (not a popup reopen) and we must not replay the
    // redirect. A fresh JS context (popup close→reopen) starts with an
    // unset marker, so the real resume path still fires.
    // `pendingRedirectRoute` is a higher-priority cross-session redirect
    // (e.g. a background-initiated deeplink); skip the perps resume when
    // one will actually fire in this environment. Mirror the
    // `checkPendingRedirectRoute` env applicability check so an
    // environment-mismatched pending entry (still non-null because the
    // clear is async) does not suppress the perps resume. Always clear
    // the persisted entry afterwards so a later home mount cannot replay
    // it.
    const pendingApplies =
      Boolean(pendingRedirectRoute) &&
      (!pendingRedirectRoute?.environmentType ||
        pendingRedirectRoute?.environmentType === envType);
    const justLeftPerpsInApp = wasPerpsUnmountedInAppRecently(1500);
    if (!pendingApplies && !justLeftPerpsInApp && isFresh && isPerpsPath) {
      setRedirectAfterDefaultPage?.({ path });
    }

    clearLastVisitedPerpsRoute?.();
  }

  componentDidMount() {
    this.props.fetchBuyableChains();

    this.checkPendingRedirectRoute();
    this.checkLastVisitedPerpsRoute();
    this.checkRedirectAfterDefaultPage();

    // Ensure we have up-to-date connectivity statuses for all enabled networks
    this.props.lookupSelectedNetworks();

    // Set pending Shield cohort for wallet home evaluation if there's no existing pending cohort
    if (this.props.setPendingShieldCohort && !this.props.pendingShieldCohort) {
      this.props.setPendingShieldCohort(COHORT_NAMES.WALLET_HOME);
    }
  }

  static getDerivedStateFromProps(props: HomeProps): Partial<HomeState> | null {
    const shouldClose = shouldCloseNotificationPopup({
      isNotification: props.isNotification,
      totalUnapprovedCount: props.totalUnapprovedCount,
      hasApprovalFlows: props.hasApprovalFlows,
      isSigningQRHardwareTransaction: props.isSigningQRHardwareTransaction,
      isHardwareWalletErrorModalVisible:
        props.isHardwareWalletErrorModalVisible,
    });
    if (shouldClose) {
      return { notificationClosing: true };
    }
    return null;
  }

  componentDidUpdate(prevProps: HomeProps, prevState: HomeState) {
    const {
      attemptCloseNotificationPopup,
      newNetworkAddedConfigurationId,
      setActiveNetwork,
      clearNewNetworkAdded,
      pendingShieldCohort,
      evaluateCohortEligibility,
      isSignedIn,
    } = this.props;

    const { shouldEvaluateCohortEligibility } = this.state;

    const {
      newNetworkAddedConfigurationId: prevNewNetworkAddedConfigurationId,
    } = prevProps;
    const { notificationClosing } = this.state;

    if (
      newNetworkAddedConfigurationId &&
      prevNewNetworkAddedConfigurationId !== newNetworkAddedConfigurationId
    ) {
      setActiveNetwork?.(newNetworkAddedConfigurationId);
      clearNewNetworkAdded?.();
    }

    if (notificationClosing && !prevState.notificationClosing) {
      attemptCloseNotificationPopup();
    }

    // Check for pending Shield cohort evaluation if user is signed in
    if (
      shouldEvaluateCohortEligibility &&
      pendingShieldCohort &&
      evaluateCohortEligibility &&
      isSignedIn
    ) {
      evaluateCohortEligibility(pendingShieldCohort);
      this.setState({ shouldEvaluateCohortEligibility: false });
    }

    // Only process pendingRedirectRoute when the prop first transitions from null to non-null
    if (this.props.pendingRedirectRoute && !prevProps.pendingRedirectRoute) {
      this.checkPendingRedirectRoute();
    }

    // Same one-shot pattern: only react when lastVisitedPerpsRoute hydrates from null to a value.
    if (this.props.lastVisitedPerpsRoute && !prevProps.lastVisitedPerpsRoute) {
      this.checkLastVisitedPerpsRoute();
    }

    // clearRedirectAfterDefaultPage is a synchronous Redux action, so the guard condition flips before the next render.
    this.checkRedirectAfterDefaultPage();
  }

  onRecoveryPhraseReminderClose = () => {
    const {
      setRecoveryPhraseReminderHasBeenShown,
      setRecoveryPhraseReminderLastShown,
    } = this.props;
    setRecoveryPhraseReminderHasBeenShown();
    setRecoveryPhraseReminderLastShown(new Date().getTime());
  };

  onAcceptTermsOfUse = () => {
    const { setTermsOfUseLastAgreed } = this.props;
    setTermsOfUseLastAgreed(new Date().getTime());
    this.ctx.trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.TermsOfUseAccepted,
      properties: {
        location: 'Terms Of Use Popover',
      },
    });
  };

  onSupportLinkClick = () => {
    if (isMain()) {
      this.ctx.trackEvent(
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
    }
  };

  onOutdatedBrowserWarningClose = () => {
    const { setOutdatedBrowserWarningLastShown } = this.props;
    setOutdatedBrowserWarningLastShown(new Date().getTime());
  };

  showDeepLinkQrCode = (deepLinkQrCode: DeepLinkQrCodeData) => {
    this.setState({ deepLinkQrCode });
  };

  hideDeepLinkQrCode = () => {
    this.setState({ deepLinkQrCode: null });
  };

  renderNotifications() {
    const { t } = this.ctx;

    const {
      navigate,
      shouldShowSeedPhraseReminder,
      isPopup,
      shouldShowWeb3ShimUsageNotification,
      setWeb3ShimUsageAlertDismissed,
      originOfCurrentTab,
      disableWeb3ShimUsageAlert,
      infuraBlocked,
      showOutdatedBrowserWarning,
      newNetworkAddedName,
      editedNetwork,
      newTokensImported,
      newTokensImportedError,
      setNewTokensImported,
      setNewTokensImportedError,
      clearNewNetworkAdded,
      clearEditedNetwork,
      isPrimarySeedPhraseBackedUp,
    } = this.props;

    const onAutoHide = () => {
      setNewTokensImported(''); // Added this so we dnt see the notif if user does not close it
      setNewTokensImportedError('');
      clearEditedNetwork?.(); // dispatches setEditedNetwork(), setting editedNetwork to undefined, which clears the editedNetwork state
    };

    const autoHideDelay = 5 * SECOND;

    const outdatedBrowserNotificationDescriptionText =
      isMv3ButOffscreenDocIsMissing ? (
        <div>
          <Text>{t('outdatedBrowserNotification')}</Text>
          <br />
          <Text fontWeight={FontWeight.Bold} color={TextColor.WarningDefault}>
            {t('noHardwareWalletOrSnapsSupport')}
          </Text>
        </div>
      ) : (
        t('outdatedBrowserNotification')
      );

    const items = [
      newNetworkAddedName ? (
        <ActionableMessage
          key="new-network-added"
          type="success"
          className="home__new-network-notification"
          message={
            <Box display={Display.InlineFlex}>
              <i className="fa fa-check-circle home__new-network-notification-icon" />
              <Text variant={TextVariant.BodySm} asChild>
                <h6>{t('newNetworkAdded', [newNetworkAddedName])}</h6>
              </Text>
              <ButtonIcon
                iconName={IconName.Close}
                size={ButtonIconSize.Sm}
                ariaLabel={t('close')}
                onClick={() => clearNewNetworkAdded?.()}
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
              <Text variant={TextVariant.BodySm} asChild>
                <h6>
                  {editedNetwork.newNetwork
                    ? t('newNetworkAdded', [editedNetwork.nickname])
                    : t('newNetworkEdited', [editedNetwork.nickname])}
                </h6>
              </Text>
              <ButtonIcon
                iconName={IconName.Close}
                size={ButtonIconSize.Sm}
                ariaLabel={t('close')}
                onClick={() => clearEditedNetwork?.()}
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
                  variant={TextVariant.BodySm}
                  asChild
                >
                  <h6>{t('newTokensImportedTitle')}</h6>
                </Text>
                <Text
                  className="home__new-tokens-imported-notification-message"
                  variant={TextVariant.BodySm}
                  asChild
                >
                  <h6>{t('newTokensImportedMessage', [newTokensImported])}</h6>
                </Text>
              </Box>

              <ButtonIcon
                iconName={IconName.Close}
                size={ButtonIconSize.Sm}
                ariaLabel={t('close')}
                onClick={() => setNewTokensImported('')}
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
              <Icon name={IconName.Danger} marginRight={1} />
              <Text variant={TextVariant.BodySm} asChild>
                <h6>{t('importTokensError')}</h6>
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
          onIgnore={(disable: boolean) => {
            setWeb3ShimUsageAlertDismissed(originOfCurrentTab ?? '');
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
              navigate?.(backUpSRPRoute);
            }
          }}
          infoText={t('backupApprovalInfo')}
        />
      ) : null,
      infuraBlocked && this.state.canShowBlockageNotification ? (
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
  }

  renderOnboardingPopover = () => {
    const { t } = this.ctx;
    const { setDataCollectionForMarketing } = this.props;

    const handleClose = () => {
      setDataCollectionForMarketing(false);
      this.ctx.trackEvent({
        category: MetaMetricsEventCategory.Home,
        event: MetaMetricsEventName.AnalyticsPreferenceSelected,
        properties: {
          [MetaMetricsUserTrait.HasMarketingConsent]: false,
          location: 'marketing_consent_modal',
        },
      });
    };

    const handleConsent = (consent: boolean) => {
      setDataCollectionForMarketing(consent);
      this.ctx.trackEvent({
        category: MetaMetricsEventCategory.Home,
        event: MetaMetricsEventName.AnalyticsPreferenceSelected,
        properties: {
          [MetaMetricsUserTrait.HasMarketingConsent]: consent,
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
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
            gap={4}
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
              <Text>
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
              </Text>
              <Text>{t('onboardedMetametricsParagraph2')}</Text>
              <ul className="home__onboarding_list">
                <li>{t('onboardedMetametricsKey1')}</li>
                <li>{t('onboardedMetametricsKey2')}</li>
                <li>{t('onboardedMetametricsKey3')}</li>
              </ul>
              <Text>{t('onboardedMetametricsParagraph3')}</Text>
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

  renderPopover = () => {
    const { setConnectedStatusPopoverHasBeenShown } = this.props;
    const { t } = this.ctx;
    return (
      <Popover
        title={t('whatsThis')}
        onClose={setConnectedStatusPopoverHasBeenShown}
        className="home__connected-status-popover"
        showArrow
        CustomBackground={({ onClose }: { onClose: () => void }) => {
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
              onClick={setConnectedStatusPopoverHasBeenShown}
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

  render() {
    const { t } = this.ctx;
    const { deepLinkQrCode } = this.state;
    const {
      useExternalServices,
      setBasicFunctionalityModalOpen,
      forgottenPassword,
      participateInMetaMetrics,
      dataCollectionForMarketing,
      connectedStatusPopoverHasBeenShown,
      isPopup,
      showRecoveryPhraseReminder,
      showTermsOfUsePopup,
      completedOnboarding,
      onboardedInThisUISession,
      firstTimeFlowType,
      newNetworkAddedConfigurationId,
      showMultiRpcModal,
      showUpdateModal,
      isSeedlessPasswordOutdated,
      isPrimarySeedPhraseBackedUp,
      showShieldEntryModal,
      isSocialLoginFlow,
      rewardsEnabled,
      rewardsModalOpen,
      showPna25Modal,
    } = this.props;

    if (forgottenPassword) {
      return <Navigate to={RESTORE_VAULT_ROUTE} replace />;
    } else if (this.state.notificationClosing) {
      return null;
    }

    const canSeeModals =
      completedOnboarding &&
      (!onboardedInThisUISession ||
        firstTimeFlowType === FirstTimeFlowType.import) &&
      !newNetworkAddedConfigurationId;

    const showMultiRpcEditModal =
      canSeeModals && showMultiRpcModal && !process.env.IN_TEST;

    const displayUpdateModal =
      canSeeModals && showUpdateModal && !showMultiRpcEditModal;

    const showTermsOfUse =
      completedOnboarding &&
      !onboardedInThisUISession &&
      showTermsOfUsePopup &&
      !isSocialLoginFlow;

    const showRecoveryPhrase =
      showRecoveryPhraseReminder && !isPrimarySeedPhraseBackedUp;

    const showRewardsModal =
      rewardsEnabled &&
      canSeeModals &&
      !showTermsOfUse &&
      !showMultiRpcEditModal &&
      !displayUpdateModal &&
      !isSeedlessPasswordOutdated &&
      !showShieldEntryModal &&
      !showRecoveryPhrase &&
      !deepLinkQrCode;

    const showDeepLinkQrCodeModal =
      canSeeModals &&
      !showTermsOfUse &&
      !showMultiRpcEditModal &&
      !displayUpdateModal &&
      !isSeedlessPasswordOutdated &&
      !showShieldEntryModal &&
      !showRecoveryPhrase &&
      Boolean(deepLinkQrCode);

    const showPna25ModalComponent =
      showPna25Modal &&
      canSeeModals &&
      !showTermsOfUse &&
      !showMultiRpcEditModal &&
      !displayUpdateModal &&
      !isSeedlessPasswordOutdated &&
      !showShieldEntryModal &&
      !showRecoveryPhrase &&
      !rewardsModalOpen &&
      !deepLinkQrCode;

    const { location } = this.props;

    // Handle connected routes
    if (location?.pathname === CONNECTED_ROUTE) {
      return (
        <ScrollContainer className="main-container main-container--has-shadow">
          <ConnectedSites navigate={this.props.navigate} />
        </ScrollContainer>
      );
    }

    if (location?.pathname === CONNECTED_ACCOUNTS_ROUTE) {
      return (
        <ScrollContainer className="main-container main-container--has-shadow">
          <ConnectedAccounts navigate={this.props.navigate} />
        </ScrollContainer>
      );
    }

    // Render normal home content
    return (
      <ScrollContainer className="main-container main-container--has-shadow">
        <div className="home__container">
          {dataCollectionForMarketing === null &&
          participateInMetaMetrics === true
            ? this.renderOnboardingPopover()
            : null}
          {isSeedlessPasswordOutdated && <PasswordOutdatedModal />}
          {showMultiRpcEditModal && <MultiRpcEditModal />}
          {displayUpdateModal && <UpdateModal />}
          {showRecoveryPhrase ? (
            <RecoveryPhraseReminder
              onConfirm={this.onRecoveryPhraseReminderClose}
            />
          ) : null}
          {showTermsOfUse ? (
            <TermsOfUsePopup onAccept={this.onAcceptTermsOfUse} />
          ) : null}
          {showShieldEntryModal && <ShieldEntryModal />}
          {showRewardsModal && <RewardsModal />}
          {showDeepLinkQrCodeModal && deepLinkQrCode ? (
            <Modal
              data-testid="deeplink-qrcode-modal"
              isOpen
              onClose={this.hideDeepLinkQrCode}
            >
              <ModalOverlay />
              <ModalContent
                alignItems={AlignItems.center}
                justifyContent={JustifyContent.center}
                size={ModalContentSize.Md}
                modalDialogProps={{
                  paddingTop: 0,
                  paddingBottom: 0,
                  style: {
                    height: 'auto',
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                }}
              >
                <ModalHeader
                  closeButtonProps={{
                    className: 'absolute z-10',
                    style: {
                      top: '24px',
                      right: '12px',
                    },
                  }}
                  paddingBottom={0}
                  onClose={this.hideDeepLinkQrCode}
                />
                <DeeplinkQRCode
                  title={t(deepLinkQrCode.titleKey)}
                  description={t(deepLinkQrCode.descriptionKey)}
                  data={deepLinkQrCode.deeplinkUrl}
                  onDone={this.hideDeepLinkQrCode}
                  doneLabel={t('done')}
                  testId="deeplink-qrcode-container"
                />
              </ModalContent>
            </Modal>
          ) : null}
          {showPna25ModalComponent && <Pna25Modal />}
          {isPopup && !connectedStatusPopoverHasBeenShown
            ? this.renderPopover()
            : null}
          <div className="home__main-view">
            <AccountOverview
              onSupportLinkClick={this.onSupportLinkClick}
              useExternalServices={useExternalServices ?? false}
              setBasicFunctionalityModalOpen={
                setBasicFunctionalityModalOpen ?? (() => undefined)
              }
            />
            {(isBeta() || isFlask()) && (
              <div className="home__support">
                <BetaAndFlaskHomeFooter />
              </div>
            )}
          </div>
          {this.renderNotifications()}
        </div>

        {/* Ghost component that manages the useHomeDeepLinkEffects */}
        <HomeDeepLinkActions onQrCodeDeepLink={this.showDeepLinkQrCode} />
      </ScrollContainer>
    );
  }
}
