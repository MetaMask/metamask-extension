import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Redirect, Route } from 'react-router-dom';
///: BEGIN:ONLY_INCLUDE_IN(build-main)
// eslint-disable-next-line import/no-duplicates
import { MetaMetricsContextProp } from '../../../shared/constants/metametrics';
///: END:ONLY_INCLUDE_IN
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  // eslint-disable-next-line import/no-duplicates
} from '../../../shared/constants/metametrics';
import AssetList from '../../components/app/asset-list';
import NftsTab from '../../components/app/nfts-tab';
import HomeNotification from '../../components/app/home-notification';
import MultipleNotifications from '../../components/app/multiple-notifications';
import TransactionList from '../../components/app/transaction-list';
import MenuBar from '../../components/app/menu-bar';
import Popover from '../../components/ui/popover';
import Button from '../../components/ui/button';
import Box from '../../components/ui/box';
import ConnectedSites from '../connected-sites';
import ConnectedAccounts from '../connected-accounts';
import { Tabs, Tab } from '../../components/ui/tabs';
import { EthOverview } from '../../components/app/wallet-overview';
import WhatsNewPopup from '../../components/app/whats-new-popup';
import TermsOfUsePopup from '../../components/app/terms-of-use-popup';
import RecoveryPhraseReminder from '../../components/app/recovery-phrase-reminder';
import ActionableMessage from '../../components/ui/actionable-message/actionable-message';
import {
  FONT_WEIGHT,
  DISPLAY,
  TextColor,
  TextVariant,
} from '../../helpers/constants/design-system';
import { SECOND } from '../../../shared/constants/time';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
} from '../../components/component-library';

import {
  ASSET_ROUTE,
  RESTORE_VAULT_ROUTE,
  CONFIRM_TRANSACTION_ROUTE,
  CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE,
  CONNECT_ROUTE,
  CONNECTED_ROUTE,
  CONNECTED_ACCOUNTS_ROUTE,
  AWAITING_SWAP_ROUTE,
  BUILD_QUOTE_ROUTE,
  VIEW_QUOTE_ROUTE,
  CONFIRMATION_V_NEXT_ROUTE,
  ADD_NFT_ROUTE,
  ONBOARDING_SECURE_YOUR_WALLET_ROUTE,
  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  CONFIRM_INSTITUTIONAL_FEATURE_CONNECT,
  CONFIRM_ADD_CUSTODIAN_TOKEN,
  INTERACTIVE_REPLACEMENT_TOKEN_PAGE,
  ///: END:ONLY_INCLUDE_IN
} from '../../helpers/constants/routes';
import ZENDESK_URLS from '../../helpers/constants/zendesk-url';
///: BEGIN:ONLY_INCLUDE_IN(build-main, build-mmi)
import { SUPPORT_LINK } from '../../../shared/lib/ui-utils';
///: END:ONLY_INCLUDE_IN
///: BEGIN:ONLY_INCLUDE_IN(build-beta)
import BetaHomeFooter from './beta/beta-home-footer.component';
///: END:ONLY_INCLUDE_IN
///: BEGIN:ONLY_INCLUDE_IN(build-flask)
import FlaskHomeFooter from './flask/flask-home-footer.component';
///: END:ONLY_INCLUDE_IN

function shouldCloseNotificationPopup({
  isNotification,
  totalUnapprovedCount,
  isSigningQRHardwareTransaction,
  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  waitForConfirmDeepLinkDialog,
  institutionalConnectRequests,
  ///: END:ONLY_INCLUDE_IN
}) {
  let shouldCLose =
    isNotification &&
    totalUnapprovedCount === 0 &&
    !isSigningQRHardwareTransaction;

  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  shouldCLose &&=
    // MMI User must be shown a deeplink
    !waitForConfirmDeepLinkDialog &&
    // MMI User is connecting to custodian or compliance
    institutionalConnectRequests.length === 0;
  ///: END:ONLY_INCLUDE_IN

  return shouldCLose;
}

export default class Home extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  static propTypes = {
    history: PropTypes.object,
    forgottenPassword: PropTypes.bool,
    hasWatchAssetPendingApprovals: PropTypes.bool,
    unconfirmedTransactionsCount: PropTypes.number,
    shouldShowSeedPhraseReminder: PropTypes.bool.isRequired,
    isPopup: PropTypes.bool,
    isNotification: PropTypes.bool.isRequired,
    firstPermissionsRequestId: PropTypes.string,
    // This prop is used in the `shouldCloseNotificationPopup` function
    // eslint-disable-next-line react/no-unused-prop-types
    totalUnapprovedCount: PropTypes.number.isRequired,
    setConnectedStatusPopoverHasBeenShown: PropTypes.func,
    connectedStatusPopoverHasBeenShown: PropTypes.bool,
    defaultHomeActiveTabName: PropTypes.string,
    firstTimeFlowType: PropTypes.string,
    completedOnboarding: PropTypes.bool,
    onTabClick: PropTypes.func.isRequired,
    haveSwapsQuotes: PropTypes.bool.isRequired,
    showAwaitingSwapScreen: PropTypes.bool.isRequired,
    swapsFetchParams: PropTypes.object,
    shouldShowWeb3ShimUsageNotification: PropTypes.bool.isRequired,
    setWeb3ShimUsageAlertDismissed: PropTypes.func.isRequired,
    originOfCurrentTab: PropTypes.string,
    disableWeb3ShimUsageAlert: PropTypes.func.isRequired,
    pendingConfirmations: PropTypes.arrayOf(PropTypes.object).isRequired,
    infuraBlocked: PropTypes.bool.isRequired,
    showWhatsNewPopup: PropTypes.bool.isRequired,
    hideWhatsNewPopup: PropTypes.func.isRequired,
    showTermsOfUsePopup: PropTypes.bool.isRequired,
    announcementsToShow: PropTypes.bool.isRequired,
    ///: BEGIN:ONLY_INCLUDE_IN(snaps)
    errorsToShow: PropTypes.object.isRequired,
    shouldShowErrors: PropTypes.bool.isRequired,
    removeSnapError: PropTypes.func.isRequired,
    ///: END:ONLY_INCLUDE_IN
    showRecoveryPhraseReminder: PropTypes.bool.isRequired,
    setRecoveryPhraseReminderHasBeenShown: PropTypes.func.isRequired,
    setRecoveryPhraseReminderLastShown: PropTypes.func.isRequired,
    setTermsOfUseLastAgreed: PropTypes.func.isRequired,
    showOutdatedBrowserWarning: PropTypes.bool.isRequired,
    setOutdatedBrowserWarningLastShown: PropTypes.func.isRequired,
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
    newNetworkAddedName: PropTypes.string,
    // This prop is used in the `shouldCloseNotificationPopup` function
    // eslint-disable-next-line react/no-unused-prop-types
    isSigningQRHardwareTransaction: PropTypes.bool.isRequired,
    newNftAddedMessage: PropTypes.string,
    setNewNftAddedMessage: PropTypes.func.isRequired,
    removeNftMessage: PropTypes.string,
    setRemoveNftMessage: PropTypes.func.isRequired,
    closeNotificationPopup: PropTypes.func.isRequired,
    newTokensImported: PropTypes.string,
    setNewTokensImported: PropTypes.func.isRequired,
    newNetworkAddedConfigurationId: PropTypes.string,
    clearNewNetworkAdded: PropTypes.func,
    setActiveNetwork: PropTypes.func,
    onboardedInThisUISession: PropTypes.bool,
    ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
    institutionalConnectRequests: PropTypes.arrayOf(PropTypes.object),
    mmiPortfolioEnabled: PropTypes.bool,
    mmiPortfolioUrl: PropTypes.string,
    modalOpen: PropTypes.bool,
    setWaitForConfirmDeepLinkDialog: PropTypes.func,
    waitForConfirmDeepLinkDialog: PropTypes.bool,
    ///: END:ONLY_INCLUDE_IN
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
      hasWatchAssetPendingApprovals,
      swapsFetchParams,
      unconfirmedTransactionsCount,
    } = this.props;

    if (shouldCloseNotificationPopup(props)) {
      this.state.notificationClosing = true;
      closeNotificationPopup();
    } else if (
      firstPermissionsRequestId ||
      unconfirmedTransactionsCount > 0 ||
      hasWatchAssetPendingApprovals ||
      (!isNotification &&
        (showAwaitingSwapScreen || haveSwapsQuotes || swapsFetchParams))
    ) {
      this.state.redirecting = true;
    }
  }

  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  checkInstitutionalConnectRequest() {
    const { history, institutionalConnectRequests } = this.props;
    if (
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
    } else if (
      institutionalConnectRequests.length > 0 &&
      institutionalConnectRequests[0].feature !== 'custodian'
    ) {
      history.push(CONFIRM_INSTITUTIONAL_FEATURE_CONNECT);
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
      return;
    }
  }
  ///: END:ONLY_INCLUDE_IN

  checkStatusAndNavigate() {
    const {
      firstPermissionsRequestId,
      history,
      isNotification,
      hasWatchAssetPendingApprovals,
      unconfirmedTransactionsCount,
      haveSwapsQuotes,
      showAwaitingSwapScreen,
      swapsFetchParams,
      pendingConfirmations,
    } = this.props;

    ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
    shouldCloseCurrentWindow();
    ///: END:ONLY_INCLUDE_IN

    if (!isNotification && showAwaitingSwapScreen) {
      history.push(AWAITING_SWAP_ROUTE);
    } else if (!isNotification && haveSwapsQuotes) {
      history.push(VIEW_QUOTE_ROUTE);
    } else if (!isNotification && swapsFetchParams) {
      history.push(BUILD_QUOTE_ROUTE);
    } else if (firstPermissionsRequestId) {
      history.push(`${CONNECT_ROUTE}/${firstPermissionsRequestId}`);
    } else if (unconfirmedTransactionsCount > 0) {
      history.push(CONFIRM_TRANSACTION_ROUTE);
    } else if (hasWatchAssetPendingApprovals) {
      history.push(CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE);
    } else if (pendingConfirmations.length > 0) {
      history.push(CONFIRMATION_V_NEXT_ROUTE);
    }
    ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
    checkInstitutionalConnectRequest();
    ///: END:ONLY_INCLUDE_IN
  }

  componentDidMount() {
    this.checkStatusAndNavigate();

    ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
    const { setWaitForConfirmDeepLinkDialog } = this.props;

    window.addEventListener('beforeunload', () => {
      // If user closes notification window manually, change waitForConfirmDeepLinkDialog to false
      setWaitForConfirmDeepLinkDialog(false);
    });
    ///: END:ONLY_INCLUDE_IN
  }

  static getDerivedStateFromProps(props) {
    if (shouldCloseNotificationPopup(props)) {
      return { notificationClosing: true };
    }
    return null;
  }

  componentDidUpdate(_prevProps, prevState) {
    const { closeNotificationPopup, isNotification } = this.props;
    const { notificationClosing } = this.state;

    if (notificationClosing && !prevState.notificationClosing) {
      closeNotificationPopup();
    } else if (isNotification) {
      this.checkStatusAndNavigate();
    }
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

  onOutdatedBrowserWarningClose = () => {
    const { setOutdatedBrowserWarningLastShown } = this.props;
    setOutdatedBrowserWarningLastShown(new Date().getTime());
  };

  renderNotifications() {
    const { t } = this.context;

    const {
      history,
      shouldShowSeedPhraseReminder,
      isPopup,
      shouldShowWeb3ShimUsageNotification,
      setWeb3ShimUsageAlertDismissed,
      originOfCurrentTab,
      disableWeb3ShimUsageAlert,
      ///: BEGIN:ONLY_INCLUDE_IN(snaps)
      removeSnapError,
      errorsToShow,
      shouldShowErrors,
      ///: END:ONLY_INCLUDE_IN
      infuraBlocked,
      showOutdatedBrowserWarning,
      newNftAddedMessage,
      setNewNftAddedMessage,
      newNetworkAddedName,
      removeNftMessage,
      setRemoveNftMessage,
      newTokensImported,
      setNewTokensImported,
      newNetworkAddedConfigurationId,
      clearNewNetworkAdded,
      setActiveNetwork,
    } = this.props;

    const onAutoHide = () => {
      setNewNftAddedMessage('');
      setRemoveNftMessage('');
    };

    const autoHideDelay = 5 * SECOND;

    return (
      <MultipleNotifications>
        {
          ///: BEGIN:ONLY_INCLUDE_IN(snaps)
          shouldShowErrors
            ? Object.entries(errorsToShow).map(([errorId, error]) => {
                return (
                  <HomeNotification
                    classNames={['home__error-message']}
                    infoText={error.data.snapId}
                    descriptionText={
                      <>
                        <Text
                          variant={TextVariant.bodyMd}
                          as="h5"
                          color={TextColor.textAlternative}
                        >
                          {t('somethingWentWrong')}
                        </Text>
                        <Text
                          color={TextColor.textAlternative}
                          variant={TextVariant.bodySm}
                          as="h6"
                        >
                          {t('snapError', [error.message, error.code])}
                        </Text>
                      </>
                    }
                    onIgnore={async () => {
                      await removeSnapError(errorId);
                    }}
                    ignoreText="Dismiss"
                    key="home-error-message"
                  />
                );
              })
            : null
          ///: END:ONLY_INCLUDE_IN
        }
        {newNftAddedMessage === 'success' ? (
          <ActionableMessage
            type="success"
            className="home__new-network-notification"
            autoHideTime={autoHideDelay}
            onAutoHide={onAutoHide}
            message={
              <Box display={DISPLAY.INLINE_FLEX}>
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
            type="danger"
            className="home__new-network-notification"
            autoHideTime={autoHideDelay}
            onAutoHide={onAutoHide}
            message={
              <Box display={DISPLAY.INLINE_FLEX}>
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
        {newNetworkAddedName ? (
          <ActionableMessage
            type="success"
            className="home__new-network-notification"
            message={
              <Box display={DISPLAY.INLINE_FLEX}>
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
        {newTokensImported ? (
          <ActionableMessage
            type="success"
            className="home__new-tokens-imported-notification"
            message={
              <Box display={DISPLAY.INLINE_FLEX}>
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
        {shouldShowSeedPhraseReminder ? (
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
        ) : null}
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
            descriptionText={t('outdatedBrowserNotification')}
            acceptText={t('gotIt')}
            onAccept={this.onOutdatedBrowserWarningClose}
            key="home-outdatedBrowserNotification"
          />
        ) : null}
        {newNetworkAddedConfigurationId && (
          <Popover className="home__new-network-added">
            <i className="fa fa-check-circle fa-2x home__new-network-added__check-circle" />
            <Text
              variant={TextVariant.headingSm}
              as="h4"
              marginTop={5}
              marginRight={9}
              marginLeft={9}
              marginBottom={0}
              fontWeight={FONT_WEIGHT.BOLD}
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
    const { t } = this.context;
    const {
      defaultHomeActiveTabName,
      onTabClick,
      forgottenPassword,
      history,
      connectedStatusPopoverHasBeenShown,
      isPopup,
      announcementsToShow,
      showWhatsNewPopup,
      hideWhatsNewPopup,
      showTermsOfUsePopup,
      seedPhraseBackedUp,
      showRecoveryPhraseReminder,
      firstTimeFlowType,
      completedOnboarding,
      onboardedInThisUISession,
      newNetworkAddedConfigurationId,
      ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
      mmiPortfolioEnabled,
      mmiPortfolioUrl,
      ///: END:ONLY_INCLUDE_IN
    } = this.props;

    if (forgottenPassword) {
      return <Redirect to={{ pathname: RESTORE_VAULT_ROUTE }} />;
    } else if (this.state.notificationClosing || this.state.redirecting) {
      return null;
    }

    const showWhatsNew =
      completedOnboarding &&
      (!onboardedInThisUISession || firstTimeFlowType === 'import') &&
      announcementsToShow &&
      showWhatsNewPopup &&
      !process.env.IN_TEST &&
      !newNetworkAddedConfigurationId;

    const showTermsOfUse =
      completedOnboarding && !onboardedInThisUISession && showTermsOfUsePopup;

    return (
      <div className="main-container">
        <Route path={CONNECTED_ROUTE} component={ConnectedSites} exact />
        <Route
          path={CONNECTED_ACCOUNTS_ROUTE}
          component={ConnectedAccounts}
          exact
        />
        <div className="home__container">
          {
            ///: BEGIN:ONLY_INCLUDE_IN(main,beta,flask)
            showWhatsNew ? <WhatsNewPopup onClose={hideWhatsNewPopup} /> : null
            ///: END:ONLY_INCLUDE_IN
          }
          {
            ///: BEGIN:ONLY_INCLUDE_IN(main,beta,flask)
            !showWhatsNew && showRecoveryPhraseReminder ? (
              <RecoveryPhraseReminder
                hasBackedUp={seedPhraseBackedUp}
                onConfirm={this.onRecoveryPhraseReminderClose}
              />
            ) : null
            ///: END:ONLY_INCLUDE_IN
          }
          {
            ///: BEGIN:ONLY_INCLUDE_IN(main,beta,flask)
            showTermsOfUse ? (
              <TermsOfUsePopup onAccept={this.onAcceptTermsOfUse} />
            ) : null
            ///: END:ONLY_INCLUDE_IN
          }
          {
            ///: BEGIN:ONLY_INCLUDE_IN(main,beta,flask)
            isPopup && !connectedStatusPopoverHasBeenShown
              ? this.renderPopover()
              : null
            ///: END:ONLY_INCLUDE_IN
          }
          <div className="home__main-view">
            {process.env.MULTICHAIN ? null : <MenuBar />}
            <div className="home__balance-wrapper">
              {
                ///: BEGIN:ONLY_INCLUDE_IN(main,beta,flask)
                <EthOverview />
                ///: END:ONLY_INCLUDE_IN
              }
              {
                ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
                <EthOverview
                  mmiPortfolioEnabled={mmiPortfolioEnabled}
                  mmiPortfolioUrl={mmiPortfolioUrl}
                />
                ///: END:ONLY_INCLUDE_IN
              }
            </div>
            <Tabs
              t={this.context.t}
              defaultActiveTabKey={defaultHomeActiveTabName}
              onTabClick={(tabName) => {
                onTabClick(tabName);
                let event;
                switch (tabName) {
                  case 'nfts':
                    event = MetaMetricsEventName.NftScreenOpened;
                    break;
                  case 'activity':
                    event = MetaMetricsEventName.ActivityScreenOpened;
                    break;
                  default:
                    event = MetaMetricsEventName.TokenScreenOpened;
                }
                this.context.trackEvent({
                  category: MetaMetricsEventCategory.Home,
                  event,
                });
              }}
              tabsClassName="home__tabs"
            >
              <Tab
                activeClassName="home__tab--active"
                className="home__tab"
                data-testid="home__asset-tab"
                name={this.context.t('assets')}
                tabKey="assets"
              >
                <AssetList
                  onClickAsset={(asset) =>
                    history.push(`${ASSET_ROUTE}/${asset}`)
                  }
                />
              </Tab>
              {
                ///: BEGIN:ONLY_INCLUDE_IN(main,beta,flask)
                <Tab
                  activeClassName="home__tab--active"
                  className="home__tab"
                  data-testid="home__nfts-tab"
                  name={this.context.t('nfts')}
                  tabKey="nfts"
                >
                  <NftsTab
                    onAddNFT={() => {
                      history.push(ADD_NFT_ROUTE);
                    }}
                  />
                </Tab>
                ///: END:ONLY_INCLUDE_IN
              }
              <Tab
                activeClassName="home__tab--active"
                className="home__tab"
                data-testid="home__activity-tab"
                name={t('activity')}
                tabKey="activity"
              >
                <TransactionList />
              </Tab>
            </Tabs>
            <div className="home__support">
              {
                ///: BEGIN:ONLY_INCLUDE_IN(build-main, build-mmi)
                t('needHelp', [
                  <a
                    href={SUPPORT_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    key="need-help-link"
                    onClick={() => {
                      this.context.trackEvent(
                        {
                          category: MetaMetricsEventCategory.Home,
                          event: MetaMetricsEventName.SupportLinkClicked,
                          properties: {
                            url: SUPPORT_LINK,
                          },
                        },
                        {
                          contextPropsIntoEventProperties: [
                            MetaMetricsContextProp.PageTitle,
                          ],
                        },
                      );
                    }}
                  >
                    {t('needHelpLinkText')}
                  </a>,
                ])
                ///: END:ONLY_INCLUDE_IN
              }
              {
                ///: BEGIN:ONLY_INCLUDE_IN(build-beta)
                <BetaHomeFooter />
                ///: END:ONLY_INCLUDE_IN
              }
              {
                ///: BEGIN:ONLY_INCLUDE_IN(build-flask)
                <FlaskHomeFooter />
                ///: END:ONLY_INCLUDE_IN
              }
            </div>
          </div>

          {this.renderNotifications()}
        </div>
      </div>
    );
  }
}
