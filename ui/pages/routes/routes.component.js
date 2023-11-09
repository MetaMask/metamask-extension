import classnames from 'classnames';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { matchPath, Route, Switch } from 'react-router-dom';
import IdleTimer from 'react-idle-timer';

///: BEGIN:ONLY_INCLUDE_IF(desktop)
import browserAPI from 'webextension-polyfill';
///: END:ONLY_INCLUDE_IF

import SendTransactionScreen from '../send';
import Swaps from '../swaps';
import ConfirmTransaction from '../confirm-transaction';
import Home from '../home';
import { AllConnections, Connections } from '../../components/multichain/pages';
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
import {
  AppHeader,
  AccountListMenu,
  NetworkListMenu,
  AccountDetails,
  ImportNftsModal,
  ImportTokensModal,
  SelectActionModal,
  AppFooter,
} from '../../components/multichain';
import UnlockPage from '../unlock-page';
import Alerts from '../../components/app/alerts';
import Asset from '../asset';
import OnboardingAppHeader from '../onboarding-flow/onboarding-app-header/onboarding-app-header';
import TokenDetailsPage from '../token-details';
///: BEGIN:ONLY_INCLUDE_IF(snaps)
import Notifications from '../notifications';
import SnapList from '../snaps/snaps-list';
import SnapView from '../snaps/snap-view';
///: END:ONLY_INCLUDE_IF
///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import AddSnapAccountPage from '../keyring-snaps/add-snap-account';
///: END:ONLY_INCLUDE_IF
///: BEGIN:ONLY_INCLUDE_IF(desktop)
import { registerOnDesktopDisconnect } from '../../hooks/desktopHooks';
import DesktopErrorPage from '../desktop-error';
import DesktopPairingPage from '../desktop-pairing';
///: END:ONLY_INCLUDE_IF
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
  ALL_CONNECTIONS,
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  INSTITUTIONAL_FEATURES_DONE_ROUTE,
  CUSTODY_ACCOUNT_DONE_ROUTE,
  CONFIRM_ADD_CUSTODIAN_TOKEN,
  INTERACTIVE_REPLACEMENT_TOKEN_PAGE,
  CUSTODY_ACCOUNT_ROUTE,
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(snaps)
  NOTIFICATIONS_ROUTE,
  SNAPS_ROUTE,
  SNAPS_VIEW_ROUTE,
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  ADD_SNAP_ACCOUNT_ROUTE,
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(desktop)
  DESKTOP_PAIRING_ROUTE,
  DESKTOP_ERROR_ROUTE,
  ///: END:ONLY_INCLUDE_IF
} from '../../helpers/constants/routes';

///: BEGIN:ONLY_INCLUDE_IF(desktop)
import { EXTENSION_ERROR_PAGE_TYPES } from '../../../shared/constants/desktop';
///: END:ONLY_INCLUDE_IF

import {
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_POPUP,
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES,
  ///: END:ONLY_INCLUDE_IF
} from '../../../shared/constants/app';
import { NETWORK_TYPES } from '../../../shared/constants/network';
import { getEnvironmentType } from '../../../app/scripts/lib/util';
import ConfirmationPage from '../confirmation';
import OnboardingFlow from '../onboarding-flow/onboarding-flow';
import QRHardwarePopover from '../../components/app/qr-hardware-popover';
import { SEND_STAGES } from '../../ducks/send';
import DeprecatedNetworks from '../../components/ui/deprecated-networks/deprecated-networks';
import NewNetworkInfo from '../../components/ui/new-network-info/new-network-info';
import { ThemeType } from '../../../shared/constants/preferences';
import { Box } from '../../components/component-library';
import { ToggleIpfsModal } from '../../components/app/nft-default-image/toggle-ipfs-modal';
///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import KeyringSnapRemovalResult from '../../components/app/modals/keyring-snap-removal-modal';
///: END:ONLY_INCLUDE_IF

import { SendPage } from '../../components/multichain/pages/send';

export default class Routes extends Component {
  static propTypes = {
    currentCurrency: PropTypes.string,
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
    hideIpfsModal: PropTypes.func.isRequired,
    isImportTokensModalOpen: PropTypes.bool.isRequired,
    hideImportTokensModal: PropTypes.func.isRequired,
    isSelectActionModalOpen: PropTypes.bool.isRequired,
    hideSelectActionModal: PropTypes.func.isRequired,
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

  handleOsTheme() {
    const osTheme = window?.matchMedia('(prefers-color-scheme: dark)')?.matches
      ? ThemeType.dark
      : ThemeType.light;

    document.documentElement.setAttribute('data-theme', osTheme);
  }

  ///: BEGIN:ONLY_INCLUDE_IF(desktop)
  componentDidMount() {
    const { history } = this.props;
    browserAPI.runtime.onMessage.addListener(
      registerOnDesktopDisconnect(history),
    );
  }

  componentWillUnmount() {
    const { history } = this.props;
    browserAPI.runtime.onMessage.removeListener(
      registerOnDesktopDisconnect(history),
    );
  }
  ///: END:ONLY_INCLUDE_IF

  componentDidUpdate(prevProps) {
    const { theme } = this.props;

    if (theme !== prevProps.theme) {
      if (theme === ThemeType.os) {
        this.handleOsTheme();
      } else {
        document.documentElement.setAttribute('data-theme', theme);
      }
    }
  }

  UNSAFE_componentWillMount() {
    const {
      currentCurrency,
      pageChanged,
      setCurrentCurrencyToUSD,
      history,
      theme,
    } = this.props;
    if (!currentCurrency) {
      setCurrentCurrencyToUSD();
    }

    history.listen((locationObj, action) => {
      if (action === 'PUSH') {
        pageChanged(locationObj.pathname);
      }
    });
    if (theme === ThemeType.os) {
      this.handleOsTheme();
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }

  renderRoutes() {
    const { autoLockTimeLimit, setLastActiveTime, forgottenPassword } =
      this.props;
    const RestoreVaultComponent = forgottenPassword ? Route : Initialized;

    const routes = (
      <Switch>
        <Route path={ONBOARDING_ROUTE} component={OnboardingFlow} />
        <Route path={LOCK_ROUTE} component={Lock} exact />
        {
          ///: BEGIN:ONLY_INCLUDE_IF(desktop)
          <Route
            path={`${DESKTOP_ERROR_ROUTE}/:errorType`}
            component={DesktopErrorPage}
            exact
          />
          ///: END:ONLY_INCLUDE_IF
        }
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
        {
          ///: BEGIN:ONLY_INCLUDE_IF(snaps)
          <Authenticated path={NOTIFICATIONS_ROUTE} component={Notifications} />
          ///: END:ONLY_INCLUDE_IF
        }
        {
          ///: BEGIN:ONLY_INCLUDE_IF(snaps)
          <Authenticated exact path={SNAPS_ROUTE} component={SnapList} />
          ///: END:ONLY_INCLUDE_IF
        }
        {
          ///: BEGIN:ONLY_INCLUDE_IF(snaps)
          <Authenticated path={SNAPS_VIEW_ROUTE} component={SnapView} />
          ///: END:ONLY_INCLUDE_IF
        }
        <Authenticated
          path={`${CONFIRM_TRANSACTION_ROUTE}/:id?`}
          component={ConfirmTransaction}
        />
        <Authenticated
          path={SEND_ROUTE}
          component={process.env.MULTICHAIN ? SendPage : SendTransactionScreen}
          exact
        />
        <Authenticated
          path={`${TOKEN_DETAILS}/:address/`}
          component={TokenDetailsPage}
          exact
        />
        <Authenticated path={SWAPS_ROUTE} component={Swaps} />
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
          path={CONFIRMATION_V_NEXT_ROUTE}
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
        {
          ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
          <Authenticated
            path={ADD_SNAP_ACCOUNT_ROUTE}
            component={AddSnapAccountPage}
          />
          ///: END:ONLY_INCLUDE_IF
        }
        <Authenticated
          path={`${CONNECT_ROUTE}/:id`}
          component={PermissionsConnect}
        />
        <Authenticated path={`${ASSET_ROUTE}/:asset/:id`} component={Asset} />
        <Authenticated path={`${ASSET_ROUTE}/:asset/`} component={Asset} />
        {
          ///: BEGIN:ONLY_INCLUDE_IF(desktop)
          <Authenticated
            path={DESKTOP_PAIRING_ROUTE}
            component={DesktopPairingPage}
            exact
          />
          ///: END:ONLY_INCLUDE_IF
        }
        {process.env.MULTICHAIN && (
          <Authenticated path={CONNECTIONS} component={Connections} />
        )}
        {process.env.MULTICHAIN && (
          <Authenticated
            path={ALL_CONNECTIONS}
            component={AllConnections}
            exact
          />
        )}
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

  hideAppHeader() {
    const { location } = this.props;

    ///: BEGIN:ONLY_INCLUDE_IF(desktop)
    const isDesktopConnectionLostScreen = Boolean(
      matchPath(location.pathname, {
        path: `${DESKTOP_ERROR_ROUTE}/${EXTENSION_ERROR_PAGE_TYPES.CONNECTION_LOST}`,
        exact: true,
      }),
    );

    if (isDesktopConnectionLostScreen) {
      return true;
    }
    ///: END:ONLY_INCLUDE_IF

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

    const isAllConnectionsPage = Boolean(
      matchPath(location.pathname, {
        path: ALL_CONNECTIONS,
        exact: false,
      }),
    );

    if (isAllConnectionsPage) {
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
    if (process.env.MULTICHAIN && isMultichainSend) {
      return true;
    }

    const isHandlingAddEthereumChainRequest = Boolean(
      matchPath(location.pathname, {
        path: CONFIRMATION_V_NEXT_ROUTE,
        exact: false,
      }),
    );

    return isHandlingPermissionsRequest || isHandlingAddEthereumChainRequest;
  }

  showFooter() {
    if (Boolean(process.env.MULTICHAIN) === false) {
      return false;
    }

    const { location } = this.props;
    const isHomePage = Boolean(
      matchPath(location.pathname, { path: DEFAULT_ROUTE, exact: true }),
    );
    const isConnectionsPage = Boolean(
      matchPath(location.pathname, { path: CONNECTIONS, exact: true }),
    );
    const isAssetPage = Boolean(
      matchPath(location.pathname, { path: ASSET_ROUTE, exact: false }),
    );

    return isAssetPage || isHomePage || isConnectionsPage;
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
      isSelectActionModalOpen,
      location,
      isImportNftsModalOpen,
      hideImportNftsModal,
      isIpfsModalOpen,
      hideIpfsModal,
      hideImportTokensModal,
      hideSelectActionModal,
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

    const shouldShowNetworkInfo =
      isUnlocked &&
      currentChainId &&
      !isTestNet &&
      !isNetworkUsed &&
      !isCurrentProviderCustom &&
      completedOnboarding &&
      allAccountsOnNetworkAreEmpty;

    const windowType = getEnvironmentType();

    const shouldShowNetworkDeprecationWarning =
      windowType !== ENVIRONMENT_TYPE_NOTIFICATION &&
      isUnlocked &&
      !shouldShowSeedPhraseReminder;

    let isLoadingShown = isLoading;

    ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
    isLoadingShown =
      isLoading &&
      !pendingConfirmations.some(
        (confirmation) =>
          confirmation.type ===
          SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showSnapAccountRedirect,
      );
    ///: END:ONLY_INCLUDE_IF

    return (
      <div
        className={classnames('app', {
          [`os-${os}`]: os,
          [`browser-${browser}`]: browser,
        })}
        dir={textDirection}
      >
        {shouldShowNetworkDeprecationWarning ? <DeprecatedNetworks /> : null}
        {shouldShowNetworkInfo && <NewNetworkInfo />}
        <QRHardwarePopover />
        <Modal />
        <Alert visible={this.props.alertOpen} msg={alertMessage} />
        {!this.hideAppHeader() && <AppHeader location={location} />}
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
          <NetworkListMenu onClose={() => toggleNetworkMenu()} />
        ) : null}
        {accountDetailsAddress ? (
          <AccountDetails address={accountDetailsAddress} />
        ) : null}
        {isImportNftsModalOpen ? (
          <ImportNftsModal onClose={() => hideImportNftsModal()} />
        ) : null}
        {isIpfsModalOpen ? (
          <ToggleIpfsModal onClose={() => hideIpfsModal()} />
        ) : null}
        {isImportTokensModalOpen ? (
          <ImportTokensModal onClose={() => hideImportTokensModal()} />
        ) : null}
        {isSelectActionModalOpen ? (
          <SelectActionModal onClose={() => hideSelectActionModal()} />
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
          {!isLoading && isNetworkLoading ? <LoadingNetwork /> : null}
          {this.renderRoutes()}
        </Box>
        {this.showFooter() && <AppFooter location={location} />}
        {isUnlocked ? <Alerts history={this.props.history} /> : null}
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
      case NETWORK_TYPES.LINEA_MAINNET:
        return t('connectingToLineaMainnet');
      default:
        return t('connectingTo', [providerId]);
    }
  }
}
