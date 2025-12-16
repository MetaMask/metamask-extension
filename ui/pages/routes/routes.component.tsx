/* eslint-disable jsdoc/check-tag-names */
/* eslint-disable import/no-useless-path-segments */
/* eslint-disable import/extensions */
import classnames from 'classnames';
import React, { Suspense, useEffect, useMemo, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useRoutes, useLocation, useNavigationType } from 'react-router-dom';
import IdleTimer from 'react-idle-timer';
import type { ApprovalType } from '@metamask/controller-utils';

import { useAppSelector } from '../../store/store';
import Loading from '../../components/ui/loading-screen';
import { Modal } from '../../components/app/modals';
import Alert from '../../components/ui/alert';
import {
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
  PERMISSIONS,
  REVIEW_PERMISSIONS,
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
  ACCOUNT_LIST_PAGE_ROUTE,
  MULTICHAIN_ACCOUNT_ADDRESS_LIST_PAGE_ROUTE,
  MULTICHAIN_ACCOUNT_PRIVATE_KEY_LIST_PAGE_ROUTE,
  ADD_WALLET_PAGE_ROUTE,
  MULTICHAIN_ACCOUNT_DETAILS_PAGE_ROUTE,
  MULTICHAIN_WALLET_DETAILS_PAGE_ROUTE,
  MULTICHAIN_SMART_ACCOUNT_PAGE_ROUTE,
  NONEVM_BALANCE_CHECK_ROUTE,
  SHIELD_PLAN_ROUTE,
  GATOR_PERMISSIONS,
  TOKEN_TRANSFER_ROUTE,
  REVIEW_GATOR_PERMISSIONS_ROUTE,
  REWARDS_ROUTE,
} from '../../helpers/constants/routes';
import { getProviderConfig } from '../../../shared/modules/selectors/networks';
import {
  getNetworkIdentifier,
  getPreferences,
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  getUnapprovedConfirmations,
  ///: END:ONLY_INCLUDE_IF
  getShowExtensionInFullSizeView,
  getNetworkToAutomaticallySwitchTo,
  getNumberOfAllUnapprovedTransactionsAndMessages,
  oldestPendingConfirmationSelector,
  getUnapprovedTransactions,
  getPendingApprovals,
} from '../../selectors';
import { useTheme } from '../../hooks/useTheme';

import {
  hideImportNftsModal,
  hideIpfsModal,
  setCurrentCurrency,
  setLastActiveTime,
  toggleAccountMenu,
  hideImportTokensModal,
  hideDeprecatedNetworkModal,
  automaticallySwitchNetwork,
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  hideKeyringRemovalResultModal,
  ///: END:ONLY_INCLUDE_IF
} from '../../store/actions';
import { pageChanged } from '../../ducks/history/history';
import {
  getCompletedOnboarding,
  getIsUnlocked,
} from '../../ducks/metamask/metamask';
import { useI18nContext } from '../../hooks/useI18nContext';
import RewardsPage from '../rewards';
import { DEFAULT_AUTO_LOCK_TIME_LIMIT } from '../../../shared/constants/preferences';
import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES,
  ///: END:ONLY_INCLUDE_IF
} from '../../../shared/constants/app';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../app/scripts/lib/util';
import QRHardwarePopover from '../../components/app/qr-hardware-popover';
import { ToggleIpfsModal } from '../../components/app/assets/nfts/nft-default-image/toggle-ipfs-modal';
import { BasicConfigurationModal } from '../../components/app/basic-configuration-modal';
///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import KeyringSnapRemovalResult from '../../components/app/modals/keyring-snap-removal-modal';
///: END:ONLY_INCLUDE_IF
import { MultichainAccountListMenu } from '../../components/multichain-accounts/multichain-account-list-menu';

import { DeprecatedNetworkModal } from '../settings/deprecated-network-modal/DeprecatedNetworkModal';
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
import { MultichainAccountAddressListPage } from '../multichain-accounts/multichain-account-address-list-page';
import { MultichainAccountPrivateKeyListPage } from '../multichain-accounts/multichain-account-private-key-list-page';
import MultichainAccountIntroModalContainer from '../../components/app/modals/multichain-accounts/intro-modal';
import { useMultichainAccountsIntroModal } from '../../hooks/useMultichainAccountsIntroModal';
import { AccountList } from '../multichain-accounts/account-list';
import { AddWalletPage } from '../multichain-accounts/add-wallet-page';
import { WalletDetailsPage } from '../multichain-accounts/wallet-details-page';
import { ReviewPermissions } from '../../components/multichain/pages/review-permissions-page/review-permissions-page';
import { MultichainReviewPermissions } from '../../components/multichain-accounts/permissions/permission-review-page/multichain-review-permissions-page';
import { State2Wrapper } from '../../components/multichain-accounts/state2-wrapper/state2-wrapper';
import { RootLayout } from '../../layouts/root-layout';
import { LegacyLayout } from '../../layouts/legacy-layout';
import { createRouteWithLayout } from '../../layouts/route-with-layout';
import { getConnectingLabel, setTheme } from './utils';
import { ConfirmationHandler } from './confirmation-handler';
import { Modals } from './modals';

// TODO: Fix `as unknown as` casting once `mmLazy` is updated to handle named exports, wrapped components, and other React module types.
// Casting is preferable over `@ts-expect-error` annotations in this case,
// because it doesn't suppress competing error messages e.g. "Cannot find module..."

// Begin Lazy Routes
const OnboardingFlow = mmLazy(
  (() => import('../onboarding-flow/index.ts')) as unknown as DynamicImportType,
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
  (() =>
    import('../confirmations/send/index.ts')) as unknown as DynamicImportType,
);
const Swaps = mmLazy(
  (() => import('../swaps/index.js')) as unknown as DynamicImportType,
);
const CrossChainSwap = mmLazy(
  (() => import('../bridge/index.tsx')) as unknown as DynamicImportType,
);
const PermissionsConnect = mmLazy(
  (() =>
    import('../permissions-connect/index.js')) as unknown as DynamicImportType,
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
const GatorPermissionsPage = mmLazy(
  // TODO: This is a named export. Fix incorrect type casting once `mmLazy` is updated to handle non-default export types.
  (() =>
    import(
      '../../components/multichain/pages/gator-permissions/gator-permissions-page.tsx'
    )) as unknown as DynamicImportType,
);
const TokenTransferPage = mmLazy(
  // TODO: This is a named export. Fix incorrect type casting once `mmLazy` is updated to handle non-default export types.
  (() =>
    import(
      '../../components/multichain/pages/gator-permissions/token-transfer/token-transfer-page.tsx'
    )) as unknown as DynamicImportType,
);
const ReviewGatorPermissionsPage = mmLazy(
  // TODO: This is a named export. Fix incorrect type casting once `mmLazy` is updated to handle non-default export types.
  (() =>
    import(
      '../../components/multichain/pages/gator-permissions/review-permissions/review-gator-permissions-page.tsx'
    )) as unknown as DynamicImportType,
);

const Home = mmLazy(
  (() => import('../home/index.js')) as unknown as DynamicImportType,
);

const DeepLink = mmLazy(
  // TODO: This is a named export. Fix incorrect type casting once `mmLazy` is updated to handle non-default export types.
  (() => import('../deep-link/deep-link.tsx')) as unknown as DynamicImportType,
);

const MultichainAccountDetailsPage = mmLazy(
  (() =>
    import(
      '../multichain-accounts/multichain-account-details-page/index.ts'
    )) as unknown as DynamicImportType,
);

const SmartAccountPage = mmLazy(
  (() =>
    import(
      '../multichain-accounts/smart-account-page/index.ts'
    )) as unknown as DynamicImportType,
);

const NonEvmBalanceCheck = mmLazy(
  (() =>
    import(
      '../nonevm-balance-check/index.tsx'
    )) as unknown as DynamicImportType,
);

const ShieldPlan = mmLazy(
  (() => import('../shield-plan/index.ts')) as unknown as DynamicImportType,
);
// End Lazy Routes

const MemoizedReviewPermissionsWrapper = React.memo(() => (
  <State2Wrapper
    state1Component={ReviewPermissions as React.ComponentType<unknown>}
    state2Component={
      MultichainReviewPermissions as React.ComponentType<unknown>
    }
  />
));

// eslint-disable-next-line @typescript-eslint/naming-convention
export default function Routes() {
  const dispatch = useDispatch();
  const location = useLocation();
  const navType = useNavigationType();

  const alertOpen = useAppSelector((state) => state.appState.alertOpen);
  const alertMessage = useAppSelector((state) => state.appState.alertMessage);
  const isLoading = useAppSelector((state) => state.appState.isLoading);
  const loadingMessage = useAppSelector(
    (state) => state.appState.loadingMessage,
  );
  const { autoLockTimeLimit = DEFAULT_AUTO_LOCK_TIME_LIMIT, privacyMode } =
    useAppSelector(getPreferences);
  const completedOnboarding = useAppSelector(getCompletedOnboarding);

  const networkToAutomaticallySwitchTo = useAppSelector(
    getNetworkToAutomaticallySwitchTo,
  );
  const oldestPendingApproval = useAppSelector(
    oldestPendingConfirmationSelector,
  );
  const pendingApprovals = useAppSelector(getPendingApprovals);
  const transactionsMetadata = useAppSelector(getUnapprovedTransactions);

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
  const theme = useTheme();
  const showExtensionInFullSizeView = useAppSelector(
    getShowExtensionInFullSizeView,
  );
  const isAccountMenuOpen = useAppSelector(
    (state) => state.appState.isAccountMenuOpen,
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

  // Multichain intro modal logic (extracted to custom hook)
  const { showMultichainIntroModal, setShowMultichainIntroModal } =
    useMultichainAccountsIntroModal(isUnlocked, location);

  const prevPropsRef = useRef({
    isUnlocked,
    totalUnapprovedConfirmationCount,
  });

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

    prevPropsRef.current = {
      isUnlocked,
      totalUnapprovedConfirmationCount,
    };
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
    if (
      showExtensionInFullSizeView &&
      (windowType === ENVIRONMENT_TYPE_POPUP ||
        windowType === ENVIRONMENT_TYPE_SIDEPANEL)
    ) {
      global.platform?.openExtensionInBrowser?.();
    }
  }, [showExtensionInFullSizeView]);

  // Track location changes for metrics
  useEffect(() => {
    if (navType === 'PUSH') {
      dispatch(pageChanged(location.pathname));
    }
  }, [location.pathname, navType, dispatch]);

  useEffect(() => {
    setTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (!currentCurrency) {
      dispatch(setCurrentCurrency('usd'));
    }
  }, [currentCurrency, dispatch]);

  // Define all routes using createRouteWithLayout
  const routeConfig = useMemo(
    () => [
      createRouteWithLayout({
        path: `${ONBOARDING_ROUTE}/*`,
        component: OnboardingFlow,
        layout: LegacyLayout,
      }),
      createRouteWithLayout({
        path: LOCK_ROUTE,
        component: Lock,
        layout: LegacyLayout,
      }),
      createRouteWithLayout({
        path: UNLOCK_ROUTE,
        component: UnlockPage,
        layout: LegacyLayout,
        initialized: true,
      }),
      createRouteWithLayout({
        path: DEEP_LINK_ROUTE,
        component: DeepLink,
        layout: LegacyLayout,
      }),
      createRouteWithLayout({
        path: RESTORE_VAULT_ROUTE,
        component: RestoreVaultPage,
        layout: LegacyLayout,
      }),
      createRouteWithLayout({
        path: SMART_ACCOUNT_UPDATE,
        component: SmartAccountUpdate,
        layout: LegacyLayout,
        authenticated: true,
      }),
      createRouteWithLayout({
        path: `${REVEAL_SEED_ROUTE}/:keyringId?`,
        component: RevealSeedConfirmation,
        layout: RootLayout,
        authenticated: true,
      }),
      createRouteWithLayout({
        path: IMPORT_SRP_ROUTE,
        component: ImportSrpPage,
        layout: RootLayout,
        authenticated: true,
      }),
      createRouteWithLayout({
        path: `${SETTINGS_ROUTE}/*`,
        component: Settings,
        layout: RootLayout,
        authenticated: true,
      }),
      createRouteWithLayout({
        path: NOTIFICATIONS_SETTINGS_ROUTE,
        component: NotificationsSettings,
        layout: RootLayout,
        authenticated: true,
      }),
      createRouteWithLayout({
        path: `${NOTIFICATIONS_ROUTE}/:uuid`,
        component: NotificationDetails,
        layout: RootLayout,
        authenticated: true,
      }),
      createRouteWithLayout({
        path: NOTIFICATIONS_ROUTE,
        component: Notifications,
        layout: RootLayout,
        authenticated: true,
      }),
      createRouteWithLayout({
        path: SNAPS_ROUTE,
        component: SnapList,
        layout: RootLayout,
        authenticated: true,
      }),
      createRouteWithLayout({
        path: `${SNAPS_VIEW_ROUTE}/*`,
        component: SnapView,
        layout: RootLayout,
        authenticated: true,
      }),
      createRouteWithLayout({
        path: `${SEND_ROUTE}/:page?`,
        component: SendPage,
        layout: RootLayout,
        authenticated: true,
      }),
      createRouteWithLayout({
        path: `${CONFIRM_TRANSACTION_ROUTE}/:id?/*`,
        component: ConfirmTransaction,
        layout: RootLayout,
        authenticated: true,
      }),
      createRouteWithLayout({
        path: `${SWAPS_ROUTE}/*`,
        component: Swaps,
        layout: LegacyLayout,
        authenticated: true,
      }),
      createRouteWithLayout({
        path: `${CROSS_CHAIN_SWAP_TX_DETAILS_ROUTE}/:srcTxMetaId`,
        component: CrossChainSwapTxDetails,
        layout: LegacyLayout,
        authenticated: true,
      }),
      createRouteWithLayout({
        path: `${CROSS_CHAIN_SWAP_ROUTE}/*`,
        component: CrossChainSwap,
        layout: RootLayout,
        authenticated: true,
      }),
      createRouteWithLayout({
        path: CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE,
        component: ConfirmAddSuggestedTokenPage,
        layout: LegacyLayout,
        authenticated: true,
      }),
      createRouteWithLayout({
        path: CONFIRM_ADD_SUGGESTED_NFT_ROUTE,
        component: ConfirmAddSuggestedNftPage,
        layout: LegacyLayout,
        authenticated: true,
      }),
      createRouteWithLayout({
        path: `${CONFIRMATION_V_NEXT_ROUTE}/:id?`,
        component: ConfirmationPage,
        layout: RootLayout,
        authenticated: true,
      }),
      createRouteWithLayout({
        path: `${NEW_ACCOUNT_ROUTE}/*`,
        component: CreateAccountPage,
        layout: RootLayout,
        authenticated: true,
      }),
      createRouteWithLayout({
        path: `${CONNECT_ROUTE}/:id/*`,
        component: PermissionsConnect,
        layout: RootLayout,
        authenticated: true,
      }),
      createRouteWithLayout({
        path: `${ASSET_ROUTE}/image/:asset/:id`,
        component: NftFullImage,
        layout: RootLayout,
        authenticated: true,
      }),
      createRouteWithLayout({
        path: `${ASSET_ROUTE}/:chainId/:asset/:id`,
        component: Asset,
        layout: RootLayout,
        authenticated: true,
      }),
      createRouteWithLayout({
        path: `${ASSET_ROUTE}/:chainId/:asset/`,
        component: Asset,
        layout: RootLayout,
        authenticated: true,
      }),
      createRouteWithLayout({
        path: `${ASSET_ROUTE}/:chainId`,
        component: Asset,
        layout: RootLayout,
        authenticated: true,
      }),
      createRouteWithLayout({
        path: `${DEFI_ROUTE}/:chainId/:protocolId`,
        component: DeFiPage,
        layout: RootLayout,
        authenticated: true,
      }),
      createRouteWithLayout({
        path: PERMISSIONS,
        component: PermissionsPage,
        layout: RootLayout,
        authenticated: true,
      }),
      createRouteWithLayout({
        path: GATOR_PERMISSIONS,
        component: GatorPermissionsPage,
        layout: LegacyLayout,
        authenticated: true,
      }),
      createRouteWithLayout({
        path: `${TOKEN_TRANSFER_ROUTE}/:origin`,
        component: TokenTransferPage,
        layout: LegacyLayout,
        authenticated: true,
      }),
      createRouteWithLayout({
        path: TOKEN_TRANSFER_ROUTE,
        component: TokenTransferPage,
        layout: LegacyLayout,
        authenticated: true,
      }),
      createRouteWithLayout({
        path: `${REVIEW_GATOR_PERMISSIONS_ROUTE}/:chainId/:permissionGroupName/:origin`,
        component: ReviewGatorPermissionsPage,
        layout: LegacyLayout,
        authenticated: true,
      }),
      createRouteWithLayout({
        path: `${REVIEW_GATOR_PERMISSIONS_ROUTE}/:chainId/:permissionGroupName`,
        component: ReviewGatorPermissionsPage,
        layout: LegacyLayout,
        authenticated: true,
      }),
      createRouteWithLayout({
        path: `${REVIEW_PERMISSIONS}/:origin`,
        component: MemoizedReviewPermissionsWrapper,
        layout: RootLayout,
        authenticated: true,
      }),
      createRouteWithLayout({
        path: ACCOUNT_LIST_PAGE_ROUTE,
        component: AccountList,
        layout: RootLayout,
        authenticated: true,
      }),
      createRouteWithLayout({
        path: `${MULTICHAIN_ACCOUNT_ADDRESS_LIST_PAGE_ROUTE}/:accountGroupId`,
        component: MultichainAccountAddressListPage,
        layout: RootLayout,
        authenticated: true,
      }),
      createRouteWithLayout({
        path: `${MULTICHAIN_ACCOUNT_PRIVATE_KEY_LIST_PAGE_ROUTE}/:accountGroupId`,
        component: MultichainAccountPrivateKeyListPage,
        layout: RootLayout,
        authenticated: true,
      }),
      createRouteWithLayout({
        path: ADD_WALLET_PAGE_ROUTE,
        component: AddWalletPage,
        layout: RootLayout,
        authenticated: true,
      }),
      createRouteWithLayout({
        path: `${MULTICHAIN_ACCOUNT_DETAILS_PAGE_ROUTE}/:id`,
        component: MultichainAccountDetailsPage,
        layout: RootLayout,
        authenticated: true,
      }),
      createRouteWithLayout({
        path: `${MULTICHAIN_SMART_ACCOUNT_PAGE_ROUTE}/:address`,
        component: SmartAccountPage,
        layout: RootLayout,
        authenticated: true,
      }),
      createRouteWithLayout({
        path: `${MULTICHAIN_WALLET_DETAILS_PAGE_ROUTE}/:id`,
        component: WalletDetailsPage,
        layout: RootLayout,
        authenticated: true,
      }),
      createRouteWithLayout({
        path: NONEVM_BALANCE_CHECK_ROUTE,
        component: NonEvmBalanceCheck,
        layout: LegacyLayout,
        authenticated: true,
      }),
      createRouteWithLayout({
        path: SHIELD_PLAN_ROUTE,
        component: ShieldPlan,
        layout: LegacyLayout,
        authenticated: true,
      }),
      createRouteWithLayout({
        path: REWARDS_ROUTE,
        component: RewardsPage,
        layout: RootLayout,
        authenticated: true,
      }),
      createRouteWithLayout({
        path: DEFAULT_ROUTE,
        component: Home,
        layout: RootLayout,
        authenticated: true,
      }),
    ],
    [],
  );

  // Use useRoutes hook to render routes - called on every render to track location changes
  const routeElements = useRoutes(routeConfig);

  const renderRoutes = () => {
    const routes = <Suspense fallback={null}>{routeElements}</Suspense>;

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
  };

  const t = useI18nContext();

  const loadMessage = loadingMessage
    ? getConnectingLabel(loadingMessage, { providerType, providerId }, { t })
    : null;

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

  const accountListMenu = (
    <MultichainAccountListMenu
      onClose={() => dispatch(toggleAccountMenu())}
      privacyMode={privacyMode}
    />
  );

  const isSidepanel = getEnvironmentType() === ENVIRONMENT_TYPE_SIDEPANEL;

  return (
    <div
      className={classnames('app', {
        [`os-${os}`]: Boolean(os),
        [`browser-${browser}`]: Boolean(browser),
        'group app--sidepanel': isSidepanel,
      })}
      dir={textDirection}
    >
      <ConfirmationHandler />
      <QRHardwarePopover />
      <Modal />
      <Alert visible={alertOpen} msg={alertMessage} />

      {isAccountMenuOpen ? accountListMenu : null}

      <NetworkConfirmationPopover />
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

      {showMultichainIntroModal ? (
        <MultichainAccountIntroModalContainer
          onClose={() => setShowMultichainIntroModal(false)}
        />
      ) : null}

      {isLoadingShown ? <Loading loadingMessage={loadMessage} /> : null}

      {renderRoutes()}

      {isUnlocked ? <Alerts /> : null}
      <ToastMaster />
      <Modals />
    </div>
  );
}
