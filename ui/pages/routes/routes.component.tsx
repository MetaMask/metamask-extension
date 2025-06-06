/* eslint-disable import/no-useless-path-segments */
/* eslint-disable import/extensions */
import classnames from 'classnames';
import React, { Suspense, useCallback, useEffect, useRef } from 'react';
import {
  type TypedUseSelectorHook,
  useDispatch,
  useSelector,
} from 'react-redux';
import { Route, Switch, useHistory, useLocation } from 'react-router-dom';
import IdleTimer from 'react-idle-timer';
import type { ApprovalType } from '@metamask/controller-utils';

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
  SNAPS_ROUTE,
  SNAPS_VIEW_ROUTE,
  NOTIFICATIONS_ROUTE,
  NOTIFICATIONS_SETTINGS_ROUTE,
  CROSS_CHAIN_SWAP_ROUTE,
  CROSS_CHAIN_SWAP_TX_DETAILS_ROUTE,
  REMOTE_ROUTE,
  REMOTE_ROUTE_SETUP_SWAPS,
  REMOTE_ROUTE_SETUP_DAILY_ALLOWANCE,
  IMPORT_SRP_ROUTE,
  DEFI_ROUTE,
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
import CrossChainSwapTxDetails from '../bridge/transaction-details/transaction-details';
import {
  isCorrectDeveloperTransactionType,
  isCorrectSignatureApprovalType,
} from '../../../shared/lib/confirmation.utils';

import {
  getProviderConfig,
  isNetworkLoading as getIsNetworkLoading,
} from '../../../shared/modules/selectors/networks';
import {
  getNetworkIdentifier,
  getPreferences,
  getTheme,
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  getUnapprovedConfirmations,
  ///: END:ONLY_INCLUDE_IF
  getShowExtensionInFullSizeView,
  getSwitchedNetworkDetails,
  getNetworkToAutomaticallySwitchTo,
  getNumberOfAllUnapprovedTransactionsAndMessages,
  getSelectedInternalAccount,
  oldestPendingConfirmationSelector,
  getUnapprovedTransactions,
  getPendingApprovals,
  getOriginOfCurrentTab,
} from '../../selectors';
import {
  hideImportNftsModal,
  hideIpfsModal,
  setCurrentCurrency,
  setLastActiveTime,
  toggleAccountMenu,
  toggleNetworkMenu,
  hideImportTokensModal,
  hideDeprecatedNetworkModal,
  automaticallySwitchNetwork,
  clearSwitchedNetworkDetails,
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  hideKeyringRemovalResultModal,
  ///: END:ONLY_INCLUDE_IF
  setEditedNetwork,
} from '../../store/actions';
import {
  getCompletedOnboarding,
  getIsUnlocked,
} from '../../ducks/metamask/metamask';
import { pageChanged } from '../../ducks/history/history';
import { DEFAULT_AUTO_LOCK_TIME_LIMIT } from '../../../shared/constants/preferences';
import { selectSwitchedNetworkNeverShowMessage } from '../../components/app/toast-master/selectors';
import { getShouldShowSeedPhraseReminder } from '../../selectors/multi-srp/multi-srp';
import { Confirmation } from '../confirmations/types/confirm';
import { useI18nContext } from '../../hooks/useI18nContext';
import type { MetaMaskReduxState } from '../../store/store';

import {
  getConnectingLabel,
  hideAppHeader,
  isConfirmTransactionRoute,
  setTheme,
  showOnboardingHeader,
  showAppHeader,
} from './utils';

// Begin Lazy Routes
const OnboardingFlow = mmLazy(
  () => import('../onboarding-flow/onboarding-flow.js'),
);
const Lock = mmLazy(() => import('../lock/index.js'));
const UnlockPage = mmLazy(() => import('../unlock-page/index.js'));
const RestoreVaultPage = mmLazy(() => import('../keychains/restore-vault.js'));
const ImportSrpPage = mmLazy(() => import('../multi-srp/import-srp/index.ts'));
const RevealSeedConfirmation = mmLazy(
  () => import('../keychains/reveal-seed.js'),
);
const Settings = mmLazy(() => import('../settings/index.js'));
const NotificationsSettings = mmLazy(
  () => import('../notifications-settings/index.js'),
);
const NotificationDetails = mmLazy(
  () => import('../notification-details/index.js'),
);
const Notifications = mmLazy(() => import('../notifications/index.js'));
const SnapList = mmLazy(() => import('../snaps/snaps-list/index.js'));
const SnapView = mmLazy(() => import('../snaps/snap-view/index.js'));
const ConfirmTransaction = mmLazy(
  () => import('../confirmations/confirm-transaction/index.js'),
);
const SendPage = mmLazy(
  () => import('../../components/multichain/pages/send/index.js'),
);
const Swaps = mmLazy(() => import('../swaps/index.js'));
const CrossChainSwap = mmLazy(() => import('../bridge/index.tsx'));
const ConfirmAddSuggestedTokenPage = mmLazy(
  () => import('../confirm-add-suggested-token/index.js'),
);
const ConfirmAddSuggestedNftPage = mmLazy(
  () => import('../confirm-add-suggested-nft/index.js'),
);
const ConfirmationPage = mmLazy(
  () => import('../confirmations/confirmation/index.js'),
);
const CreateAccountPage = mmLazy(() => import('../create-account/index.js'));
const NftFullImage = mmLazy(
  () =>
    import('../../components/app/assets/nfts/nft-details/nft-full-image.tsx'),
);
const Asset = mmLazy(() => import('../asset/index.js'));
const DeFiPage = mmLazy(() => import('../defi/index.ts'));
const PermissionsPage = mmLazy(
  () =>
    import(
      '../../components/multichain/pages/permissions-page/permissions-page.js'
    ),
);
const Connections = mmLazy(
  () => import('../../components/multichain/pages/connections/index.js'),
);
const ReviewPermissions = mmLazy(
  () =>
    import(
      '../../components/multichain/pages/review-permissions-page/review-permissions-page.tsx'
    ),
);
const Home = mmLazy(() => import('../home/index.js'));

const RemoteModeOverview = mmLazy(
  () => import('../remote-mode/overview/index.ts'),
);
const RemoteModeSetupSwaps = mmLazy(
  () => import('../remote-mode/setup/setup-swaps/index.ts'),
);
const RemoteModeSetupDailyAllowance = mmLazy(
  () => import('../remote-mode/setup/setup-daily-allowance/index.ts'),
);
// End Lazy Routes

const useAppSelector: TypedUseSelectorHook<MetaMaskReduxState> = useSelector;

export default function Routes() {
  const dispatch = useDispatch();
  const history = useHistory();
  const location = useLocation();

  const alertOpen = useAppSelector((state) => state.appState.alertOpen);
  const alertMessage = useAppSelector((state) => state.appState.alertMessage);
  const isLoading = useAppSelector((state) => state.appState.isLoading);
  const loadingMessage = useAppSelector(
    (state) => state.appState.loadingMessage,
  );
  const { autoLockTimeLimit = DEFAULT_AUTO_LOCK_TIME_LIMIT, privacyMode } =
    useAppSelector(getPreferences);
  const { completedOnboarding } = useAppSelector(getCompletedOnboarding);

  // If there is more than one connected account to activeTabOrigin,
  // *BUT* the current account is not one of them, show the banner
  const account = useAppSelector(getSelectedInternalAccount);
  const activeTabOrigin = useAppSelector(getOriginOfCurrentTab);
  const isNetworkLoading = useAppSelector(getIsNetworkLoading);

  const networkToAutomaticallySwitchTo = useAppSelector(
    getNetworkToAutomaticallySwitchTo,
  );
  const switchedNetworkDetails = useAppSelector(getSwitchedNetworkDetails);

  const oldestPendingApproval = useAppSelector(
    oldestPendingConfirmationSelector,
  );
  const pendingApprovals = useAppSelector(getPendingApprovals);
  const transactionsMetadata = useAppSelector(getUnapprovedTransactions);

  const shouldShowSeedPhraseReminder = useAppSelector((state) =>
    getShouldShowSeedPhraseReminder(state, account),
  );

  const textDirection = useAppSelector((state) => state.metamask.textDirection);
  const isUnlocked = useAppSelector(getIsUnlocked);
  const currentCurrency = useAppSelector(
    (state) => state.metamask.currentCurrency,
  );
  const os = useAppSelector((state) => state.metamask.browserEnvironment?.os);
  const browser = useAppSelector(
    (state) => state.metamask.browserEnvironment?.browser,
  );
  const providerId = useAppSelector(getNetworkIdentifier);
  const { type: providerType } = useAppSelector(getProviderConfig);
  const theme = useAppSelector(getTheme);
  const showExtensionInFullSizeView = useAppSelector(
    getShowExtensionInFullSizeView,
  );
  const forgottenPassword = useAppSelector(
    (state) => state.metamask.forgottenPassword,
  );
  const isAccountMenuOpen = useAppSelector(
    (state) => state.appState.isAccountMenuOpen,
  );
  const isNetworkMenuOpen = useAppSelector(
    (state) => state.appState.isNetworkMenuOpen,
  );
  const isImportTokensModalOpen = useAppSelector(
    (state) => state.appState.importTokensModalOpen,
  );
  const isBasicConfigurationModalOpen = useAppSelector(
    (state) => state.appState.showBasicFunctionalityModal,
  );
  const isDeprecatedNetworkModalOpen = useAppSelector(
    (state) => state.appState.deprecatedNetworkModalOpen,
  );
  const accountDetailsAddress = useAppSelector(
    (state) => state.appState.accountDetailsAddress,
  );
  const isImportNftsModalOpen = useAppSelector(
    (state) => state.appState.importNftsModal.open,
  );
  const isIpfsModalOpen = useAppSelector(
    (state) => state.appState.showIpfsModalOpen,
  );
  const totalUnapprovedConfirmationCount = useAppSelector(
    getNumberOfAllUnapprovedTransactionsAndMessages,
  );
  const switchedNetworkNeverShowMessage = useAppSelector(
    selectSwitchedNetworkNeverShowMessage,
  );
  const currentExtensionPopupId = useAppSelector(
    (state) => state.metamask.currentExtensionPopupId,
  );

  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  const isShowKeyringSnapRemovalResultModal = useAppSelector(
    (state) => state.appState.showKeyringRemovalSnapModal,
  );
  const pendingConfirmations = useAppSelector(getUnapprovedConfirmations);
  const hideShowKeyringSnapRemovalResultModal = () =>
    dispatch(hideKeyringRemovalResultModal());
  ///: END:ONLY_INCLUDE_IF

  const prevPropsRef = useRef({ isUnlocked, totalUnapprovedConfirmationCount });

  useEffect(() => {
    const prevProps = prevPropsRef.current;

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
      dispatch(
        automaticallySwitchNetwork(
          networkToAutomaticallySwitchTo,
          activeTabOrigin,
        ),
      );
    }

    // Terminate the popup when another popup is opened
    // if the user is using RPC queueing
    if (
      currentExtensionPopupId !== undefined &&
      'metamask' in global &&
      typeof global.metamask === 'object' &&
      global.metamask &&
      'id' in global.metamask &&
      global.metamask.id !== undefined &&
      currentExtensionPopupId !== global.metamask.id
    ) {
      window.close();
    }

    prevPropsRef.current = { isUnlocked, totalUnapprovedConfirmationCount };
  }, [
    activeTabOrigin,
    currentExtensionPopupId,
    networkToAutomaticallySwitchTo,
    isUnlocked,
    totalUnapprovedConfirmationCount,
    dispatch,
  ]);

  useEffect(() => {
    const windowType = getEnvironmentType();
    const { openExtensionInBrowser } = global.platform;
    if (
      showExtensionInFullSizeView &&
      windowType === ENVIRONMENT_TYPE_POPUP &&
      openExtensionInBrowser
    ) {
      openExtensionInBrowser();
    }

    if (!currentCurrency) {
      dispatch(setCurrentCurrency('usd'));
    }

    history.listen((locationObj: Location, action: 'PUSH') => {
      if (action === 'PUSH') {
        dispatch(pageChanged(locationObj.pathname));
      }
    });

    setTheme(theme);
  }, [currentCurrency, showExtensionInFullSizeView, theme, history, dispatch]);

  const renderRoutes = useCallback(() => {
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
            // `:keyringId` is optional here, if not provided, this will fallback
            // to the main seed phrase.
            path={`${REVEAL_SEED_ROUTE}/:keyringId?`}
            component={RevealSeedConfirmation}
          />
          <Authenticated path={IMPORT_SRP_ROUTE} component={ImportSrpPage} />
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
            path={`${CROSS_CHAIN_SWAP_TX_DETAILS_ROUTE}/:srcTxMetaId`}
            component={CrossChainSwapTxDetails}
            exact
          />
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
            path={`${DEFI_ROUTE}/:chainId/:protocolId`}
            component={DeFiPage}
          />
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
          <Authenticated
            path={REMOTE_ROUTE}
            component={RemoteModeOverview}
            exact
          />
          <Authenticated
            path={REMOTE_ROUTE_SETUP_SWAPS}
            component={RemoteModeSetupSwaps}
            exact
          />
          <Authenticated
            path={REMOTE_ROUTE_SETUP_DAILY_ALLOWANCE}
            component={RemoteModeSetupDailyAllowance}
            exact
          />

          <Authenticated path={DEFAULT_ROUTE} component={Home} />
        </Switch>
      </Suspense>
    );

    if (autoLockTimeLimit > 0) {
      return (
        <IdleTimer
          onAction={() => dispatch(setLastActiveTime())}
          throttle={1000}
        >
          {routes}
        </IdleTimer>
      );
    }

    return routes;
  }, [autoLockTimeLimit, forgottenPassword, dispatch]);

  const t = useI18nContext();
  const loadMessage =
    loadingMessage || isNetworkLoading
      ? getConnectingLabel(loadingMessage, { providerType, providerId }, { t })
      : null;

  const windowType = getEnvironmentType();

  const shouldShowNetworkDeprecationWarning =
    windowType !== ENVIRONMENT_TYPE_NOTIFICATION &&
    isUnlocked &&
    !shouldShowSeedPhraseReminder;

  const paramsConfirmationId: string = location.pathname.split(
    '/confirm-transaction/',
  )[1];
  const confirmationId = paramsConfirmationId ?? oldestPendingApproval?.id;
  const pendingApproval = pendingApprovals.find(
    (approval) => approval.id === confirmationId,
  );
  const isCorrectApprovalType = isCorrectSignatureApprovalType(
    pendingApproval?.type as ApprovalType | undefined,
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
      (confirmation: Confirmation) =>
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
        [`os-${os}`]: Boolean(os),
        [`browser-${browser}`]: Boolean(browser),
      })}
      dir={textDirection}
      onMouseUp={() => {
        switchedNetworkDetails &&
          !switchedNetworkNeverShowMessage &&
          dispatch(clearSwitchedNetworkDetails());
      }}
    >
      {shouldShowNetworkDeprecationWarning ? <DeprecatedNetworks /> : null}
      <QRHardwarePopover />
      <Modal />
      <Alert visible={alertOpen} msg={alertMessage} />
      {process.env.REMOVE_GNS
        ? showAppHeader({ location }) && <AppHeader location={location} />
        : !hideAppHeader({ location }) && <AppHeader location={location} />}
      {isConfirmTransactionRoute(location.pathname) && (
        <MultichainMetaFoxLogo />
      )}
      {showOnboardingHeader(location) && <OnboardingAppHeader />}
      {isAccountMenuOpen ? (
        <AccountListMenu
          onClose={() => dispatch(toggleAccountMenu())}
          privacyMode={privacyMode}
        />
      ) : null}
      {isNetworkMenuOpen ? (
        <NetworkListMenu
          onClose={() => {
            dispatch(toggleNetworkMenu());
            dispatch(setEditedNetwork());
          }}
        />
      ) : null}
      <NetworkConfirmationPopover />
      {accountDetailsAddress ? (
        <AccountDetails address={accountDetailsAddress} />
      ) : null}
      {isImportNftsModalOpen ? (
        <ImportNftsModal onClose={() => dispatch(hideImportNftsModal())} />
      ) : null}

      {isIpfsModalOpen ? (
        <ToggleIpfsModal onClose={() => dispatch(hideIpfsModal())} />
      ) : null}
      {isBasicConfigurationModalOpen ? <BasicConfigurationModal /> : null}
      {isImportTokensModalOpen ? (
        <ImportTokensModal onClose={() => dispatch(hideImportTokensModal())} />
      ) : null}
      {isDeprecatedNetworkModalOpen ? (
        <DeprecatedNetworkModal
          onClose={() => dispatch(hideDeprecatedNetworkModal())}
        />
      ) : null}
      {
        ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
        isShowKeyringSnapRemovalResultModal && (
          <KeyringSnapRemovalResult
            isOpen={isShowKeyringSnapRemovalResultModal}
            onClose={hideShowKeyringSnapRemovalResultModal}
          />
        )
        ///: END:ONLY_INCLUDE_IF
      }
      <Box className="main-container-wrapper">
        {isLoadingShown ? <Loading loadingMessage={loadMessage} /> : null}
        {!isLoading && isNetworkLoading && completedOnboarding ? (
          <LoadingNetwork />
        ) : null}
        {renderRoutes()}
      </Box>
      {isUnlocked ? <Alerts history={history} /> : null}
      <ToastMaster />
    </div>
  );
}
