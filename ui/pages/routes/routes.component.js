import classnames from 'classnames';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { matchPath, Route, Switch } from 'react-router-dom';
import IdleTimer from 'react-idle-timer';

///: BEGIN:ONLY_INCLUDE_IN(desktop)
import browserAPI from 'webextension-polyfill';
///: END:ONLY_INCLUDE_IN

import SendTransactionScreen from '../send';
import Swaps from '../swaps';
import ConfirmTransaction from '../confirm-transaction';
import Home from '../home';
import { Connections } from '../../components/multichain/pages';
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
} from '../../components/multichain';
import UnlockPage from '../unlock-page';
import Alerts from '../../components/app/alerts';
import Asset from '../asset';
import OnboardingAppHeader from '../onboarding-flow/onboarding-app-header/onboarding-app-header';
import TokenDetailsPage from '../token-details';
///: BEGIN:ONLY_INCLUDE_IN(snaps)
import Notifications from '../notifications';
///: END:ONLY_INCLUDE_IN
///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
import AddSnapAccountPage from '../keyring-snaps/add-snap-account';
///: END:ONLY_INCLUDE_IN
///: BEGIN:ONLY_INCLUDE_IN(desktop)
import { registerOnDesktopDisconnect } from '../../hooks/desktopHooks';
import DesktopErrorPage from '../desktop-error';
import DesktopPairingPage from '../desktop-pairing';
///: END:ONLY_INCLUDE_IN
///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
import InstitutionalEntityDonePage from '../institutional/institutional-entity-done-page';
import InteractiveReplacementTokenNotification from '../../components/institutional/interactive-replacement-token-notification';
import ConfirmAddCustodianToken from '../institutional/confirm-add-custodian-token';
import InteractiveReplacementTokenPage from '../institutional/interactive-replacement-token-page';
import CustodyPage from '../institutional/custody';
///: END:ONLY_INCLUDE_IN

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
  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  INSTITUTIONAL_FEATURES_DONE_ROUTE,
  CUSTODY_ACCOUNT_DONE_ROUTE,
  CONFIRM_ADD_CUSTODIAN_TOKEN,
  INTERACTIVE_REPLACEMENT_TOKEN_PAGE,
  CUSTODY_ACCOUNT_ROUTE,
  ///: END:ONLY_INCLUDE_IN
  ///: BEGIN:ONLY_INCLUDE_IN(snaps)
  NOTIFICATIONS_ROUTE,
  ///: END:ONLY_INCLUDE_IN
  ///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
  ADD_SNAP_ACCOUNT_ROUTE,
  ///: END:ONLY_INCLUDE_IN
  ///: BEGIN:ONLY_INCLUDE_IN(desktop)
  DESKTOP_PAIRING_ROUTE,
  DESKTOP_ERROR_ROUTE,
  ///: END:ONLY_INCLUDE_IN
} from '../../helpers/constants/routes';

///: BEGIN:ONLY_INCLUDE_IN(desktop)
import { EXTENSION_ERROR_PAGE_TYPES } from '../../../shared/constants/desktop';
///: END:ONLY_INCLUDE_IN

import {
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_POPUP,
} from '../../../shared/constants/app';
import { NETWORK_TYPES } from '../../../shared/constants/network';
import { getEnvironmentType } from '../../../app/scripts/lib/util';
import ConfirmationPage from '../confirmation';
import OnboardingFlow from '../onboarding-flow/onboarding-flow';
import QRHardwarePopover from '../../components/app/qr-hardware-popover';
import { SEND_STAGES } from '../../ducks/send';
import DeprecatedTestNetworks from '../../components/ui/deprecated-test-networks/deprecated-test-networks';
import NewNetworkInfo from '../../components/ui/new-network-info/new-network-info';
import { ThemeType } from '../../../shared/constants/preferences';
import { Box } from '../../components/component-library';
import { ToggleIpfsModal } from '../../components/app/nft-default-image/toggle-ipfs-modal';

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
    isMouseUser: PropTypes.bool,
    setMouseUserState: PropTypes.func,
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

  ///: BEGIN:ONLY_INCLUDE_IN(desktop)
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
  ///: END:ONLY_INCLUDE_IN

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
          ///: BEGIN:ONLY_INCLUDE_IN(desktop)
          <Route
            path={`${DESKTOP_ERROR_ROUTE}/:errorType`}
            component={DesktopErrorPage}
            exact
          />
          ///: END:ONLY_INCLUDE_IN
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
          ///: BEGIN:ONLY_INCLUDE_IN(snaps)
          <Authenticated path={NOTIFICATIONS_ROUTE} component={Notifications} />
          ///: END:ONLY_INCLUDE_IN
        }
        <Authenticated
          path={`${CONFIRM_TRANSACTION_ROUTE}/:id?`}
          component={ConfirmTransaction}
        />
        <Authenticated
          path={SEND_ROUTE}
          component={SendTransactionScreen}
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
          ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
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
          ///: END:ONLY_INCLUDE_IN
        }
        <Authenticated path={NEW_ACCOUNT_ROUTE} component={CreateAccountPage} />
        {
          ///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
          <Authenticated
            path={ADD_SNAP_ACCOUNT_ROUTE}
            component={AddSnapAccountPage}
          />
          ///: END:ONLY_INCLUDE_IN
        }
        <Authenticated
          path={`${CONNECT_ROUTE}/:id`}
          component={PermissionsConnect}
        />
        <Authenticated path={`${ASSET_ROUTE}/:asset/:id`} component={Asset} />
        <Authenticated path={`${ASSET_ROUTE}/:asset/`} component={Asset} />
        {
          ///: BEGIN:ONLY_INCLUDE_IN(desktop)
          <Authenticated
            path={DESKTOP_PAIRING_ROUTE}
            component={DesktopPairingPage}
            exact
          />
          ///: END:ONLY_INCLUDE_IN
        }
        {process.env.MULTICHAIN && (
          <Authenticated path={CONNECTIONS} component={Connections} />
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

    ///: BEGIN:ONLY_INCLUDE_IN(desktop)
    const isDesktopConnectionLostScreen = Boolean(
      matchPath(location.pathname, {
        path: `${DESKTOP_ERROR_ROUTE}/${EXTENSION_ERROR_PAGE_TYPES.CONNECTION_LOST}`,
        exact: true,
      }),
    );

    if (isDesktopConnectionLostScreen) {
      return true;
    }
    ///: END:ONLY_INCLUDE_IN

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

    if (windowType === ENVIRONMENT_TYPE_POPUP && this.onConfirmPage()) {
      return true;
    }

    const isHandlingPermissionsRequest = Boolean(
      matchPath(location.pathname, {
        path: CONNECT_ROUTE,
        exact: false,
      }),
    );

    const isHandlingAddEthereumChainRequest = Boolean(
      matchPath(location.pathname, {
        path: CONFIRMATION_V_NEXT_ROUTE,
        exact: false,
      }),
    );

    return isHandlingPermissionsRequest || isHandlingAddEthereumChainRequest;
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
      setMouseUserState,
      isMouseUser,
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

    return (
      <div
        className={classnames('app', {
          [`os-${os}`]: os,
          [`browser-${browser}`]: browser,
          'mouse-user-styles': isMouseUser,
        })}
        dir={textDirection}
        onClick={() => setMouseUserState(true)}
        onKeyDown={(e) => {
          if (e.keyCode === 9) {
            setMouseUserState(false);
          }
        }}
      >
        {shouldShowNetworkDeprecationWarning && <DeprecatedTestNetworks />}
        {shouldShowNetworkInfo && <NewNetworkInfo />}
        <QRHardwarePopover />
        <Modal />
        <Alert visible={this.props.alertOpen} msg={alertMessage} />
        {!this.hideAppHeader() && <AppHeader location={location} />}
        {this.showOnboardingHeader() && <OnboardingAppHeader />}
        {
          ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
          isUnlocked ? <InteractiveReplacementTokenNotification /> : null
          ///: END:ONLY_INCLUDE_IN
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
        <Box className="main-container-wrapper">
          {isLoading ? <Loading loadingMessage={loadMessage} /> : null}
          {!isLoading && isNetworkLoading ? <LoadingNetwork /> : null}
          {this.renderRoutes()}
        </Box>
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
