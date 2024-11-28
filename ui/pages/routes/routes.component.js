import classnames from 'classnames';
import PropTypes from 'prop-types';
import React, { Component, Suspense } from 'react';
import { Route, Switch } from 'react-router-dom';
import IdleTimer from 'react-idle-timer';

import Authenticated from '../../helpers/higher-order-components/authenticated';
import Initialized from '../../helpers/higher-order-components/initialized';
import PermissionsConnect from '../permissions-connect';
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
} from '../../components/multichain';
import Alerts from '../../components/app/alerts';
import OnboardingAppHeader from '../onboarding-flow/onboarding-app-header/onboarding-app-header';
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
  CONFIRMATION_V_NEXT_ROUTE,
  ONBOARDING_ROUTE,
  CONNECTIONS,
  PERMISSIONS,
  REVIEW_PERMISSIONS,
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
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../app/scripts/lib/util';
import QRHardwarePopover from '../../components/app/qr-hardware-popover';
import DeprecatedNetworks from '../../components/ui/deprecated-networks/deprecated-networks';
import { Box } from '../../components/component-library';
import { ToggleIpfsModal } from '../../components/app/assets/nfts/nft-default-image/toggle-ipfs-modal';
import { BasicConfigurationModal } from '../../components/app/basic-configuration-modal';
///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import KeyringSnapRemovalResult from '../../components/app/modals/keyring-snap-removal-modal';
///: END:ONLY_INCLUDE_IF

import { DeprecatedNetworkModal } from '../settings/deprecated-network-modal/DeprecatedNetworkModal';
import { MultichainMetaFoxLogo } from '../../components/multichain/app-header/multichain-meta-fox-logo';
import NetworkConfirmationPopover from '../../components/multichain/network-list-menu/network-confirmation-popover/network-confirmation-popover';
import { ToastMaster } from '../../components/app/toast-master/toast-master';
import { mmLazy } from '../../helpers/utils/mm-lazy';
import {
  isCorrectDeveloperTransactionType,
  isCorrectSignatureApprovalType,
} from '../../../shared/lib/confirmation.utils';
import {
  getConnectingLabel,
  hideAppHeader,
  isConfirmTransactionRoute,
  setTheme,
  showOnboardingHeader,
} from './utils';

// Begin Lazy Routes
const OnboardingFlow = mmLazy(() =>
  import('../onboarding-flow/onboarding-flow'),
);
const Lock = mmLazy(() => import('../lock'));
const UnlockPage = mmLazy(() => import('../unlock-page'));
const RestoreVaultPage = mmLazy(() => import('../keychains/restore-vault'));
const RevealSeedConfirmation = mmLazy(() => import('../keychains/reveal-seed'));
const Settings = mmLazy(() => import('../settings'));
const NotificationsSettings = mmLazy(() => import('../notifications-settings'));
const NotificationDetails = mmLazy(() => import('../notification-details'));
const Notifications = mmLazy(() => import('../notifications'));
const SnapList = mmLazy(() => import('../snaps/snaps-list'));
const SnapView = mmLazy(() => import('../snaps/snap-view'));
const ConfirmTransaction = mmLazy(() =>
  import('../confirmations/confirm-transaction'),
);
const SendPage = mmLazy(() => import('../../components/multichain/pages/send'));
const Swaps = mmLazy(() => import('../swaps'));
const CrossChainSwap = mmLazy(() => import('../bridge'));
const ConfirmAddSuggestedTokenPage = mmLazy(() =>
  import('../confirm-add-suggested-token'),
);
const ConfirmAddSuggestedNftPage = mmLazy(() =>
  import('../confirm-add-suggested-nft'),
);
const ConfirmationPage = mmLazy(() => import('../confirmations/confirmation'));
const CreateAccountPage = mmLazy(() =>
  import('../create-account/create-account.component'),
);
const NftFullImage = mmLazy(() =>
  import('../../components/app/assets/nfts/nft-details/nft-full-image'),
);
const Asset = mmLazy(() => import('../asset'));
const PermissionsPage = mmLazy(() =>
  import('../../components/multichain/pages/permissions-page/permissions-page'),
);
const Connections = mmLazy(() =>
  import('../../components/multichain/pages/connections'),
);
const ReviewPermissions = mmLazy(() =>
  import(
    '../../components/multichain/pages/review-permissions-page/review-permissions-page'
  ),
);
const Home = mmLazy(() => import('../home'));
// End Lazy Routes

export default class Routes extends Component {
  static propTypes = {
    currentCurrency: PropTypes.string,
    activeTabOrigin: PropTypes.string,
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
    autoLockTimeLimit: PropTypes.number,
    privacyMode: PropTypes.bool,
    pageChanged: PropTypes.func.isRequired,
    browserEnvironmentOs: PropTypes.string,
    browserEnvironmentBrowser: PropTypes.string,
    theme: PropTypes.string,
    showExtensionInFullSizeView: PropTypes.bool,
    shouldShowSeedPhraseReminder: PropTypes.bool,
    forgottenPassword: PropTypes.bool,
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
    clearSwitchedNetworkDetails: PropTypes.func.isRequired,
    networkToAutomaticallySwitchTo: PropTypes.object,
    automaticallySwitchNetwork: PropTypes.func.isRequired,
    totalUnapprovedConfirmationCount: PropTypes.number.isRequired,
    currentExtensionPopupId: PropTypes.number,
    useRequestQueue: PropTypes.bool,
    clearEditedNetwork: PropTypes.func.isRequired,
    oldestPendingApproval: PropTypes.object.isRequired,
    pendingApprovals: PropTypes.arrayOf(PropTypes.object).isRequired,
    transactionsMetadata: PropTypes.arrayOf(PropTypes.object).isRequired,
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

  componentDidUpdate(prevProps) {
    const {
      theme,
      networkToAutomaticallySwitchTo,
      activeTabOrigin,
      totalUnapprovedConfirmationCount,
      isUnlocked,
      useRequestQueue,
      currentExtensionPopupId,
    } = this.props;
    if (theme !== prevProps.theme) {
      setTheme(theme);
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

    setTheme(this.props.theme);
  }

  renderRoutes() {
    const { autoLockTimeLimit, setLastActiveTime, forgottenPassword } =
      this.props;
    const RestoreVaultComponent = forgottenPassword ? Route : Initialized;

    const routes = (
      <Suspense fallback={null}>
        {/* since the loading time is less than 200ms, we decided not to show a spinner fallback or anything */}
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
          <Authenticated
            path={NEW_ACCOUNT_ROUTE}
            component={CreateAccountPage}
          />
          <Authenticated
            path={`${CONNECT_ROUTE}/:id`}
            component={PermissionsConnect}
          />
          <Authenticated
            path={`${ASSET_ROUTE}/image/:asset/:id`}
            component={NftFullImage}
          />
          <Authenticated
            path={`${ASSET_ROUTE}/:chainId/:asset/:id`}
            component={Asset}
          />
          <Authenticated
            path={`${ASSET_ROUTE}/:chainId/:asset/`}
            component={Asset}
          />
          <Authenticated path={`${ASSET_ROUTE}/:chainId`} component={Asset} />
          <Authenticated
            path={`${CONNECTIONS}/:origin`}
            component={Connections}
          />
          <Authenticated path={PERMISSIONS} component={PermissionsPage} exact />
          <Authenticated
            path={`${REVIEW_PERMISSIONS}/:origin`}
            component={ReviewPermissions}
            exact
          />
          <Authenticated path={DEFAULT_ROUTE} component={Home} />
        </Switch>
      </Suspense>
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
      shouldShowSeedPhraseReminder,
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
      clearSwitchedNetworkDetails,
      clearEditedNetwork,
      privacyMode,
      oldestPendingApproval,
      pendingApprovals,
      transactionsMetadata,
      ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
      isShowKeyringSnapRemovalResultModal,
      hideShowKeyringSnapRemovalResultModal,
      pendingConfirmations,
      ///: END:ONLY_INCLUDE_IF
    } = this.props;

    const loadMessage =
      loadingMessage || isNetworkLoading
        ? getConnectingLabel(loadingMessage, this.props, this.context)
        : null;

    const windowType = getEnvironmentType();

    const shouldShowNetworkDeprecationWarning =
      windowType !== ENVIRONMENT_TYPE_NOTIFICATION &&
      isUnlocked &&
      !shouldShowSeedPhraseReminder;

    const paramsConfirmationId = location.pathname.split(
      '/confirm-transaction/',
    )[1];
    const confirmationId = paramsConfirmationId ?? oldestPendingApproval?.id;
    const pendingApproval = pendingApprovals.find(
      (approval) => approval.id === confirmationId,
    );
    const isCorrectApprovalType = isCorrectSignatureApprovalType(
      pendingApproval?.type,
    );
    const isCorrectTransactionType = isCorrectDeveloperTransactionType(
      transactionsMetadata[confirmationId]?.type,
    );

    let isLoadingShown =
      isLoading &&
      completedOnboarding &&
      // In the redesigned screens, we hide the general loading spinner and the
      // loading states are on a component by component basis.
      !isCorrectApprovalType &&
      !isCorrectTransactionType;

    ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
    isLoadingShown =
      isLoading &&
      completedOnboarding &&
      !pendingConfirmations.some(
        (confirmation) =>
          confirmation.type ===
          SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showSnapAccountRedirect,
      ) &&
      // In the redesigned screens, we hide the general loading spinner and the
      // loading states are on a component by component basis.
      !isCorrectApprovalType &&
      !isCorrectTransactionType;
    ///: END:ONLY_INCLUDE_IF

    return (
      <div
        className={classnames('app', {
          [`os-${os}`]: os,
          [`browser-${browser}`]: browser,
        })}
        dir={textDirection}
        onMouseUp={
          getShowAutoNetworkSwitchTest(this.props)
            ? () => clearSwitchedNetworkDetails()
            : undefined
        }
      >
        {shouldShowNetworkDeprecationWarning ? <DeprecatedNetworks /> : null}
        <QRHardwarePopover />
        <Modal />
        <Alert visible={this.props.alertOpen} msg={alertMessage} />
        {!hideAppHeader(this.props) && <AppHeader location={location} />}
        {isConfirmTransactionRoute(this.pathname) && <MultichainMetaFoxLogo />}
        {showOnboardingHeader(location) && <OnboardingAppHeader />}
        {
          ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
          isUnlocked ? <InteractiveReplacementTokenNotification /> : null
          ///: END:ONLY_INCLUDE_IF
        }
        {isAccountMenuOpen ? (
          <AccountListMenu
            onClose={() => toggleAccountMenu()}
            privacyMode={privacyMode}
          />
        ) : null}
        {isNetworkMenuOpen ? (
          <NetworkListMenu
            onClose={() => {
              toggleNetworkMenu();
              clearEditedNetwork();
            }}
          />
        ) : null}
        <NetworkConfirmationPopover />
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
        <ToastMaster />
      </div>
    );
  }
}

// Will eventually delete this function
function getShowAutoNetworkSwitchTest(props) {
  return props.switchedNetworkDetails && !props.switchedNetworkNeverShowMessage;
}
