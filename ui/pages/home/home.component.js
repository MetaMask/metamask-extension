import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Redirect, Route } from 'react-router-dom';
import {
  ///: BEGIN:ONLY_INCLUDE_IF(build-main)
  MetaMetricsContextProp,
  ///: END:ONLY_INCLUDE_IF
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import TermsOfUsePopup from '../../components/app/terms-of-use-popup';
import RecoveryPhraseReminder from '../../components/app/recovery-phrase-reminder';
import WhatsNewPopup from '../../components/app/whats-new-popup';
import { FirstTimeFlowType } from '../../../shared/constants/onboarding';
import SmartTransactionsOptInModal from '../../components/app/smart-transactions/smart-transactions-opt-in-modal';
///: END:ONLY_INCLUDE_IF
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
import {
  RESTORE_VAULT_ROUTE,
  CONFIRM_TRANSACTION_ROUTE,
  CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE,
  CONFIRM_ADD_SUGGESTED_NFT_ROUTE,
  CONNECT_ROUTE,
  CONNECTED_ROUTE,
  CONNECTED_ACCOUNTS_ROUTE,
  AWAITING_SWAP_ROUTE,
  BUILD_QUOTE_ROUTE,
  VIEW_QUOTE_ROUTE,
  CONFIRMATION_V_NEXT_ROUTE,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  ONBOARDING_SECURE_YOUR_WALLET_ROUTE,
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  CONFIRM_ADD_CUSTODIAN_TOKEN,
  INTERACTIVE_REPLACEMENT_TOKEN_PAGE,
  ///: END:ONLY_INCLUDE_IF
} from '../../helpers/constants/routes';
import ZENDESK_URLS from '../../helpers/constants/zendesk-url';
import { METAMETRICS_SETTINGS_LINK } from '../../helpers/constants/common';
import {
  ///: BEGIN:ONLY_INCLUDE_IF(build-main)
  SUPPORT_LINK,
  ///: END:ONLY_INCLUDE_IF
} from '../../../shared/lib/ui-utils';
import { AccountOverview } from '../../components/multichain/account-overview';
import { setEditedNetwork } from '../../store/actions';
///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
import { AccountType } from '../../../shared/constants/custody';
///: END:ONLY_INCLUDE_IF
///: BEGIN:ONLY_INCLUDE_IF(build-beta)
import BetaHomeFooter from './beta/beta-home-footer.component';
///: END:ONLY_INCLUDE_IF
///: BEGIN:ONLY_INCLUDE_IF(build-flask)
import FlaskHomeFooter from './flask/flask-home-footer.component';
///: END:ONLY_INCLUDE_IF

function shouldCloseNotificationPopup({
  isNotification,
  totalUnapprovedAndQueuedRequestCount,
  hasApprovalFlows,
  isSigningQRHardwareTransaction,
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  waitForConfirmDeepLinkDialog,
  institutionalConnectRequests,
  ///: END:ONLY_INCLUDE_IF
}) {
  // we can't use totalUnapproved because there are also queued requests

  let shouldClose =
    isNotification &&
    totalUnapprovedAndQueuedRequestCount === 0 &&
    !hasApprovalFlows &&
    !isSigningQRHardwareTransaction;

  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  shouldClose &&=
    // MMI User must be shown a deeplink
    !waitForConfirmDeepLinkDialog &&
    // MMI User is connecting to custodian
    institutionalConnectRequests.length === 0;
  ///: END:ONLY_INCLUDE_IF

  return shouldClose;
}

export default class Home extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  static propTypes = {
    history: PropTypes.object,
    forgottenPassword: PropTypes.bool,
    hasTransactionPendingApprovals: PropTypes.bool.isRequired,
    hasWatchTokenPendingApprovals: PropTypes.bool,
    hasWatchNftPendingApprovals: PropTypes.bool,
    setConnectedStatusPopoverHasBeenShown: PropTypes.func,
    ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
    shouldShowSeedPhraseReminder: PropTypes.bool.isRequired,
    isPopup: PropTypes.bool,
    connectedStatusPopoverHasBeenShown: PropTypes.bool,
    showRecoveryPhraseReminder: PropTypes.bool.isRequired,
    showTermsOfUsePopup: PropTypes.bool.isRequired,
    seedPhraseBackedUp: (props) => {
      if (
        props.seedPhraseBackedUp !== null &&
        typeof props.seedPhraseBackedUp !== 'boolean'
      ) {
        throw new Error(
          `seedPhraseBackedUp is required to be null or boolean. Received ${props.seedPhraseBackedUp}`,
        );
      }
    },
    firstTimeFlowType: PropTypes.string,
    completedOnboarding: PropTypes.bool,
    showWhatsNewPopup: PropTypes.bool.isRequired,
    hideWhatsNewPopup: PropTypes.func.isRequired,
    announcementsToShow: PropTypes.bool.isRequired,
    onboardedInThisUISession: PropTypes.bool,
    isSmartTransactionsOptInModalAvailable: PropTypes.bool.isRequired,
    ///: END:ONLY_INCLUDE_IF
    newNetworkAddedConfigurationId: PropTypes.string,
    isNotification: PropTypes.bool.isRequired,
    firstPermissionsRequestId: PropTypes.string,
    // This prop is used in the `shouldCloseNotificationPopup` function
    // eslint-disable-next-line react/no-unused-prop-types
    totalUnapprovedCount: PropTypes.number.isRequired,
    defaultHomeActiveTabName: PropTypes.string,
    participateInMetaMetrics: PropTypes.bool.isRequired,
    onTabClick: PropTypes.func.isRequired,
    haveSwapsQuotes: PropTypes.bool.isRequired,
    showAwaitingSwapScreen: PropTypes.bool.isRequired,
    setDataCollectionForMarketing: PropTypes.func.isRequired,
    dataCollectionForMarketing: PropTypes.bool,
    swapsFetchParams: PropTypes.object,
    location: PropTypes.object,
    shouldShowWeb3ShimUsageNotification: PropTypes.bool.isRequired,
    setWeb3ShimUsageAlertDismissed: PropTypes.func.isRequired,
    originOfCurrentTab: PropTypes.string,
    disableWeb3ShimUsageAlert: PropTypes.func.isRequired,
    pendingConfirmations: PropTypes.arrayOf(PropTypes.object).isRequired,
    pendingConfirmationsPrioritized: PropTypes.arrayOf(PropTypes.object)
      .isRequired,
    networkMenuRedesign: PropTypes.bool,
    hasApprovalFlows: PropTypes.bool.isRequired,
    infuraBlocked: PropTypes.bool.isRequired,
    setRecoveryPhraseReminderHasBeenShown: PropTypes.func.isRequired,
    setRecoveryPhraseReminderLastShown: PropTypes.func.isRequired,
    setTermsOfUseLastAgreed: PropTypes.func.isRequired,
    showOutdatedBrowserWarning: PropTypes.bool.isRequired,
    setOutdatedBrowserWarningLastShown: PropTypes.func.isRequired,
    newNetworkAddedName: PropTypes.string,
    editedNetwork: PropTypes.object,
    // This prop is used in the `shouldCloseNotificationPopup` function
    // eslint-disable-next-line react/no-unused-prop-types
    isSigningQRHardwareTransaction: PropTypes.bool.isRequired,
    newNftAddedMessage: PropTypes.string,
    setNewNftAddedMessage: PropTypes.func.isRequired,
    removeNftMessage: PropTypes.string,
    setRemoveNftMessage: PropTypes.func.isRequired,
    closeNotificationPopup: PropTypes.func.isRequired,
    newTokensImported: PropTypes.string,
    newTokensImportedError: PropTypes.string,
    setNewTokensImported: PropTypes.func.isRequired,
    setNewTokensImportedError: PropTypes.func.isRequired,
    clearNewNetworkAdded: PropTypes.func,
    clearEditedNetwork: PropTypes.func,
    setActiveNetwork: PropTypes.func,
    hasAllowedPopupRedirectApprovals: PropTypes.bool.isRequired,
    useExternalServices: PropTypes.bool,
    setBasicFunctionalityModalOpen: PropTypes.func,
    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    institutionalConnectRequests: PropTypes.arrayOf(PropTypes.object),
    modalOpen: PropTypes.bool,
    setWaitForConfirmDeepLinkDialog: PropTypes.func,
    waitForConfirmDeepLinkDialog: PropTypes.bool,
    showCustodianDeepLink: PropTypes.func,
    cleanCustodianDeepLink: PropTypes.func,
    custodianDeepLink: PropTypes.object,
    accountType: PropTypes.string,
    ///: END:ONLY_INCLUDE_IF
    fetchBuyableChains: PropTypes.func.isRequired,
  };

  state = {
    canShowBlockageNotification: true,
    notificationClosing: false,
    redirecting: false,
  };

  constructor(props) {
    super(props);

    const {
      closeNotificationPopup,
      firstPermissionsRequestId,
      haveSwapsQuotes,
      isNotification,
      showAwaitingSwapScreen,
      hasWatchTokenPendingApprovals,
      hasWatchNftPendingApprovals,
      swapsFetchParams,
      hasTransactionPendingApprovals,
      location,
    } = this.props;
    const stayOnHomePage = Boolean(location?.state?.stayOnHomePage);

    if (shouldCloseNotificationPopup(props)) {
      this.state.notificationClosing = true;
      closeNotificationPopup();
    } else if (
      firstPermissionsRequestId ||
      hasTransactionPendingApprovals ||
      hasWatchTokenPendingApprovals ||
      hasWatchNftPendingApprovals ||
      (!isNotification &&
        !stayOnHomePage &&
        (showAwaitingSwapScreen || haveSwapsQuotes || swapsFetchParams))
    ) {
      this.state.redirecting = true;
    }
  }

  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  checkInstitutionalConnectRequest() {
    const { history, institutionalConnectRequests } = this.props;
    if (
      institutionalConnectRequests &&
      institutionalConnectRequests.length > 0 &&
      institutionalConnectRequests[0].feature === 'custodian'
    ) {
      if (
        institutionalConnectRequests[0].method ===
        'metamaskinstitutional_reauthenticate'
      ) {
        history.push(INTERACTIVE_REPLACEMENT_TOKEN_PAGE);
      } else if (
        institutionalConnectRequests[0].method ===
        'metamaskinstitutional_authenticate'
      ) {
        history.push(CONFIRM_ADD_CUSTODIAN_TOKEN);
      }
    }
  }

  shouldCloseCurrentWindow() {
    const {
      isNotification,
      modalOpen,
      totalUnapprovedCount,
      institutionalConnectRequests,
      waitForConfirmDeepLinkDialog,
    } = this.props;

    if (
      isNotification &&
      totalUnapprovedCount === 0 &&
      institutionalConnectRequests.length === 0 &&
      !waitForConfirmDeepLinkDialog &&
      !modalOpen
    ) {
      global.platform.closeCurrentWindow();
    }
  }
  ///: END:ONLY_INCLUDE_IF

  checkStatusAndNavigate() {
    const {
      firstPermissionsRequestId,
      history,
      isNotification,
      hasTransactionPendingApprovals,
      hasWatchTokenPendingApprovals,
      hasWatchNftPendingApprovals,
      haveSwapsQuotes,
      showAwaitingSwapScreen,
      swapsFetchParams,
      location,
      pendingConfirmations,
      pendingConfirmationsPrioritized,
      hasApprovalFlows,
    } = this.props;
    const stayOnHomePage = Boolean(location?.state?.stayOnHomePage);

    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    this.shouldCloseCurrentWindow();
    ///: END:ONLY_INCLUDE_IF

    const canRedirect = !isNotification && !stayOnHomePage;
    if (canRedirect && showAwaitingSwapScreen) {
      history.push(AWAITING_SWAP_ROUTE);
    } else if (canRedirect && haveSwapsQuotes) {
      history.push(VIEW_QUOTE_ROUTE);
    } else if (canRedirect && swapsFetchParams) {
      history.push(BUILD_QUOTE_ROUTE);
    } else if (firstPermissionsRequestId) {
      history.push(`${CONNECT_ROUTE}/${firstPermissionsRequestId}`);
    } else if (pendingConfirmationsPrioritized.length > 0) {
      history.push(CONFIRMATION_V_NEXT_ROUTE);
    } else if (hasTransactionPendingApprovals) {
      history.push(CONFIRM_TRANSACTION_ROUTE);
    } else if (hasWatchTokenPendingApprovals) {
      history.push(CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE);
    } else if (hasWatchNftPendingApprovals) {
      history.push(CONFIRM_ADD_SUGGESTED_NFT_ROUTE);
    } else if (pendingConfirmations.length > 0 || hasApprovalFlows) {
      history.push(CONFIRMATION_V_NEXT_ROUTE);
    }
    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    this.checkInstitutionalConnectRequest();
    ///: END:ONLY_INCLUDE_IF
  }

  componentDidMount() {
    this.checkStatusAndNavigate();

    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    const { setWaitForConfirmDeepLinkDialog } = this.props;

    window.addEventListener('beforeunload', () => {
      // If user closes notification window manually, change waitForConfirmDeepLinkDialog to false
      setWaitForConfirmDeepLinkDialog(false);
    });
    ///: END:ONLY_INCLUDE_IF

    this.props.fetchBuyableChains();
  }

  static getDerivedStateFromProps(props) {
    if (shouldCloseNotificationPopup(props)) {
      return { notificationClosing: true };
    }
    return null;
  }

  componentDidUpdate(_prevProps, prevState) {
    const {
      closeNotificationPopup,
      isNotification,
      hasAllowedPopupRedirectApprovals,
      networkMenuRedesign,
      newNetworkAddedConfigurationId,
      setActiveNetwork,
      clearNewNetworkAdded,
      ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
      custodianDeepLink,
      showCustodianDeepLink,
      cleanCustodianDeepLink,
      accountType,
      ///: END:ONLY_INCLUDE_IF
    } = this.props;

    const {
      newNetworkAddedConfigurationId: prevNewNetworkAddedConfigurationId,
    } = _prevProps;
    const { notificationClosing } = this.state;

    if (
      prevNewNetworkAddedConfigurationId !== newNetworkAddedConfigurationId &&
      networkMenuRedesign
    ) {
      setActiveNetwork(newNetworkAddedConfigurationId);
      clearNewNetworkAdded();
    }

    if (notificationClosing && !prevState.notificationClosing) {
      closeNotificationPopup();
    } else if (isNotification || hasAllowedPopupRedirectApprovals) {
      this.checkStatusAndNavigate();
    }

    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    if (
      accountType === AccountType.CUSTODY &&
      custodianDeepLink &&
      Object.keys(custodianDeepLink).length
    ) {
      const { custodyId, fromAddress } = custodianDeepLink;

      showCustodianDeepLink({
        fromAddress,
        custodyId,
        isSignature: true,
        isNotification,
        onDeepLinkShown: () => {
          this.context.trackEvent({
            category: MetaMetricsEventCategory.MMI,
            event: MetaMetricsEventName.SignatureDeeplinkDisplayed,
          });
          cleanCustodianDeepLink();
        },
      });
    }
    ///: END:ONLY_INCLUDE_IF
  }

  onRecoveryPhraseReminderClose = () => {
    const {
      setRecoveryPhraseReminderHasBeenShown,
      setRecoveryPhraseReminderLastShown,
    } = this.props;
    setRecoveryPhraseReminderHasBeenShown(true);
    setRecoveryPhraseReminderLastShown(new Date().getTime());
  };

  onAcceptTermsOfUse = () => {
    const { setTermsOfUseLastAgreed } = this.props;
    setTermsOfUseLastAgreed(new Date().getTime());
    this.context.trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.TermsOfUseAccepted,
      properties: {
        location: 'Terms Of Use Popover',
      },
    });
  };

  ///: BEGIN:ONLY_INCLUDE_IF(build-main)
  onSupportLinkClick = () => {
    this.context.trackEvent(
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
  };
  ///: END:ONLY_INCLUDE_IF

  onOutdatedBrowserWarningClose = () => {
    const { setOutdatedBrowserWarningLastShown } = this.props;
    setOutdatedBrowserWarningLastShown(new Date().getTime());
  };

  renderNotifications() {
    const { t } = this.context;

    const {
      ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
      history,
      shouldShowSeedPhraseReminder,
      isPopup,
      ///: END:ONLY_INCLUDE_IF
      shouldShowWeb3ShimUsageNotification,
      setWeb3ShimUsageAlertDismissed,
      originOfCurrentTab,
      disableWeb3ShimUsageAlert,
      infuraBlocked,
      showOutdatedBrowserWarning,
      newNftAddedMessage,
      setNewNftAddedMessage,
      newNetworkAddedName,
      editedNetwork,
      removeNftMessage,
      setRemoveNftMessage,
      newTokensImported,
      newTokensImportedError,
      setNewTokensImported,
      setNewTokensImportedError,
      newNetworkAddedConfigurationId,
      networkMenuRedesign,
      clearNewNetworkAdded,
      clearEditedNetwork,
      setActiveNetwork,
    } = this.props;

    const onAutoHide = () => {
      setNewNftAddedMessage('');
      setRemoveNftMessage('');
      setNewTokensImported(''); // Added this so we dnt see the notif if user does not close it
      setNewTokensImportedError('');
      setEditedNetwork();
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

    return (
      <MultipleNotifications>
        {newNftAddedMessage === 'success' ? (
          <ActionableMessage
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
        ) : null}
        {removeNftMessage === 'success' ? (
          <ActionableMessage
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
        ) : null}
        {removeNftMessage === 'error' ? (
          <ActionableMessage
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
        ) : null}
        {newNetworkAddedName ? (
          <ActionableMessage
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
        ) : null}
        {editedNetwork?.editCompleted ? (
          <ActionableMessage
            type="success"
            className="home__new-tokens-imported-notification"
            autoHideTime={autoHideDelay}
            onAutoHide={onAutoHide}
            message={
              <Box display={Display.InlineFlex}>
                <i className="fa fa-check-circle home__new-network-notification-icon" />
                <Text variant={TextVariant.bodySm} as="h6">
                  {t('newNetworkEdited', [editedNetwork.nickname])}
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
        ) : null}
        {newTokensImported ? (
          <ActionableMessage
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
                  onClick={() => setNewTokensImported('')}
                  className="home__new-tokens-imported-notification-close"
                />
              </Box>
            }
          />
        ) : null}
        {newTokensImportedError ? (
          <ActionableMessage
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
        ) : null}
        {shouldShowWeb3ShimUsageNotification ? (
          <HomeNotification
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
                disableWeb3ShimUsageAlert();
              }
            }}
            checkboxText={t('dontShowThisAgain')}
            checkboxTooltipText={t('canToggleInSettings')}
            key="home-web3ShimUsageNotification"
          />
        ) : null}
        {
          ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
          shouldShowSeedPhraseReminder ? (
            <HomeNotification
              descriptionText={t('backupApprovalNotice')}
              acceptText={t('backupNow')}
              onAccept={() => {
                const backUpSRPRoute = `${ONBOARDING_SECURE_YOUR_WALLET_ROUTE}/?isFromReminder=true`;
                if (isPopup) {
                  global.platform.openExtensionInBrowser(backUpSRPRoute);
                } else {
                  history.push(backUpSRPRoute);
                }
              }}
              infoText={t('backupApprovalInfo')}
              key="home-backupApprovalNotice"
            />
          ) : null
          ///: END:ONLY_INCLUDE_IF
        }
        {infuraBlocked && this.state.canShowBlockageNotification ? (
          <HomeNotification
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
            key="home-infuraBlockedNotification"
          />
        ) : null}
        {showOutdatedBrowserWarning ? (
          <HomeNotification
            descriptionText={outdatedBrowserNotificationDescriptionText}
            acceptText={t('gotIt')}
            onAccept={this.onOutdatedBrowserWarningClose}
            key="home-outdatedBrowserNotification"
          />
        ) : null}
        {newNetworkAddedConfigurationId && !networkMenuRedesign && (
          <Popover
            className="home__new-network-added"
            onClose={() => clearNewNetworkAdded()}
          >
            <i className="fa fa-check-circle fa-2x home__new-network-added__check-circle" />
            <Text
              variant={TextVariant.headingSm}
              as="h4"
              marginTop={5}
              marginRight={9}
              marginLeft={9}
              marginBottom={0}
              fontWeight={FontWeight.Bold}
            >
              {t('networkAddedSuccessfully')}
            </Text>
            <Box marginTop={8} marginRight={8} marginLeft={8} marginBottom={5}>
              <Button
                type="primary"
                className="home__new-network-added__switch-to-button"
                onClick={() => {
                  setActiveNetwork(newNetworkAddedConfigurationId);
                  clearNewNetworkAdded();
                }}
              >
                <Text
                  variant={TextVariant.bodySm}
                  as="h6"
                  color={TextColor.primaryInverse}
                >
                  {t('switchToNetwork', [newNetworkAddedName])}
                </Text>
              </Button>
              <Button type="secondary" onClick={() => clearNewNetworkAdded()}>
                <Text
                  variant={TextVariant.bodySm}
                  as="h6"
                  color={TextColor.primaryDefault}
                >
                  {t('dismiss')}
                </Text>
              </Button>
            </Box>
          </Popover>
        )}
      </MultipleNotifications>
    );
  }

  renderOnboardingPopover = () => {
    const { t } = this.context;
    const { setDataCollectionForMarketing } = this.props;

    const handleClose = () => {
      setDataCollectionForMarketing(false);
      this.context.trackEvent({
        category: MetaMetricsEventCategory.Home,
        event: MetaMetricsEventName.AnalyticsPreferenceSelected,
        properties: {
          has_marketing_consent: false,
          location: 'marketing_consent_modal',
        },
      });
    };

    const handleConsent = (consent) => {
      setDataCollectionForMarketing(consent);
      this.context.trackEvent({
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

  renderPopover = () => {
    const { setConnectedStatusPopoverHasBeenShown } = this.props;
    const { t } = this.context;
    return (
      <Popover
        title={t('whatsThis')}
        onClose={setConnectedStatusPopoverHasBeenShown}
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
    const {
      defaultHomeActiveTabName,
      onTabClick,
      useExternalServices,
      setBasicFunctionalityModalOpen,
      forgottenPassword,
      participateInMetaMetrics,
      dataCollectionForMarketing,
      ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
      connectedStatusPopoverHasBeenShown,
      isPopup,
      seedPhraseBackedUp,
      showRecoveryPhraseReminder,
      showTermsOfUsePopup,
      showWhatsNewPopup,
      hideWhatsNewPopup,
      completedOnboarding,
      onboardedInThisUISession,
      announcementsToShow,
      firstTimeFlowType,
      newNetworkAddedConfigurationId,
      isSmartTransactionsOptInModalAvailable,
      ///: END:ONLY_INCLUDE_IF
    } = this.props;

    if (forgottenPassword) {
      return <Redirect to={{ pathname: RESTORE_VAULT_ROUTE }} />;
    } else if (this.state.notificationClosing || this.state.redirecting) {
      return null;
    }

    ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
    const canSeeModals =
      completedOnboarding &&
      (!onboardedInThisUISession ||
        firstTimeFlowType === FirstTimeFlowType.import) &&
      !process.env.IN_TEST &&
      !newNetworkAddedConfigurationId;

    const showSmartTransactionsOptInModal =
      canSeeModals && isSmartTransactionsOptInModalAvailable;

    const showWhatsNew =
      canSeeModals &&
      announcementsToShow &&
      showWhatsNewPopup &&
      !showSmartTransactionsOptInModal;

    const showTermsOfUse =
      completedOnboarding && !onboardedInThisUISession && showTermsOfUsePopup;
    ///: END:ONLY_INCLUDE_IF

    return (
      <div className="main-container">
        <Route path={CONNECTED_ROUTE} component={ConnectedSites} exact />
        <Route
          path={CONNECTED_ACCOUNTS_ROUTE}
          component={ConnectedAccounts}
          exact
        />
        <div className="home__container">
          {dataCollectionForMarketing === null &&
          participateInMetaMetrics === true
            ? this.renderOnboardingPopover()
            : null}
          {
            ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
          }
          <SmartTransactionsOptInModal
            isOpen={showSmartTransactionsOptInModal}
            hideWhatsNewPopup={hideWhatsNewPopup}
          />
          {showWhatsNew ? <WhatsNewPopup onClose={hideWhatsNewPopup} /> : null}
          {!showWhatsNew && showRecoveryPhraseReminder ? (
            <RecoveryPhraseReminder
              hasBackedUp={seedPhraseBackedUp}
              onConfirm={this.onRecoveryPhraseReminderClose}
            />
          ) : null}
          {showTermsOfUse ? (
            <TermsOfUsePopup onAccept={this.onAcceptTermsOfUse} />
          ) : null}
          {isPopup && !connectedStatusPopoverHasBeenShown
            ? this.renderPopover()
            : null}
          {
            ///: END:ONLY_INCLUDE_IF
          }
          <div className="home__main-view">
            <AccountOverview
              onTabClick={onTabClick}
              ///: BEGIN:ONLY_INCLUDE_IF(build-main)
              onSupportLinkClick={this.onSupportLinkClick}
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
          {this.renderNotifications()}
        </div>
      </div>
    );
  }
}
