import classnames from 'classnames';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { matchPath, Route, Switch } from 'react-router-dom';
import IdleTimer from 'react-idle-timer';
import { isEvmAccountType } from '@metamask/keyring-api';

import Swaps from '../swaps';
import ConfirmTransaction from '../confirmations/confirm-transaction';
import Home from '../home';
import {
  PermissionsPage,
  Connections,
} from '../../components/multichain/pages';
import Settings from '../settings';
import Authenticated from '../../helpers/higher-order-components/authenticated';
import Initialized from '../../helpers/higher-order-components/initialized';
import Lock from '../lock';
import PermissionsConnect from '../permissions-connect';
import RestoreVaultPage from '../keychains/restore-vault';
import RevealSeedConfirmation from '../keychains/reveal-seed';
import ConfirmAddSuggestedTokenPage from '../confirm-add-suggested-token';
import CreateAccountPage from '../create-account/create-account.component';
import ConfirmAddSuggestedNftPage from '../confirm-add-suggested-nft';
import Loading from '../../components/ui/loading-screen';
import LoadingNetwork from '../../components/app/loading-network-screen';
import { Modal } from '../../components/app/modals';
import Alert from '../../components/ui/alert';
import { SURVEY_LINK, PRIVACY_POLICY_LINK } from '../../../shared/lib/ui-utils';
import {
  AppHeader,
  AccountListMenu,
  NetworkListMenu,
  AccountDetails,
  ImportNftsModal,
  ImportTokensModal,
  ToastContainer,
  Toast,
} from '../../components/multichain';
import UnlockPage from '../unlock-page';
import Alerts from '../../components/app/alerts';
import Asset from '../asset';
import OnboardingAppHeader from '../onboarding-flow/onboarding-app-header/onboarding-app-header';
import TokenDetailsPage from '../token-details';
import Notifications from '../notifications';
import NotificationsSettings from '../notifications-settings';
import NotificationDetails from '../notification-details';
import SnapList from '../snaps/snaps-list';
import SnapView from '../snaps/snap-view';
///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
import InstitutionalEntityDonePage from '../institutional/institutional-entity-done-page';
import InteractiveReplacementTokenNotification from '../../components/institutional/interactive-replacement-token-notification';
import ConfirmAddCustodianToken from '../institutional/confirm-add-custodian-token';
import InteractiveReplacementTokenPage from '../institutional/interactive-replacement-token-page';
import CustodyPage from '../institutional/custody';
///: END:ONLY_INCLUDE_IF

import {
  ASSET_ROUTE,
  CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE,
  CONFIRM_ADD_SUGGESTED_NFT_ROUTE,
  CONFIRM_TRANSACTION_ROUTE,
  CONNECT_ROUTE,
  DEFAULT_ROUTE,
  LOCK_ROUTE,
  NEW_ACCOUNT_ROUTE,
  RESTORE_VAULT_ROUTE,
  REVEAL_SEED_ROUTE,
  SEND_ROUTE,
  SWAPS_ROUTE,
  SETTINGS_ROUTE,
  UNLOCK_ROUTE,
  BUILD_QUOTE_ROUTE,
  CONFIRMATION_V_NEXT_ROUTE,
  ONBOARDING_ROUTE,
  ONBOARDING_UNLOCK_ROUTE,
  TOKEN_DETAILS,
  CONNECTIONS,
  PERMISSIONS,
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  INSTITUTIONAL_FEATURES_DONE_ROUTE,
  CUSTODY_ACCOUNT_DONE_ROUTE,
  CONFIRM_ADD_CUSTODIAN_TOKEN,
  INTERACTIVE_REPLACEMENT_TOKEN_PAGE,
  CUSTODY_ACCOUNT_ROUTE,
  ///: END:ONLY_INCLUDE_IF
  SNAPS_ROUTE,
  SNAPS_VIEW_ROUTE,
  NOTIFICATIONS_ROUTE,
  NOTIFICATIONS_SETTINGS_ROUTE,
  CROSS_CHAIN_SWAP_ROUTE,
} from '../../helpers/constants/routes';

import {
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_POPUP,
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES,
  ///: END:ONLY_INCLUDE_IF
} from '../../../shared/constants/app';
import { NETWORK_TYPES } from '../../../shared/constants/network';
import { getEnvironmentType } from '../../../app/scripts/lib/util';
import ConfirmationPage from '../confirmations/confirmation';
import OnboardingFlow from '../onboarding-flow/onboarding-flow';
import QRHardwarePopover from '../../components/app/qr-hardware-popover';
import { SEND_STAGES } from '../../ducks/send';
import DeprecatedNetworks from '../../components/ui/deprecated-networks/deprecated-networks';
import NewNetworkInfo from '../../components/ui/new-network-info/new-network-info';
import { ThemeType } from '../../../shared/constants/preferences';
import {
  AvatarAccount,
  AvatarAccountSize,
  AvatarNetwork,
  Box,
  Icon,
  IconName,
} from '../../components/component-library';
import { ToggleIpfsModal } from '../../components/app/assets/nfts/nft-default-image/toggle-ipfs-modal';
import { BasicConfigurationModal } from '../../components/app/basic-configuration-modal';
///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import KeyringSnapRemovalResult from '../../components/app/modals/keyring-snap-removal-modal';
///: END:ONLY_INCLUDE_IF

import { SendPage } from '../../components/multichain/pages/send';
import { DeprecatedNetworkModal } from '../settings/deprecated-network-modal/DeprecatedNetworkModal';
import { getURLHost } from '../../helpers/utils/util';
import {
  BorderColor,
  BorderRadius,
  IconColor,
  TextVariant,
} from '../../helpers/constants/design-system';
import { MILLISECOND, SECOND } from '../../../shared/constants/time';
import { MultichainMetaFoxLogo } from '../../components/multichain/app-header/multichain-meta-fox-logo';
import NetworkConfirmationPopover from '../../components/multichain/network-list-menu/network-confirmation-popover/network-confirmation-popover';
import NftFullImage from '../../components/app/assets/nfts/nft-details/nft-full-image';
import CrossChainSwap from '../bridge';

const isConfirmTransactionRoute = (pathname) =>
  Boolean(
    matchPath(pathname, {
      path: CONFIRM_TRANSACTION_ROUTE,
      exact: false,
    }),
  );

export default class Routes extends Component {
  static propTypes = {
    currentCurrency: PropTypes.string,
    account: PropTypes.object,
    activeTabOrigin: PropTypes.string,
    showConnectAccountToast: PropTypes.bool.isRequired,
    setCurrentCurrencyToUSD: PropTypes.func,
    isLoading: PropTypes.bool,
    loadingMessage: PropTypes.string,
    alertMessage: PropTypes.string,
    textDirection: PropTypes.string,
    isNetworkLoading: PropTypes.bool,
    alertOpen: PropTypes.bool,
    isUnlocked: PropTypes.bool,
    setLastActiveTime: PropTypes.func,
    history: PropTypes.object,
    location: PropTypes.object,
    lockMetaMask: PropTypes.func,
    providerId: PropTypes.string,
    providerType: PropTypes.string,
    autoLockTimeLimit: PropTypes.number,
    pageChanged: PropTypes.func.isRequired,
    prepareToLeaveSwaps: PropTypes.func,
    browserEnvironmentOs: PropTypes.string,
    browserEnvironmentBrowser: PropTypes.string,
    theme: PropTypes.string,
    sendStage: PropTypes.string,
    isNetworkUsed: PropTypes.bool,
    allAccountsOnNetworkAreEmpty: PropTypes.bool,
    isTestNet: PropTypes.bool,
    showExtensionInFullSizeView: PropTypes.bool,
    currentChainId: PropTypes.string,
    shouldShowSeedPhraseReminder: PropTypes.bool,
    forgottenPassword: PropTypes.bool,
    isCurrentProviderCustom: PropTypes.bool,
    completedOnboarding: PropTypes.bool,
    isAccountMenuOpen: PropTypes.bool,
    toggleAccountMenu: PropTypes.func,
    isNetworkMenuOpen: PropTypes.bool,
    toggleNetworkMenu: PropTypes.func,
    accountDetailsAddress: PropTypes.string,
    isImportNftsModalOpen: PropTypes.bool.isRequired,
    hideImportNftsModal: PropTypes.func.isRequired,
    isIpfsModalOpen: PropTypes.bool.isRequired,
    isBasicConfigurationModalOpen: PropTypes.bool.isRequired,
    hideIpfsModal: PropTypes.func.isRequired,
    isImportTokensModalOpen: PropTypes.bool.isRequired,
    hideImportTokensModal: PropTypes.func.isRequired,
    isDeprecatedNetworkModalOpen: PropTypes.bool.isRequired,
    hideDeprecatedNetworkModal: PropTypes.func.isRequired,
    addPermittedAccount: PropTypes.func.isRequired,
    switchedNetworkDetails: PropTypes.object,
    useNftDetection: PropTypes.bool,
    showNftEnablementToast: PropTypes.bool,
    setHideNftEnablementToast: PropTypes.func.isRequired,
    clearSwitchedNetworkDetails: PropTypes.func.isRequired,
    setSwitchedNetworkNeverShowMessage: PropTypes.func.isRequired,
    networkToAutomaticallySwitchTo: PropTypes.object,
    neverShowSwitchedNetworkMessage: PropTypes.bool.isRequired,
    automaticallySwitchNetwork: PropTypes.func.isRequired,
    totalUnapprovedConfirmationCount: PropTypes.number.isRequired,
    currentExtensionPopupId: PropTypes.number,
    useRequestQueue: PropTypes.bool,
    showSurveyToast: PropTypes.bool.isRequired,
    networkMenuRedesign: PropTypes.bool.isRequired,
    showPrivacyPolicyToast: PropTypes.bool.isRequired,
    newPrivacyPolicyToastShownDate: PropTypes.number,
    setSurveyLinkLastClickedOrClosed: PropTypes.func.isRequired,
    setNewPrivacyPolicyToastShownDate: PropTypes.func.isRequired,
    clearEditedNetwork: PropTypes.func.isRequired,
    setNewPrivacyPolicyToastClickedOrClosed: PropTypes.func.isRequired,
    ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
    isShowKeyringSnapRemovalResultModal: PropTypes.bool.isRequired,
    hideShowKeyringSnapRemovalResultModal: PropTypes.func.isRequired,
    pendingConfirmations: PropTypes.array.isRequired,
    ///: END:ONLY_INCLUDE_IF
  };

  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  };

  state = {
    hideConnectAccountToast: false,
  };

  getTheme() {
    const { theme } = this.props;
    if (theme === ThemeType.os) {
      if (window?.matchMedia('(prefers-color-scheme: dark)')?.matches) {
        return ThemeType.dark;
      }
      return ThemeType.light;
    }
    return theme;
  }

  setTheme() {
    const theme = this.getTheme();
    document.documentElement.setAttribute('data-theme', theme);
  }

  componentDidMount() {
    this.updateNewPrivacyPolicyToastDate();
  }

  componentDidUpdate(prevProps) {
    const {
      theme,
      account,
      networkToAutomaticallySwitchTo,
      activeTabOrigin,
      totalUnapprovedConfirmationCount,
      isUnlocked,
      useRequestQueue,
      currentExtensionPopupId,
    } = this.props;
    if (theme !== prevProps.theme) {
      this.setTheme();
    }

    if (prevProps.account?.address !== account?.address) {
      this.setState({ hideConnectAccountToast: false });
    }

    // Automatically switch the network if the user
    // no longer has unapproved transactions and they
    // should be on a different network for the
    // currently active tab's dapp
    if (
      networkToAutomaticallySwitchTo &&
      totalUnapprovedConfirmationCount === 0 &&
      (prevProps.totalUnapprovedConfirmationCount > 0 ||
        (prevProps.isUnlocked === false && isUnlocked))
    ) {
      this.props.automaticallySwitchNetwork(
        networkToAutomaticallySwitchTo,
        activeTabOrigin,
      );
    }

    // Terminate the popup when another popup is opened
    // if the user is using RPC queueing
    if (
      useRequestQueue &&
      currentExtensionPopupId !== undefined &&
      global.metamask.id !== undefined &&
      currentExtensionPopupId !== global.metamask.id
    ) {
      window.close();
    }
  }

  UNSAFE_componentWillMount() {
    const {
      currentCurrency,
      pageChanged,
      setCurrentCurrencyToUSD,
      history,
      showExtensionInFullSizeView,
    } = this.props;

    const windowType = getEnvironmentType();
    if (showExtensionInFullSizeView && windowType === ENVIRONMENT_TYPE_POPUP) {
      global.platform.openExtensionInBrowser();
    }

    if (!currentCurrency) {
      setCurrentCurrencyToUSD();
    }

    history.listen((locationObj, action) => {
      if (action === 'PUSH') {
        pageChanged(locationObj.pathname);
      }
    });

    this.setTheme();
  }

  renderRoutes() {
    const { autoLockTimeLimit, setLastActiveTime, forgottenPassword } =
      this.props;
    const RestoreVaultComponent = forgottenPassword ? Route : Initialized;

    const routes = (
      <Switch>
        <Route path={ONBOARDING_ROUTE} component={OnboardingFlow} />
        <Route path={LOCK_ROUTE} component={Lock} exact />
        <Initialized path={UNLOCK_ROUTE} component={UnlockPage} exact />
        <RestoreVaultComponent
          path={RESTORE_VAULT_ROUTE}
          component={RestoreVaultPage}
          exact
        />
        <Authenticated
          path={REVEAL_SEED_ROUTE}
          component={RevealSeedConfirmation}
          exact
        />
        <Authenticated path={SETTINGS_ROUTE} component={Settings} />
        <Authenticated
          path={NOTIFICATIONS_SETTINGS_ROUTE}
          component={NotificationsSettings}
        />
        <Authenticated
          path={`${NOTIFICATIONS_ROUTE}/:uuid`}
          component={NotificationDetails}
        />
        <Authenticated path={NOTIFICATIONS_ROUTE} component={Notifications} />
        <Authenticated exact path={SNAPS_ROUTE} component={SnapList} />
        <Authenticated path={SNAPS_VIEW_ROUTE} component={SnapView} />
        <Authenticated
          path={`${CONFIRM_TRANSACTION_ROUTE}/:id?`}
          component={ConfirmTransaction}
        />
        <Authenticated path={SEND_ROUTE} component={SendPage} exact />
        <Authenticated
          path={`${TOKEN_DETAILS}/:address/`}
          component={TokenDetailsPage}
          exact
        />
        <Authenticated path={SWAPS_ROUTE} component={Swaps} />
        <Authenticated
          path={CROSS_CHAIN_SWAP_ROUTE}
          component={CrossChainSwap}
        />
        <Authenticated
          path={CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE}
          component={ConfirmAddSuggestedTokenPage}
          exact
        />
        <Authenticated
          path={CONFIRM_ADD_SUGGESTED_NFT_ROUTE}
          component={ConfirmAddSuggestedNftPage}
          exact
        />
        <Authenticated
          path={`${CONFIRMATION_V_NEXT_ROUTE}/:id?`}
          component={ConfirmationPage}
        />
        {
          ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
        }
        <Authenticated
          path={CUSTODY_ACCOUNT_DONE_ROUTE}
          component={InstitutionalEntityDonePage}
          exact
        />
        <Authenticated
          path={INSTITUTIONAL_FEATURES_DONE_ROUTE}
          component={InstitutionalEntityDonePage}
          exact
        />
        <Authenticated
          path={CONFIRM_ADD_CUSTODIAN_TOKEN}
          component={ConfirmAddCustodianToken}
          exact
        />
        <Authenticated
          path={INTERACTIVE_REPLACEMENT_TOKEN_PAGE}
          component={InteractiveReplacementTokenPage}
          exact
        />
        <Authenticated
          path={CONFIRM_ADD_CUSTODIAN_TOKEN}
          component={ConfirmAddCustodianToken}
        />
        <Authenticated
          path={CUSTODY_ACCOUNT_ROUTE}
          component={CustodyPage}
          exact
        />
        {
          ///: END:ONLY_INCLUDE_IF
        }
        <Authenticated path={NEW_ACCOUNT_ROUTE} component={CreateAccountPage} />
        <Authenticated
          path={`${CONNECT_ROUTE}/:id`}
          component={PermissionsConnect}
        />
        <Authenticated
          path={`${ASSET_ROUTE}/image/:asset/:id`}
          component={NftFullImage}
        />

        <Authenticated path={`${ASSET_ROUTE}/:asset/:id`} component={Asset} />
        <Authenticated path={`${ASSET_ROUTE}/:asset/`} component={Asset} />
        <Authenticated
          path={`${CONNECTIONS}/:origin`}
          component={Connections}
        />
        <Authenticated path={PERMISSIONS} component={PermissionsPage} exact />
        <Authenticated path={DEFAULT_ROUTE} component={Home} />
      </Switch>
    );

    if (autoLockTimeLimit > 0) {
      return (
        <IdleTimer onAction={setLastActiveTime} throttle={1000}>
          {routes}
        </IdleTimer>
      );
    }

    return routes;
  }

  onInitializationUnlockPage() {
    const { location } = this.props;
    return Boolean(
      matchPath(location.pathname, {
        path: ONBOARDING_UNLOCK_ROUTE,
        exact: true,
      }),
    );
  }

  onConfirmPage() {
    const { location } = this.props;
    return Boolean(
      matchPath(location.pathname, {
        path: CONFIRM_TRANSACTION_ROUTE,
        exact: false,
      }),
    );
  }

  onEditTransactionPage() {
    return (
      this.props.sendStage === SEND_STAGES.EDIT ||
      this.props.sendStage === SEND_STAGES.DRAFT ||
      this.props.sendStage === SEND_STAGES.ADD_RECIPIENT
    );
  }

  onSwapsPage() {
    const { location } = this.props;
    return Boolean(
      matchPath(location.pathname, { path: SWAPS_ROUTE, exact: false }),
    );
  }

  onSwapsBuildQuotePage() {
    const { location } = this.props;
    return Boolean(
      matchPath(location.pathname, { path: BUILD_QUOTE_ROUTE, exact: false }),
    );
  }

  onHomeScreen() {
    const { location } = this.props;
    return location.pathname === DEFAULT_ROUTE;
  }

  hideAppHeader() {
    const { location } = this.props;

    const isNotificationsPage = Boolean(
      matchPath(location.pathname, {
        path: `${NOTIFICATIONS_ROUTE}`,
        exact: false,
      }),
    );

    if (isNotificationsPage) {
      return true;
    }

    const isInitializing = Boolean(
      matchPath(location.pathname, {
        path: ONBOARDING_ROUTE,
        exact: false,
      }),
    );

    if (isInitializing && !this.onInitializationUnlockPage()) {
      return true;
    }

    const windowType = getEnvironmentType();

    if (windowType === ENVIRONMENT_TYPE_NOTIFICATION) {
      return true;
    }

    const isPermissionsPage = Boolean(
      matchPath(location.pathname, {
        path: PERMISSIONS,
        exact: false,
      }),
    );

    if (isPermissionsPage) {
      return true;
    }

    const isConnectionsPage = Boolean(
      matchPath(location.pathname, {
        path: CONNECTIONS,
        exact: false,
      }),
    );

    if (isConnectionsPage) {
      return true;
    }

    if (windowType === ENVIRONMENT_TYPE_POPUP && this.onConfirmPage()) {
      return true;
    }

    const isHandlingPermissionsRequest = Boolean(
      matchPath(location.pathname, {
        path: CONNECT_ROUTE,
        exact: false,
      }),
    );

    const isMultichainSend = Boolean(
      matchPath(location.pathname, {
        path: SEND_ROUTE,
        exact: false,
      }),
    );
    if (isMultichainSend) {
      return true;
    }

    const isSnapsHome = Boolean(
      matchPath(location.pathname, {
        path: SNAPS_VIEW_ROUTE,
        exact: false,
      }),
    );
    if (isSnapsHome) {
      return true;
    }

    const isHandlingAddEthereumChainRequest = Boolean(
      matchPath(location.pathname, {
        path: CONFIRMATION_V_NEXT_ROUTE,
        exact: false,
      }),
    );

    return (
      isHandlingPermissionsRequest ||
      isHandlingAddEthereumChainRequest ||
      isConfirmTransactionRoute(this.pathname)
    );
  }

  showOnboardingHeader() {
    const { location } = this.props;

    return Boolean(
      matchPath(location.pathname, {
        path: ONBOARDING_ROUTE,
        exact: false,
      }),
    );
  }

  onAppHeaderClick = async () => {
    const { prepareToLeaveSwaps } = this.props;
    if (this.onSwapsPage()) {
      await prepareToLeaveSwaps();
    }
  };

  renderToasts() {
    const { t } = this.context;
    const {
      account,
      activeTabOrigin,
      addPermittedAccount,
      showSurveyToast,
      showConnectAccountToast,
      showPrivacyPolicyToast,
      newPrivacyPolicyToastShownDate,
      clearSwitchedNetworkDetails,
      setSurveyLinkLastClickedOrClosed,
      setNewPrivacyPolicyToastClickedOrClosed,
      setSwitchedNetworkNeverShowMessage,
      switchedNetworkDetails,
      useNftDetection,
      showNftEnablementToast,
      setHideNftEnablementToast,
    } = this.props;

    const showAutoNetworkSwitchToast = this.getShowAutoNetworkSwitchTest();
    const isPrivacyToastRecent = this.getIsPrivacyToastRecent();
    const isPrivacyToastNotShown = !newPrivacyPolicyToastShownDate;
    const isEvmAccount = isEvmAccountType(account?.type);

    const autoHideToastDelay = 5 * SECOND;

    const onAutoHideToast = () => {
      setHideNftEnablementToast(false);
    };
    if (!this.onHomeScreen()) {
      return null;
    }

    return (
      <ToastContainer>
        {showConnectAccountToast &&
        !this.state.hideConnectAccountToast &&
        isEvmAccount ? (
          <Toast
            dataTestId="connect-account-toast"
            key="connect-account-toast"
            startAdornment={
              <AvatarAccount
                address={account.address}
                size={AvatarAccountSize.Md}
                borderColor={BorderColor.transparent}
              />
            }
            text={this.context.t('accountIsntConnectedToastText', [
              account?.metadata?.name,
              getURLHost(activeTabOrigin),
            ])}
            actionText={this.context.t('connectAccount')}
            onActionClick={() => {
              // Connect this account
              addPermittedAccount(activeTabOrigin, account.address);
              // Use setTimeout to prevent React re-render from
              // hiding the tooltip
              setTimeout(() => {
                // Trigger a mouseenter on the header's connection icon
                // to display the informative connection tooltip
                document
                  .querySelector(
                    '[data-testid="connection-menu"] [data-tooltipped]',
                  )
                  ?.dispatchEvent(new CustomEvent('mouseenter', {}));
              }, 250 * MILLISECOND);
            }}
            onClose={() => this.setState({ hideConnectAccountToast: true })}
          />
        ) : null}
        {showSurveyToast && (
          <Toast
            key="survey-toast"
            startAdornment={
              <Icon name={IconName.Heart} color={IconColor.errorDefault} />
            }
            text={t('surveyTitle')}
            actionText={t('surveyConversion')}
            onActionClick={() => {
              global.platform.openTab({
                url: SURVEY_LINK,
              });
              setSurveyLinkLastClickedOrClosed(Date.now());
            }}
            onClose={() => {
              setSurveyLinkLastClickedOrClosed(Date.now());
            }}
          />
        )}
        {showPrivacyPolicyToast &&
          (isPrivacyToastRecent || isPrivacyToastNotShown) && (
            <Toast
              key="privacy-policy-toast"
              startAdornment={
                <Icon name={IconName.Info} color={IconColor.iconDefault} />
              }
              text={t('newPrivacyPolicyTitle')}
              actionText={t('newPrivacyPolicyActionButton')}
              onActionClick={() => {
                global.platform.openTab({
                  url: PRIVACY_POLICY_LINK,
                });
                setNewPrivacyPolicyToastClickedOrClosed();
              }}
              onClose={() => {
                setNewPrivacyPolicyToastClickedOrClosed();
              }}
            />
          )}
        {showAutoNetworkSwitchToast ? (
          <Toast
            key="switched-network-toast"
            startAdornment={
              <AvatarNetwork
                size={AvatarAccountSize.Md}
                borderColor={BorderColor.transparent}
                src={switchedNetworkDetails?.imageUrl}
                name={switchedNetworkDetails?.nickname}
              />
            }
            text={this.context.t('switchedNetworkToastMessage', [
              switchedNetworkDetails.nickname,
              getURLHost(switchedNetworkDetails.origin),
            ])}
            actionText={this.context.t('switchedNetworkToastDecline')}
            onActionClick={() => setSwitchedNetworkNeverShowMessage()}
            onClose={() => clearSwitchedNetworkDetails()}
          />
        ) : null}
        {showNftEnablementToast && useNftDetection ? (
          <Toast
            key="enabled-nft-auto-detection"
            startAdornment={
              <Icon name={IconName.CheckBold} color={IconColor.iconDefault} />
            }
            text={this.context.t('nftAutoDetectionEnabled')}
            borderRadius={BorderRadius.LG}
            textVariant={TextVariant.bodyMd}
            autoHideTime={autoHideToastDelay}
            onAutoHideToast={onAutoHideToast}
          />
        ) : null}
      </ToastContainer>
    );
  }

  updateNewPrivacyPolicyToastDate() {
    const {
      showPrivacyPolicyToast,
      newPrivacyPolicyToastShownDate,
      setNewPrivacyPolicyToastShownDate,
    } = this.props;

    if (showPrivacyPolicyToast && !newPrivacyPolicyToastShownDate) {
      setNewPrivacyPolicyToastShownDate(Date.now());
    }
  }

  getIsPrivacyToastRecent() {
    const { newPrivacyPolicyToastShownDate } = this.props;

    const currentDate = new Date();
    const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
    const newPrivacyPolicyToastShownDateObj = new Date(
      newPrivacyPolicyToastShownDate,
    );
    const toastWasShownLessThanADayAgo =
      currentDate - newPrivacyPolicyToastShownDateObj < oneDayInMilliseconds;

    return toastWasShownLessThanADayAgo;
  }

  getShowAutoNetworkSwitchTest() {
    return (
      this.props.switchedNetworkDetails &&
      !this.props.neverShowSwitchedNetworkMessage
    );
  }

  render() {
    const {
      isLoading,
      isUnlocked,
      alertMessage,
      textDirection,
      loadingMessage,
      isNetworkLoading,
      browserEnvironmentOs: os,
      browserEnvironmentBrowser: browser,
      isNetworkUsed,
      allAccountsOnNetworkAreEmpty,
      isTestNet,
      currentChainId,
      shouldShowSeedPhraseReminder,
      isCurrentProviderCustom,
      completedOnboarding,
      isAccountMenuOpen,
      toggleAccountMenu,
      isNetworkMenuOpen,
      toggleNetworkMenu,
      accountDetailsAddress,
      isImportTokensModalOpen,
      isDeprecatedNetworkModalOpen,
      location,
      isImportNftsModalOpen,
      hideImportNftsModal,
      isIpfsModalOpen,
      isBasicConfigurationModalOpen,
      hideIpfsModal,
      hideImportTokensModal,
      hideDeprecatedNetworkModal,
      switchedNetworkDetails,
      clearSwitchedNetworkDetails,
      networkMenuRedesign,
      clearEditedNetwork,
      ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
      isShowKeyringSnapRemovalResultModal,
      hideShowKeyringSnapRemovalResultModal,
      pendingConfirmations,
      ///: END:ONLY_INCLUDE_IF
    } = this.props;

    const loadMessage =
      loadingMessage || isNetworkLoading
        ? this.getConnectingLabel(loadingMessage)
        : null;

    // Conditions for displaying the Send route
    const isSendRoute = matchPath(location.pathname, {
      path: SEND_ROUTE,
      exact: false,
    });
    const shouldShowNetworkInfo =
      isUnlocked &&
      currentChainId &&
      !isTestNet &&
      !isSendRoute &&
      !isNetworkUsed &&
      !isCurrentProviderCustom &&
      completedOnboarding &&
      allAccountsOnNetworkAreEmpty &&
      switchedNetworkDetails === null;

    const windowType = getEnvironmentType();

    const shouldShowNetworkDeprecationWarning =
      windowType !== ENVIRONMENT_TYPE_NOTIFICATION &&
      isUnlocked &&
      !shouldShowSeedPhraseReminder;

    let isLoadingShown = isLoading && completedOnboarding;

    ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
    isLoadingShown =
      isLoading &&
      completedOnboarding &&
      !pendingConfirmations.some(
        (confirmation) =>
          confirmation.type ===
          SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showSnapAccountRedirect,
      );
    ///: END:ONLY_INCLUDE_IF

    const showAutoNetworkSwitchToast = this.getShowAutoNetworkSwitchTest();

    return (
      <div
        className={classnames('app', {
          [`os-${os}`]: os,
          [`browser-${browser}`]: browser,
        })}
        dir={textDirection}
        onMouseUp={
          showAutoNetworkSwitchToast
            ? () => clearSwitchedNetworkDetails()
            : undefined
        }
      >
        {shouldShowNetworkDeprecationWarning ? <DeprecatedNetworks /> : null}
        {location.pathname === DEFAULT_ROUTE && shouldShowNetworkInfo ? (
          <NewNetworkInfo />
        ) : null}
        <QRHardwarePopover />
        <Modal />
        <Alert visible={this.props.alertOpen} msg={alertMessage} />
        {!this.hideAppHeader() && <AppHeader location={location} />}
        {isConfirmTransactionRoute(this.pathname) && <MultichainMetaFoxLogo />}
        {this.showOnboardingHeader() && <OnboardingAppHeader />}
        {
          ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
          isUnlocked ? <InteractiveReplacementTokenNotification /> : null
          ///: END:ONLY_INCLUDE_IF
        }
        {isAccountMenuOpen ? (
          <AccountListMenu onClose={() => toggleAccountMenu()} />
        ) : null}
        {isNetworkMenuOpen ? (
          <NetworkListMenu
            onClose={() => {
              toggleNetworkMenu();
              clearEditedNetwork();
            }}
          />
        ) : null}
        {networkMenuRedesign ? <NetworkConfirmationPopover /> : null}
        {accountDetailsAddress ? (
          <AccountDetails address={accountDetailsAddress} />
        ) : null}
        {isImportNftsModalOpen ? (
          <ImportNftsModal onClose={() => hideImportNftsModal()} />
        ) : null}
        {isIpfsModalOpen ? (
          <ToggleIpfsModal onClose={() => hideIpfsModal()} />
        ) : null}
        {isBasicConfigurationModalOpen ? <BasicConfigurationModal /> : null}
        {isImportTokensModalOpen ? (
          <ImportTokensModal onClose={() => hideImportTokensModal()} />
        ) : null}
        {isDeprecatedNetworkModalOpen ? (
          <DeprecatedNetworkModal
            onClose={() => hideDeprecatedNetworkModal()}
          />
        ) : null}
        {
          ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
          isShowKeyringSnapRemovalResultModal && (
            <KeyringSnapRemovalResult
              isOpen={isShowKeyringSnapRemovalResultModal}
              onClose={() => hideShowKeyringSnapRemovalResultModal()}
            />
          )
          ///: END:ONLY_INCLUDE_IF
        }
        <Box className="main-container-wrapper">
          {isLoadingShown ? <Loading loadingMessage={loadMessage} /> : null}
          {!isLoading && isNetworkLoading && completedOnboarding ? (
            <LoadingNetwork />
          ) : null}
          {this.renderRoutes()}
        </Box>
        {isUnlocked ? <Alerts history={this.props.history} /> : null}
        {this.renderToasts()}
      </div>
    );
  }

  toggleMetamaskActive() {
    if (this.props.isUnlocked) {
      // currently active: deactivate
      this.props.lockMetaMask();
    } else {
      // currently inactive: redirect to password box
      const passwordBox = document.querySelector('input[type=password]');
      if (!passwordBox) {
        return;
      }
      passwordBox.focus();
    }
  }

  getConnectingLabel(loadingMessage) {
    if (loadingMessage) {
      return loadingMessage;
    }
    const { providerType, providerId } = this.props;
    const { t } = this.context;

    switch (providerType) {
      case NETWORK_TYPES.MAINNET:
        return t('connectingToMainnet');
      case NETWORK_TYPES.GOERLI:
        return t('connectingToGoerli');
      case NETWORK_TYPES.SEPOLIA:
        return t('connectingToSepolia');
      case NETWORK_TYPES.LINEA_GOERLI:
        return t('connectingToLineaGoerli');
      case NETWORK_TYPES.LINEA_SEPOLIA:
        return t('connectingToLineaSepolia');
      case NETWORK_TYPES.LINEA_MAINNET:
        return t('connectingToLineaMainnet');
      default:
        return t('connectingTo', [providerId]);
    }
  }
}
