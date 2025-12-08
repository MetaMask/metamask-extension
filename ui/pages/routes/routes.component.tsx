/* eslint-disable jsdoc/check-tag-names */
/* eslint-disable import/no-useless-path-segments */
/* eslint-disable import/extensions */
import classnames from 'classnames';
import React, { Suspense, useCallback, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import {
  Route,
  type RouteComponentProps,
  Switch,
  useHistory,
  useLocation,
} from 'react-router-dom';
import type { To } from 'react-router-dom-v5-compat';
import IdleTimer from 'react-idle-timer';
import type { ApprovalType } from '@metamask/controller-utils';

import { useAppSelector } from '../../store/store';
import AuthenticatedV5Compat from '../../helpers/higher-order-components/authenticated/authenticated-v5-compat';
import Initialized from '../../helpers/higher-order-components/initialized';
import InitializedV5Compat from '../../helpers/higher-order-components/initialized/initialized-v5-compat';
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
  CONNECTIONS,
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
  getTheme,
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
import { RouteWithLayout } from '../../layouts/route-with-layout';
import { getConnectingLabel, setTheme } from './utils';
import { ConfirmationHandler } from './confirmation-handler';
import { Modals } from './modals';

/**
 * V5-to-v5-compat navigation function that bridges react-router-dom v5 history
 * with v5-compat components expecting the newer navigate API.
 *
 * Supports two call signatures:
 * - Navigate to a route: `navigate(path, options)`
 * - Navigate in history: `navigate(delta)` (e.g., -1 to go back)
 *
 * @example
 * // Navigate to a new route
 * navigate('/settings', { replace: true });
 * @example
 * // Go back in history
 * navigate(-1);
 */
type V5CompatNavigate = {
  (
    to: To,
    options?: { replace?: boolean; state?: Record<string, unknown> },
  ): void;
  (delta: number): void;
};

/**
 * Creates a v5-compat navigate function from v5 history
 * Used to bridge v5 routes with components expecting v5-compat navigation
 *
 * @param history
 */
const createV5CompatNavigate = (
  history: RouteComponentProps['history'],
): V5CompatNavigate => {
  return (
    to: To | number,
    options?: { replace?: boolean; state?: Record<string, unknown> },
  ) => {
    if (typeof to === 'number') {
      history.go(to);
    } else if (options?.replace) {
      history.replace(to as string, options.state);
    } else {
      history.push(to as string, options?.state);
    }
  };
};

/**
 * Helper to create v5-compat route wrappers with less boilerplate.
 * Handles authentication, navigation, and prop passing for v5-to-v5-compat transition.
 *
 * NOTE: This is temporary scaffolding for the v5-compat transition.
 * It will be removed during the full v6 migration when routes use native v6 patterns.
 *
 * @param Component - The component to render
 * @param options - Configuration options
 * @param options.wrapper - Wrapper component (AuthenticatedV5Compat, InitializedV5Compat, or null for none)
 * @param options.includeNavigate - Whether to pass navigate prop
 * @param options.includeLocation - Whether to pass location prop
 * @param options.includeParams - Whether to pass params from route match
 * @param options.includeMatch - Whether to pass the entire match object
 * @param options.paramsAsProps - Whether to spread params as individual props (default: true)
 * @returns Route render function
 */
const createV5CompatRoute = <
  TParams extends Record<string, string | undefined> = Record<
    string,
    string | undefined
  >,
>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Component: React.ComponentType<any>,
  options: {
    wrapper?: React.ComponentType<{ children: React.ReactNode }> | null;
    includeNavigate?: boolean;
    includeLocation?: boolean;
    includeParams?: boolean;
    includeMatch?: boolean;
    paramsAsProps?: boolean;
  } = {},
) => {
  const {
    wrapper = null,
    includeNavigate = false,
    includeLocation = false,
    includeParams = false,
    includeMatch = false,
    paramsAsProps = true,
  } = options;

  return (props: RouteComponentProps<TParams>) => {
    const { history: v5History, location: v5Location, match } = props;

    const componentProps: Record<string, unknown> = {};

    if (includeNavigate) {
      componentProps.navigate = createV5CompatNavigate(v5History);
    }
    if (includeLocation) {
      componentProps.location = v5Location;
    }
    if (includeMatch) {
      componentProps.match = match;
    }
    if (includeParams) {
      if (paramsAsProps) {
        Object.assign(componentProps, match.params);
      } else {
        componentProps.params = match.params;
      }
    }

    const element = <Component {...componentProps} />;

    return wrapper
      ? React.createElement(wrapper, { children: element })
      : element;
  };
};

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
const Connections = mmLazy(
  // TODO: This is a named export. Fix incorrect type casting once `mmLazy` is updated to handle non-default export types.
  (() =>
    import(
      '../../components/multichain/pages/connections/index.js'
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

const MemoizedReviewPermissionsWrapper = React.memo(
  (props: {
    params?: { origin: string };
    navigate?: (
      to: string | number,
      options?: { replace?: boolean; state?: Record<string, unknown> },
    ) => void;
  }) => (
    <State2Wrapper
      {...props}
      state1Component={ReviewPermissions as React.ComponentType<unknown>}
      state2Component={
        MultichainReviewPermissions as React.ComponentType<unknown>
      }
    />
  ),
);

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
          <RouteWithLayout
            path={ONBOARDING_ROUTE}
            component={OnboardingFlow}
            layout={LegacyLayout}
          />
          <RouteWithLayout
            path={LOCK_ROUTE}
            component={Lock}
            exact
            layout={LegacyLayout}
          />
          <RouteWithLayout
            path={UNLOCK_ROUTE}
            layout={LegacyLayout}
            // v5 Route supports exact with render props, but TS types don't recognize it
            // Using spread operator with type assertion to bypass incorrect type definitions
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            {...({ exact: true } as any)}
          >
            {createV5CompatRoute(UnlockPage, {
              wrapper: InitializedV5Compat,
              includeNavigate: true,
              includeLocation: true,
            })}
          </RouteWithLayout>
          <RouteWithLayout path={DEEP_LINK_ROUTE} layout={LegacyLayout}>
            {createV5CompatRoute(DeepLink, {
              includeLocation: true,
            })}
          </RouteWithLayout>
          <RestoreVaultComponent
            path={RESTORE_VAULT_ROUTE}
            component={RestoreVaultPage}
            exact
          />
          <RouteWithLayout
            authenticated
            path={SMART_ACCOUNT_UPDATE}
            component={SmartAccountUpdate}
            layout={LegacyLayout}
          />
          <RouteWithLayout
            path={`${REVEAL_SEED_ROUTE}/:keyringId?`}
            layout={RootLayout}
          >
            {createV5CompatRoute<{ keyringId?: string }>(
              RevealSeedConfirmation,
              {
                wrapper: AuthenticatedV5Compat,
                includeNavigate: true,
                includeParams: true,
              },
            )}
          </RouteWithLayout>
          <RouteWithLayout
            authenticated
            path={IMPORT_SRP_ROUTE}
            component={ImportSrpPage}
            layout={RootLayout}
          />
          <RouteWithLayout
            authenticated
            path={SETTINGS_ROUTE}
            component={Settings}
            layout={RootLayout}
          />
          <RouteWithLayout
            authenticated
            path={NOTIFICATIONS_SETTINGS_ROUTE}
            component={NotificationsSettings}
            layout={RootLayout}
          />
          <RouteWithLayout
            authenticated
            path={`${NOTIFICATIONS_ROUTE}/:uuid`}
            layout={RootLayout}
            exact
          >
            {createV5CompatRoute<{ uuid: string }>(NotificationDetails, {
              wrapper: AuthenticatedV5Compat,
              includeParams: true,
              includeNavigate: true,
              paramsAsProps: false,
            })}
          </RouteWithLayout>
          <RouteWithLayout
            authenticated
            path={NOTIFICATIONS_ROUTE}
            component={Notifications}
            layout={RootLayout}
          />
          <RouteWithLayout path={SNAPS_ROUTE} exact layout={RootLayout}>
            {createV5CompatRoute(SnapList, {
              wrapper: AuthenticatedV5Compat,
              includeNavigate: true,
              includeLocation: true,
            })}
          </RouteWithLayout>
          <RouteWithLayout path={SNAPS_VIEW_ROUTE} layout={RootLayout}>
            {createV5CompatRoute(SnapView, {
              wrapper: AuthenticatedV5Compat,
              includeNavigate: true,
              includeLocation: true,
              includeParams: true,
              paramsAsProps: false,
            })}
          </RouteWithLayout>
          <RouteWithLayout path={`${SEND_ROUTE}/:page?`} layout={RootLayout}>
            {createV5CompatRoute<{ page?: string }>(SendPage, {
              wrapper: AuthenticatedV5Compat,
              includeParams: true,
              includeNavigate: true,
              includeLocation: true,
              paramsAsProps: false,
            })}
          </RouteWithLayout>
          <RouteWithLayout
            path={`${CONFIRM_TRANSACTION_ROUTE}/:id?`}
            layout={RootLayout}
          >
            {createV5CompatRoute<{ id?: string }>(ConfirmTransaction, {
              wrapper: AuthenticatedV5Compat,
              includeLocation: true,
              includeParams: true,
              paramsAsProps: false,
            })}
          </RouteWithLayout>
          <RouteWithLayout path={SWAPS_ROUTE} layout={LegacyLayout}>
            {createV5CompatRoute(Swaps, {
              wrapper: AuthenticatedV5Compat,
              includeLocation: true,
            })}
          </RouteWithLayout>
          <RouteWithLayout
            path={`${CROSS_CHAIN_SWAP_TX_DETAILS_ROUTE}/:srcTxMetaId`}
            layout={RootLayout}
            // v5 Route supports exact with render props, but TS types don't recognize it
            // Using spread operator with type assertion to bypass incorrect type definitions
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            {...({ exact: true } as any)}
          >
            {createV5CompatRoute<{ srcTxMetaId: string }>(
              CrossChainSwapTxDetails,
              {
                wrapper: AuthenticatedV5Compat,
                includeNavigate: true,
                includeLocation: true,
                includeParams: true,
                paramsAsProps: false, // Pass as params object
              },
            )}
          </RouteWithLayout>
          <RouteWithLayout path={CROSS_CHAIN_SWAP_ROUTE} layout={RootLayout}>
            {createV5CompatRoute(CrossChainSwap, {
              wrapper: AuthenticatedV5Compat,
              includeLocation: true,
            })}
          </RouteWithLayout>
          <RouteWithLayout
            path={CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE}
            layout={RootLayout}
          >
            {createV5CompatRoute(ConfirmAddSuggestedTokenPage, {
              wrapper: AuthenticatedV5Compat,
              includeNavigate: true,
              includeLocation: true,
            })}
          </RouteWithLayout>
          <RouteWithLayout
            path={CONFIRM_ADD_SUGGESTED_NFT_ROUTE}
            layout={RootLayout}
          >
            {createV5CompatRoute(ConfirmAddSuggestedNftPage, {
              wrapper: AuthenticatedV5Compat,
              includeNavigate: true,
              includeLocation: true,
            })}
          </RouteWithLayout>
          <RouteWithLayout
            path={`${CONFIRMATION_V_NEXT_ROUTE}/:id?`}
            layout={RootLayout}
          >
            {createV5CompatRoute<{ id?: string }>(ConfirmationPage, {
              wrapper: AuthenticatedV5Compat,
              includeParams: true,
              paramsAsProps: false,
            })}
          </RouteWithLayout>
          <RouteWithLayout
            authenticated
            path={NEW_ACCOUNT_ROUTE}
            component={CreateAccountPage}
            layout={RootLayout}
          />
          <RouteWithLayout path={`${CONNECT_ROUTE}/:id`} layout={RootLayout}>
            {createV5CompatRoute<{ id: string }>(PermissionsConnect, {
              wrapper: AuthenticatedV5Compat,
              includeNavigate: true,
              includeLocation: true,
              includeMatch: true,
            })}
          </RouteWithLayout>
          <RouteWithLayout
            path={`${ASSET_ROUTE}/image/:asset/:id`}
            layout={RootLayout}
          >
            {createV5CompatRoute<{ asset: string; id: string }>(NftFullImage, {
              wrapper: AuthenticatedV5Compat,
              includeParams: true,
              paramsAsProps: false,
            })}
          </RouteWithLayout>
          <RouteWithLayout
            path={`${ASSET_ROUTE}/:chainId/:asset/:id`}
            layout={RootLayout}
          >
            {createV5CompatRoute<{
              chainId: string;
              asset: string;
              id: string;
            }>(Asset, {
              wrapper: AuthenticatedV5Compat,
              includeParams: true,
              paramsAsProps: false,
            })}
          </RouteWithLayout>
          <RouteWithLayout
            path={`${ASSET_ROUTE}/:chainId/:asset/`}
            layout={RootLayout}
          >
            {createV5CompatRoute<{
              chainId: string;
              asset: string;
            }>(Asset, {
              wrapper: AuthenticatedV5Compat,
              includeParams: true,
              paramsAsProps: false,
            })}
          </RouteWithLayout>
          <RouteWithLayout path={`${ASSET_ROUTE}/:chainId`} layout={RootLayout}>
            {createV5CompatRoute<{ chainId: string }>(Asset, {
              wrapper: AuthenticatedV5Compat,
              includeParams: true,
              paramsAsProps: false,
            })}
          </RouteWithLayout>
          <RouteWithLayout
            path={`${DEFI_ROUTE}/:chainId/:protocolId`}
            layout={RootLayout}
          >
            {createV5CompatRoute<{
              chainId: string;
              protocolId: string;
            }>(DeFiPage, {
              wrapper: AuthenticatedV5Compat,
              includeNavigate: true,
              includeParams: true,
              paramsAsProps: false,
            })}
          </RouteWithLayout>
          <RouteWithLayout
            authenticated
            path={`${CONNECTIONS}/:origin`}
            layout={LegacyLayout}
            exact
          >
            {createV5CompatRoute<{ origin: string }>(Connections, {
              wrapper: AuthenticatedV5Compat,
              includeParams: true,
              includeNavigate: true,
              paramsAsProps: false,
            })}
          </RouteWithLayout>
          <RouteWithLayout
            authenticated
            path={PERMISSIONS}
            component={PermissionsPage}
            exact
            layout={RootLayout}
          />
          <RouteWithLayout
            authenticated
            path={GATOR_PERMISSIONS}
            component={GatorPermissionsPage}
            exact
            layout={LegacyLayout}
          />
          <RouteWithLayout
            path={TOKEN_TRANSFER_ROUTE}
            exact
            layout={LegacyLayout}
          >
            {createV5CompatRoute(TokenTransferPage, {
              wrapper: AuthenticatedV5Compat,
              includeNavigate: true,
              paramsAsProps: false,
            })}
          </RouteWithLayout>
          <RouteWithLayout
            path={`${TOKEN_TRANSFER_ROUTE}/:origin`}
            exact
            layout={LegacyLayout}
          >
            {createV5CompatRoute<{ origin: string }>(TokenTransferPage, {
              wrapper: AuthenticatedV5Compat,
              includeParams: true,
              includeNavigate: true,
              paramsAsProps: false,
            })}
          </RouteWithLayout>
          <RouteWithLayout
            path={`${REVIEW_GATOR_PERMISSIONS_ROUTE}/:chainId/:permissionGroupName`}
            exact
            layout={LegacyLayout}
          >
            {createV5CompatRoute<{
              chainId: string;
              permissionGroupName: string;
            }>(ReviewGatorPermissionsPage, {
              wrapper: AuthenticatedV5Compat,
              includeParams: true,
              includeNavigate: true,
              paramsAsProps: false,
            })}
          </RouteWithLayout>
          <RouteWithLayout
            path={`${REVIEW_GATOR_PERMISSIONS_ROUTE}/:chainId/:permissionGroupName/:origin`}
            exact
            layout={LegacyLayout}
          >
            {createV5CompatRoute<{
              chainId: string;
              permissionGroupName: string;
              origin: string;
            }>(ReviewGatorPermissionsPage, {
              wrapper: AuthenticatedV5Compat,
              includeParams: true,
              includeNavigate: true,
              paramsAsProps: false,
            })}
          </RouteWithLayout>
          <RouteWithLayout
            path={`${REVIEW_PERMISSIONS}/:origin`}
            exact
            layout={RootLayout}
          >
            {createV5CompatRoute<{ origin: string }>(
              MemoizedReviewPermissionsWrapper,
              {
                wrapper: AuthenticatedV5Compat,
                includeParams: true,
                includeNavigate: true,
                paramsAsProps: false,
              },
            )}
          </RouteWithLayout>
          <RouteWithLayout
            path={ACCOUNT_LIST_PAGE_ROUTE}
            exact
            layout={RootLayout}
          >
            {createV5CompatRoute(AccountList, {
              wrapper: AuthenticatedV5Compat,
            })}
          </RouteWithLayout>
          <RouteWithLayout
            path={`${MULTICHAIN_ACCOUNT_ADDRESS_LIST_PAGE_ROUTE}/:accountGroupId`}
            exact
            layout={RootLayout}
          >
            {createV5CompatRoute<{ accountGroupId: string }>(
              MultichainAccountAddressListPage,
              {
                wrapper: AuthenticatedV5Compat,
                includeLocation: true,
                includeParams: true,
                paramsAsProps: false,
              },
            )}
          </RouteWithLayout>
          <RouteWithLayout
            path={`${MULTICHAIN_ACCOUNT_PRIVATE_KEY_LIST_PAGE_ROUTE}/:accountGroupId`}
            exact
            layout={RootLayout}
          >
            {createV5CompatRoute<{ accountGroupId: string }>(
              MultichainAccountPrivateKeyListPage,
              {
                wrapper: AuthenticatedV5Compat,
                includeParams: true,
                paramsAsProps: false,
              },
            )}
          </RouteWithLayout>
          <RouteWithLayout
            path={ADD_WALLET_PAGE_ROUTE}
            exact
            layout={RootLayout}
          >
            {createV5CompatRoute(AddWalletPage, {
              wrapper: AuthenticatedV5Compat,
            })}
          </RouteWithLayout>
          <RouteWithLayout
            path={`${MULTICHAIN_ACCOUNT_DETAILS_PAGE_ROUTE}/:id`}
            exact
            layout={RootLayout}
          >
            {createV5CompatRoute<{ id: string }>(MultichainAccountDetailsPage, {
              wrapper: AuthenticatedV5Compat,
              includeParams: true,
              paramsAsProps: true,
            })}
          </RouteWithLayout>
          <RouteWithLayout
            path={`${MULTICHAIN_SMART_ACCOUNT_PAGE_ROUTE}/:address`}
            exact
            layout={RootLayout}
          >
            {createV5CompatRoute<{ address: string }>(SmartAccountPage, {
              wrapper: AuthenticatedV5Compat,
              includeParams: true,
              paramsAsProps: false,
            })}
          </RouteWithLayout>
          <RouteWithLayout
            path={`${MULTICHAIN_WALLET_DETAILS_PAGE_ROUTE}/:id`}
            exact
            layout={RootLayout}
          >
            {createV5CompatRoute<{ id: string }>(WalletDetailsPage, {
              wrapper: AuthenticatedV5Compat,
              includeParams: true,
              paramsAsProps: false,
            })}
          </RouteWithLayout>
          <RouteWithLayout
            authenticated
            path={NONEVM_BALANCE_CHECK_ROUTE}
            component={NonEvmBalanceCheck}
            layout={LegacyLayout}
          />
          <RouteWithLayout
            authenticated
            path={SHIELD_PLAN_ROUTE}
            component={ShieldPlan}
            layout={LegacyLayout}
          />
          <RouteWithLayout path={REWARDS_ROUTE} layout={RootLayout}>
            {createV5CompatRoute(RewardsPage, {
              wrapper: AuthenticatedV5Compat,
              includeNavigate: true,
              includeLocation: true,
            })}
          </RouteWithLayout>
          <RouteWithLayout path={DEFAULT_ROUTE} layout={RootLayout}>
            {createV5CompatRoute(Home, {
              wrapper: AuthenticatedV5Compat,
              includeNavigate: true,
              includeLocation: true,
            })}
          </RouteWithLayout>
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

      {isUnlocked ? (
        <Alerts navigate={createV5CompatNavigate(history)} />
      ) : null}
      {React.createElement(
        ToastMaster as React.ComponentType<{
          location: RouteComponentProps['location'];
        }>,
        { location },
      )}

      <Modals />
    </div>
  );
}
