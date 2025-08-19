/* eslint-disable jsdoc/check-tag-names */
/* eslint-disable import/no-useless-path-segments */
/* eslint-disable import/extensions */
import classnames from 'classnames';
import React, { Suspense, useCallback, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { Route, Switch, useHistory, useLocation } from 'react-router-dom';
import IdleTimer from 'react-idle-timer';
import type { ApprovalType } from '@metamask/controller-utils';

import { useAppSelector } from '../../store/store';
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
  SITES,
  TOKEN_STREAMS_ROUTE,
  REVIEW_TOKEN_STREAMS_ROUTE,
  TOKEN_SUBSCRIPTIONS_ROUTE,
  REVIEW_TOKEN_SUBSCRIPTIONS_ROUTE,
  SNAPS_ROUTE,
  SNAPS_VIEW_ROUTE,
  NOTIFICATIONS_ROUTE,
  NOTIFICATIONS_SETTINGS_ROUTE,
  CROSS_CHAIN_SWAP_ROUTE,
  CROSS_CHAIN_SWAP_TX_DETAILS_ROUTE,
  IMPORT_SRP_ROUTE,
  DEFI_ROUTE,
  DEEP_LINK_ROUTE,
  SMART_ACCOUNT_UPDATE,
  WALLET_DETAILS_ROUTE,
  ACCOUNT_DETAILS_ROUTE,
  ACCOUNT_DETAILS_QR_CODE_ROUTE,
  ACCOUNT_LIST_PAGE_ROUTE,
  MULTICHAIN_ACCOUNT_DETAILS_PAGE_ROUTE,
} from '../../helpers/constants/routes';
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
  getNetworkToAutomaticallySwitchTo,
  getNumberOfAllUnapprovedTransactionsAndMessages,
  getSelectedInternalAccount,
  oldestPendingConfirmationSelector,
  getUnapprovedTransactions,
  getPendingApprovals,
  getIsMultichainAccountsState1Enabled,
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
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  hideKeyringRemovalResultModal,
  ///: END:ONLY_INCLUDE_IF
  setEditedNetwork,
} from '../../store/actions';
import { pageChanged } from '../../ducks/history/history';
import {
  getCompletedOnboarding,
  getIsUnlocked,
} from '../../ducks/metamask/metamask';
import { useI18nContext } from '../../hooks/useI18nContext';
import { DEFAULT_AUTO_LOCK_TIME_LIMIT } from '../../../shared/constants/preferences';
import { getShouldShowSeedPhraseReminder } from '../../selectors/multi-srp/multi-srp';

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
import { MultichainAccountListMenu } from '../../components/multichain-accounts/multichain-account-list-menu';

import { DeprecatedNetworkModal } from '../settings/deprecated-network-modal/DeprecatedNetworkModal';
import { MultichainMetaFoxLogo } from '../../components/multichain/app-header/multichain-meta-fox-logo';
import NetworkConfirmationPopover from '../../components/multichain/network-list-menu/network-confirmation-popover/network-confirmation-popover';
import { ToastMaster } from '../../components/app/toast-master/toast-master';
import { type DynamicImportType, mmLazy } from '../../helpers/utils/mm-lazy';
import CrossChainSwapTxDetails from '../bridge/transaction-details/transaction-details';
import {
  isCorrectDeveloperTransactionType,
  isCorrectSignatureApprovalType,
} from '../../../shared/lib/confirmation.utils';
import { type Confirmation } from '../confirmations/types/confirm';
import { SmartAccountUpdate } from '../confirmations/components/confirm/smart-account-update';
import { MultichainAccountDetails } from '../multichain-accounts/account-details';
import { AddressQRCode } from '../multichain-accounts/address-qr-code';
import { AccountList } from '../multichain-accounts/account-list';
import {
  getConnectingLabel,
  hideAppHeader,
  isConfirmTransactionRoute,
  setTheme,
  showAppHeader,
} from './utils';

// TODO: Fix `as unknown as` casting once `mmLazy` is updated to handle named exports, wrapped components, and other React module types.
// Casting is preferable over `@ts-expect-error` annotations in this case,
// because it doesn't suppress competing error messages e.g. "Cannot find module..."

// Begin Lazy Routes
const OnboardingFlow = mmLazy(
  (() =>
    import(
      '../onboarding-flow/onboarding-flow.js'
    )) as unknown as DynamicImportType,
);
const Lock = mmLazy(
  (() => import('../lock/index.js')) as unknown as DynamicImportType,
);
const UnlockPage = mmLazy(
  (() => import('../unlock-page/index.js')) as unknown as DynamicImportType,
);
const RestoreVaultPage = mmLazy(
  (() =>
    import('../keychains/restore-vault.js')) as unknown as DynamicImportType,
);
const ImportSrpPage = mmLazy(
  // TODO: This is a named export. Fix incorrect type casting once `mmLazy` is updated to handle non-default export types.
  (() =>
    import('../multi-srp/import-srp/index.ts')) as unknown as DynamicImportType,
);
const RevealSeedConfirmation = mmLazy(
  (() => import('../keychains/reveal-seed.js')) as unknown as DynamicImportType,
);
const Settings = mmLazy(
  (() => import('../settings/index.js')) as unknown as DynamicImportType,
);
const NotificationsSettings = mmLazy(
  (() =>
    import(
      '../notifications-settings/index.js'
    )) as unknown as DynamicImportType,
);
const NotificationDetails = mmLazy(
  (() =>
    import('../notification-details/index.js')) as unknown as DynamicImportType,
);
const Notifications = mmLazy(
  (() => import('../notifications/index.js')) as unknown as DynamicImportType,
);
const SnapList = mmLazy(
  (() =>
    import('../snaps/snaps-list/index.js')) as unknown as DynamicImportType,
);
const SnapView = mmLazy(
  (() => import('../snaps/snap-view/index.js')) as unknown as DynamicImportType,
);
const ConfirmTransaction = mmLazy(
  (() =>
    import(
      '../confirmations/confirm-transaction/index.js'
    )) as unknown as DynamicImportType,
);
const SendPage = mmLazy(
  // TODO: This is a named export. Fix incorrect type casting once `mmLazy` is updated to handle non-default export types.
  (() => {
    if (process.env.SEND_REDESIGN_ENABLED) {
      return import('../confirmations/send/index.ts');
    }
    return import('../../components/multichain/pages/send/index.js');
  }) as unknown as DynamicImportType,
);
const Swaps = mmLazy(
  (() => import('../swaps/index.js')) as unknown as DynamicImportType,
);
const CrossChainSwap = mmLazy(
  (() => import('../bridge/index.tsx')) as unknown as DynamicImportType,
);
const ConfirmAddSuggestedTokenPage = mmLazy(
  (() =>
    import(
      '../confirm-add-suggested-token/index.js'
    )) as unknown as DynamicImportType,
);
const ConfirmAddSuggestedNftPage = mmLazy(
  (() =>
    import(
      '../confirm-add-suggested-nft/index.js'
    )) as unknown as DynamicImportType,
);
const ConfirmationPage = mmLazy(
  (() =>
    import(
      '../confirmations/confirmation/index.js'
    )) as unknown as DynamicImportType,
);
const CreateAccountPage = mmLazy(
  (() =>
    import(
      '../create-account/create-account.component.js'
    )) as unknown as DynamicImportType,
);
const NftFullImage = mmLazy(
  (() =>
    import(
      '../../components/app/assets/nfts/nft-details/nft-full-image.tsx'
    )) as unknown as DynamicImportType,
);
const Asset = mmLazy(
  (() => import('../asset/index.js')) as unknown as DynamicImportType,
);
const DeFiPage = mmLazy(
  (() => import('../defi/index.ts')) as unknown as DynamicImportType,
);
const PermissionsPage = mmLazy(
  // TODO: This is a named export. Fix incorrect type casting once `mmLazy` is updated to handle non-default export types.
  (() =>
    import(
      '../../components/multichain/pages/permissions-page/permissions-page.js'
    )) as unknown as DynamicImportType,
);
const Connections = mmLazy(
  // TODO: This is a named export. Fix incorrect type casting once `mmLazy` is updated to handle non-default export types.
  (() =>
    import(
      '../../components/multichain/pages/connections/index.js'
    )) as unknown as DynamicImportType,
);
const ReviewPermissions = mmLazy(
  // TODO: This is a named export. Fix incorrect type casting once `mmLazy` is updated to handle non-default export types.
  (() =>
    import(
      '../../components/multichain/pages/review-permissions-page/review-permissions-page.tsx'
    )) as unknown as DynamicImportType,
);
const PermissionsPageV2 = mmLazy(
  // TODO: This is a named export. Fix incorrect type casting once `mmLazy` is updated to handle non-default export types.
  (() =>
    import(
      '../../components/multichain/pages/permissions-page/permissions-page-v2.js'
    )) as unknown as DynamicImportType,
);
const SitesPage = mmLazy(
  // TODO: This is a named export. Fix incorrect type casting once `mmLazy` is updated to handle non-default export types.
  (() =>
    import(
      '../../components/multichain/pages/sites-page/sites-page.js'
    )) as unknown as DynamicImportType,
);
const TokenStreamsPage = mmLazy(
  // TODO: This is a named export. Fix incorrect type casting once `mmLazy` is updated to handle non-default export types.
  import(
    '../../components/multichain/pages/gator-permissions-page/token-streams/token-streams-page.js'
  ) as unknown as DynamicImportType,
);
const ReviewTokenStreamsPage = mmLazy(
  // TODO: This is a named export. Fix incorrect type casting once `mmLazy` is updated to handle non-default export types.
  import(
    '../../components/multichain/pages/gator-permissions-page/token-streams/review-token-streams-page.js'
  ) as unknown as DynamicImportType,
);
const TokenSubscriptionsPage = mmLazy(
  // TODO: This is a named export. Fix incorrect type casting once `mmLazy` is updated to handle non-default export types.
  import(
    '../../components/multichain/pages/gator-permissions-page/token-subscriptions/token-subscriptions-page.js'
  ) as unknown as DynamicImportType,
);
const ReviewTokenSubscriptionsPage = mmLazy(
  // TODO: This is a named export. Fix incorrect type casting once `mmLazy` is updated to handle non-default export types.
  import(
    '../../components/multichain/pages/gator-permissions-page/token-subscriptions/review-token-subscriptions-page.js'
  ) as unknown as DynamicImportType,
);

const Home = mmLazy(
  (() => import('../home/index.js')) as unknown as DynamicImportType,
);

const DeepLink = mmLazy(
  // TODO: This is a named export. Fix incorrect type casting once `mmLazy` is updated to handle non-default export types.
  (() => import('../deep-link/deep-link.tsx')) as unknown as DynamicImportType,
);
const WalletDetails = mmLazy(
  (() =>
    import(
      '../multichain-accounts/wallet-details/index.ts'
    )) as unknown as DynamicImportType,
);

const MultichainAccountDetailsPage = mmLazy(
  (() =>
    import(
      '../multichain-accounts/multichain-account-details-page/index.ts'
    )) as unknown as DynamicImportType,
);
// End Lazy Routes

// eslint-disable-next-line @typescript-eslint/naming-convention
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
  const completedOnboarding = useAppSelector(getCompletedOnboarding);

  // If there is more than one connected account to activeTabOrigin,
  // *BUT* the current account is not one of them, show the banner
  const account = useAppSelector(getSelectedInternalAccount);
  const isNetworkLoading = useAppSelector(getIsNetworkLoading);

  const networkToAutomaticallySwitchTo = useAppSelector(
    getNetworkToAutomaticallySwitchTo,
  );
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

  const isMultichainAccountsState1Enabled = useAppSelector(
    getIsMultichainAccountsState1Enabled,
  );

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
      dispatch(automaticallySwitchNetwork(networkToAutomaticallySwitchTo));
    }

    prevPropsRef.current = { isUnlocked, totalUnapprovedConfirmationCount };
  }, [
    networkToAutomaticallySwitchTo,
    isUnlocked,
    totalUnapprovedConfirmationCount,
    dispatch,
  ]);

  useEffect(() => {
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
  }, [currentExtensionPopupId]);

  useEffect(() => {
    const windowType = getEnvironmentType();
    const { openExtensionInBrowser } = globalThis.platform ?? {};
    if (
      showExtensionInFullSizeView &&
      windowType === ENVIRONMENT_TYPE_POPUP &&
      openExtensionInBrowser
    ) {
      openExtensionInBrowser();
    }
  }, [showExtensionInFullSizeView]);

  useEffect(() => {
    const unlisten = history.listen((locationObj: Location, action: 'PUSH') => {
      if (action === 'PUSH') {
        dispatch(pageChanged(locationObj.pathname));
      }
    });

    return () => {
      unlisten();
    };
  }, [history, dispatch]);

  useEffect(() => {
    setTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (!currentCurrency) {
      dispatch(setCurrentCurrency('usd'));
    }
  }, [currentCurrency, dispatch]);

  const renderRoutes = useCallback(() => {
    const RestoreVaultComponent = forgottenPassword ? Route : Initialized;

    const routes = (
      <Suspense fallback={null}>
        {/* since the loading time is less than 200ms, we decided not to show a spinner fallback or anything */}
        <Switch>
          {/** @ts-expect-error TODO: Replace `component` prop with `element` once `react-router` is upgraded to v6 */}
          <Route path={ONBOARDING_ROUTE} component={OnboardingFlow} />
          {/** @ts-expect-error TODO: Replace `component` prop with `element` once `react-router` is upgraded to v6 */}
          <Route path={LOCK_ROUTE} component={Lock} exact />
          <Initialized path={UNLOCK_ROUTE} component={UnlockPage} exact />
          {/** @ts-expect-error TODO: Replace `component` prop with `element` once `react-router` is upgraded to v6 */}
          <Route path={DEEP_LINK_ROUTE} component={DeepLink} />
          <RestoreVaultComponent
            path={RESTORE_VAULT_ROUTE}
            component={RestoreVaultPage}
            exact
          />
          <Authenticated
            path={SMART_ACCOUNT_UPDATE}
            component={SmartAccountUpdate}
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
          <Authenticated path={SNAPS_ROUTE} component={SnapList} exact />
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
          <Authenticated
            path={PERMISSIONS}
            component={
              process.env.PERMISSIONS_PAGE_V2
                ? PermissionsPageV2
                : PermissionsPage
            }
            exact
          />
             <Authenticated path={SITES} component={SitesPage} exact />
          <Authenticated
            path={TOKEN_STREAMS_ROUTE}
            component={TokenStreamsPage}
            exact
          />
          <Authenticated
            path={`${REVIEW_TOKEN_STREAMS_ROUTE}/:chainId`}
            component={ReviewTokenStreamsPage}
            exact
          />
          <Authenticated
            path={TOKEN_SUBSCRIPTIONS_ROUTE}
            component={TokenSubscriptionsPage}
            exact
          />
          <Authenticated
            path={`${REVIEW_TOKEN_SUBSCRIPTIONS_ROUTE}/:chainId`}
            component={ReviewTokenSubscriptionsPage}
            exact
          />
          <Authenticated
            path={`${REVIEW_PERMISSIONS}/:origin`}
            component={ReviewPermissions}
            exact
          />
          <Authenticated
            path={ACCOUNT_LIST_PAGE_ROUTE}
            component={AccountList}
            exact
          />
          <Authenticated
            path={`${MULTICHAIN_ACCOUNT_DETAILS_PAGE_ROUTE}/:id`}
            component={MultichainAccountDetailsPage}
            exact
          />
          <Authenticated
            path={WALLET_DETAILS_ROUTE}
            component={WalletDetails}
            exact
          />
          <Authenticated
            path={`${ACCOUNT_DETAILS_ROUTE}/:address`}
            component={MultichainAccountDetails}
            exact
          />
          <Authenticated
            path={`${ACCOUNT_DETAILS_QR_CODE_ROUTE}/:address`}
            component={AddressQRCode}
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

  const renderAccountDetails = () => {
    if (!accountDetailsAddress || isMultichainAccountsState1Enabled) {
      return null;
    }
    return <AccountDetails address={accountDetailsAddress} />;
  };

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

  const isShowingDeepLinkRoute = location.pathname === DEEP_LINK_ROUTE;

  const isLoadingShown =
    isLoading &&
    completedOnboarding &&
    ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
    !pendingConfirmations.some(
      (confirmation: Confirmation) =>
        confirmation.type ===
        SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showSnapAccountRedirect,
    ) &&
    ///: END:ONLY_INCLUDE_IF
    // In the redesigned screens, we hide the general loading spinner and the
    // loading states are on a component by component basis.
    !isCorrectApprovalType &&
    !isCorrectTransactionType &&
    // We don't want to show the loading screen on the deep link route, as it
    // is already a fullscreen interface.
    !isShowingDeepLinkRoute;

  const accountListMenu = isMultichainAccountsState1Enabled ? (
    <MultichainAccountListMenu
      onClose={() => dispatch(toggleAccountMenu())}
      privacyMode={privacyMode}
    />
  ) : (
    <AccountListMenu
      onClose={() => dispatch(toggleAccountMenu())}
      privacyMode={privacyMode}
    />
  );

  return (
    <div
      className={classnames('app', {
        [`os-${os}`]: Boolean(os),
        [`browser-${browser}`]: Boolean(browser),
      })}
      dir={textDirection}
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
      {isAccountMenuOpen ? accountListMenu : null}
      {isNetworkMenuOpen ? (
        <NetworkListMenu
          onClose={() => {
            dispatch(toggleNetworkMenu());
            dispatch(setEditedNetwork());
          }}
        />
      ) : null}
      <NetworkConfirmationPopover />
      {renderAccountDetails()}
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
        {!isLoading &&
        isUnlocked &&
        isNetworkLoading &&
        completedOnboarding &&
        !isShowingDeepLinkRoute ? (
          <LoadingNetwork />
        ) : null}
        {renderRoutes()}
      </Box>
      {isUnlocked ? <Alerts history={history} /> : null}
      <ToastMaster />
    </div>
  );
}
