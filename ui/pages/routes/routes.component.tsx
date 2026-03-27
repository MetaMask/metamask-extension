/* eslint-disable jsdoc/check-tag-names */
/* eslint-disable import-x/no-useless-path-segments */
/* eslint-disable import-x/extensions */
import classnames from 'clsx';
import React, { Suspense, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import {
  useLocation,
  useNavigationType,
  Navigate,
  Outlet,
} from 'react-router-dom';
import IdleTimer from 'react-idle-timer';
import type { ApprovalType } from '@metamask/controller-utils';
import { TransactionMeta } from '@metamask/transaction-controller';

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
  BASIC_FUNCTIONALITY_OFF_ROUTE,
  DEFI_ROUTE,
  DEEP_LINK_ROUTE,
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
  PERPS_MARKET_LIST_ROUTE,
  DECRYPT_MESSAGE_REQUEST_PATH,
  ENCRYPTION_PUBLIC_KEY_REQUEST_PATH,
  PERPS_MARKET_DETAIL_ROUTE,
  PERPS_ORDER_ENTRY_ROUTE,
  PERPS_ACTIVITY_ROUTE,
  CONTACTS_ROUTE,
  SETTINGS_V2_ROUTE,
} from '../../helpers/constants/routes';
import { MUSD_CONVERSION_ROUTE } from '../musd/constants/routes';
import { getProviderConfig } from '../../../shared/lib/selectors/networks';
import {
  getNetworkIdentifier,
  getPreferences,
  getUnapprovedConfirmations,
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
  hideImportTokensModal,
  hideDeprecatedNetworkModal,
  automaticallySwitchNetwork,
  hideKeyringRemovalResultModal,
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
  SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES,
} from '../../../shared/constants/app';
// TODO: Remove restricted import
// eslint-disable-next-line import-x/no-restricted-paths
import { getEnvironmentType } from '../../../app/scripts/lib/util';
import QRHardwarePopover from '../../components/app/qr-hardware-popover';
import { ToggleIpfsModal } from '../../components/app/assets/nfts/nft-default-image/toggle-ipfs-modal';
import { BasicConfigurationModal } from '../../components/app/basic-configuration-modal';
import KeyringSnapRemovalResult from '../../components/app/modals/keyring-snap-removal-modal';

import { DeprecatedNetworkModal } from '../settings/deprecated-network-modal/DeprecatedNetworkModal';
import NetworkConfirmationPopover from '../../components/multichain/network-list-menu/network-confirmation-popover/network-confirmation-popover';
import { ToastMaster } from '../../components/app/toast-master/toast-master';
import CrossChainSwapTxDetails from '../bridge/transaction-details/transaction-details';
import {
  isCorrectDeveloperTransactionType,
  isCorrectSignatureApprovalType,
} from '../../../shared/lib/confirmation.utils';
import { type Confirmation } from '../confirmations/types/confirm';
import { MultichainAccountAddressListPage } from '../multichain-accounts/multichain-account-address-list-page';
import { MultichainAccountPrivateKeyListPage } from '../multichain-accounts/multichain-account-private-key-list-page';
import MultichainAccountIntroModalContainer from '../../components/app/modals/multichain-accounts/intro-modal';
import { useMultichainAccountsIntroModal } from '../../hooks/useMultichainAccountsIntroModal';
import { AccountList } from '../multichain-accounts/account-list';
import { AddWalletPage } from '../multichain-accounts/add-wallet-page';
import { WalletDetailsPage } from '../multichain-accounts/wallet-details-page';
import { MultichainReviewPermissions } from '../../components/multichain-accounts/permissions/permission-review-page/multichain-review-permissions-page';
import { LegacyLayout } from '../../layouts/legacy-layout';
import { RequireAuthenticated } from '../../layouts/require-authenticated';
import { RequireOnboarded } from '../../layouts/require-onboarded';
import { contactsRoutes } from '../contacts';
import RequireBasicFunctionality from '../../helpers/higher-order-components/require-basic-functionality/require-basic-functionality';
import { getCurrencyRateControllerCurrentCurrency } from '../../../shared/lib/selectors/assets-migration';
import { getConnectingLabel, setTheme } from './utils';
import { ConfirmationHandler } from './confirmation-handler';
import { Modals } from './modals';

// Begin Lazy Routes
// End Lazy Routes

export const routeConfig = [
  {
    element: <LegacyLayout />,
    children: [
      {
        path: `${ONBOARDING_ROUTE}/*`,
        lazy: () => import('../onboarding-flow/index.ts'),
      },
      {
        path: LOCK_ROUTE,
        lazy: () => import('../lock/index.ts'),
      },
      {
        element: <RequireOnboarded />,
        children: [
          {
            path: UNLOCK_ROUTE,
            lazy: () => import('../unlock-page/index.ts'),
          },
        ],
      },
      {
        path: DEEP_LINK_ROUTE,
        lazy: () => import('../deep-link/deep-link.tsx'),
      },
      {
        path: BASIC_FUNCTIONALITY_OFF_ROUTE,
        lazy: () =>
          import(
            '../basic-functionality-required/basic-functionality-required.tsx'
          ),
      },
      {
        path: RESTORE_VAULT_ROUTE,
        lazy: () => import('../keychains/restore-vault.tsx'),
      },
    ],
  },
  {
    element: <RequireAuthenticated />,
    children: [
      {
        path: `${REVEAL_SEED_ROUTE}/:keyringId?`,
        lazy: () => import('../keychains/reveal-seed.tsx'),
      },
      {
        path: IMPORT_SRP_ROUTE,
        lazy: () => import('../multi-srp/import-srp/index.ts'),
      },
      {
        path: `${SETTINGS_ROUTE}/*`,
        lazy: () => import('../settings/index.js'),
      },
      {
        path: `${SETTINGS_V2_ROUTE}/*`,
        lazy: () => import('../settings-v2/index.ts'),
      },
      {
        path: `${SEND_ROUTE}/:page?`,
        lazy: () => import('../confirmations/send/index.ts'),
      },
      {
        path: `${CONFIRM_TRANSACTION_ROUTE}/:id?${DECRYPT_MESSAGE_REQUEST_PATH}`,
        lazy: () => import('../confirm-decrypt-message/index.js'),
      },
      {
        path: `${CONFIRM_TRANSACTION_ROUTE}/:id?${ENCRYPTION_PUBLIC_KEY_REQUEST_PATH}`,
        lazy: () => import('../confirm-encryption-public-key/index.js'),
      },
      {
        path: `${CONFIRM_TRANSACTION_ROUTE}/:id?/*`,
        lazy: () => import('../confirmations/confirm/confirm.tsx'),
      },
      {
        path: CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE,
        lazy: () => import('../confirm-add-suggested-token/index.js'),
      },
      {
        path: CONFIRM_ADD_SUGGESTED_NFT_ROUTE,
        lazy: () => import('../confirm-add-suggested-nft/index.js'),
      },
      {
        path: `${CONFIRMATION_V_NEXT_ROUTE}/:id?`,
        lazy: () => import('../confirmations/confirmation/index.js'),
      },
      {
        path: `${NEW_ACCOUNT_ROUTE}/*`,
        lazy: () => import('../create-account/create-account.component.js'),
      },
      {
        path: `${CONNECT_ROUTE}/:id/*`,
        lazy: () => import('../permissions-connect/index.js'),
      },
      {
        path: `${ASSET_ROUTE}/image/:asset/:id`,
        lazy: () =>
          import(
            '../../components/app/assets/nfts/nft-details/nft-full-image.tsx'
          ),
      },
      {
        path: `${ASSET_ROUTE}/:chainId/:asset?/:id?`,
        lazy: () => import('../asset/index.js'),
      },
      {
        path: PERMISSIONS,
        lazy: () =>
          import(
            '../../components/multichain/pages/permissions-page/permissions-page.js'
          ),
      },
      {
        path: GATOR_PERMISSIONS,
        lazy: () =>
          import(
            '../../components/multichain/pages/gator-permissions/gator-permissions-page.tsx'
          ),
      },
      {
        path: `${TOKEN_TRANSFER_ROUTE}/:origin?`,
        lazy: () =>
          import(
            '../../components/multichain/pages/gator-permissions/token-transfer/token-transfer-page.tsx'
          ),
      },
      {
        path: `${REVIEW_GATOR_PERMISSIONS_ROUTE}/:chainId/:permissionGroupName/:origin?`,
        lazy: () =>
          import(
            '../../components/multichain/pages/gator-permissions/review-permissions/review-gator-permissions-page.tsx'
          ),
      },
      {
        path: REVIEW_PERMISSIONS,
        element: <MultichainReviewPermissions />,
      },
      {
        path: ACCOUNT_LIST_PAGE_ROUTE,
        element: <AccountList />,
      },
      {
        path: MULTICHAIN_ACCOUNT_ADDRESS_LIST_PAGE_ROUTE,
        element: <MultichainAccountAddressListPage />,
      },
      {
        path: MULTICHAIN_ACCOUNT_PRIVATE_KEY_LIST_PAGE_ROUTE,
        element: <MultichainAccountPrivateKeyListPage />,
      },
      {
        path: ADD_WALLET_PAGE_ROUTE,
        element: <AddWalletPage />,
      },
      {
        path: MULTICHAIN_ACCOUNT_DETAILS_PAGE_ROUTE,
        lazy: () =>
          import(
            '../multichain-accounts/multichain-account-details-page/index.ts'
          ),
      },
      {
        path: `${MULTICHAIN_SMART_ACCOUNT_PAGE_ROUTE}/:address`,
        lazy: () =>
          import('../multichain-accounts/smart-account-page/index.ts'),
      },
      {
        path: MULTICHAIN_WALLET_DETAILS_PAGE_ROUTE,
        element: <WalletDetailsPage />,
      },
      {
        path: CONTACTS_ROUTE,
        children: contactsRoutes,
      },
      {
        path: DEFAULT_ROUTE,
        lazy: () => import('../home/index.js'),
      },
      {
        element: <RequireBasicFunctionality />,
        children: [
          {
            path: '/notifications/settings',
            element: <Navigate to={NOTIFICATIONS_SETTINGS_ROUTE} replace />,
          },
          {
            path: `${NOTIFICATIONS_ROUTE}/:uuid`,
            lazy: () => import('../notification-details/index.js'),
          },
          {
            path: NOTIFICATIONS_ROUTE,
            lazy: () => import('../notifications/index.js'),
          },
          {
            path: SNAPS_ROUTE,
            lazy: () => import('../snaps/snaps-list/index.js'),
          },
          {
            path: SNAPS_VIEW_ROUTE,
            lazy: () => import('../snaps/snap-view/index.js'),
          },
          {
            path: `${CROSS_CHAIN_SWAP_TX_DETAILS_ROUTE}/:txHash`,
            element: <CrossChainSwapTxDetails />,
          },
          {
            path: `${CROSS_CHAIN_SWAP_ROUTE}/*`,
            lazy: () => import('../bridge/index.tsx'),
          },
          {
            path: `${DEFI_ROUTE}/:chainId/:protocolId`,
            lazy: () => import('../defi/index.ts'),
          },
          {
            path: `${MUSD_CONVERSION_ROUTE}/*`,
            lazy: () => import('../musd/index.tsx'),
          },
          {
            path: NONEVM_BALANCE_CHECK_ROUTE,
            lazy: () => import('../nonevm-balance-check/index.tsx'),
          },
          {
            path: SHIELD_PLAN_ROUTE,
            lazy: () => import('../shield-plan/index.ts'),
          },
          {
            path: REWARDS_ROUTE,
            element: <RewardsPage />,
          },
          {
            path: `${PERPS_MARKET_DETAIL_ROUTE}/:symbol`,
            lazy: async () => {
              const [Layout, Page] = await Promise.all([
                import('../perps/perps-layout.tsx'),
                import('../perps/perps-market-detail-page.tsx'),
              ]);
              const LayoutComponent = Layout.Component;
              const PageComponent = Page.Component;
              return {
                Component: () => (
                  <LayoutComponent>
                    <PageComponent />
                  </LayoutComponent>
                ),
              };
            },
          },
          {
            path: `${PERPS_ORDER_ENTRY_ROUTE}/:symbol`,
            lazy: async () => {
              const [Layout, Page] = await Promise.all([
                import('../perps/perps-layout.tsx'),
                import('../perps/perps-order-entry-page.tsx'),
              ]);
              const LayoutComponent = Layout.Component;
              const PageComponent = Page.Component;
              return {
                Component: () => (
                  <LayoutComponent>
                    <PageComponent />
                  </LayoutComponent>
                ),
              };
            },
          },
          {
            path: PERPS_ACTIVITY_ROUTE,
            lazy: async () => {
              const [Layout, Page] = await Promise.all([
                import('../perps/perps-layout.tsx'),
                import('../perps/perps-activity-page.tsx'),
              ]);
              const LayoutComponent = Layout.Component;
              const PageComponent = Page.Component;
              return {
                Component: () => (
                  <LayoutComponent>
                    <PageComponent />
                  </LayoutComponent>
                ),
              };
            },
          },
          {
            path: PERPS_MARKET_LIST_ROUTE,
            lazy: async () => {
              const [Layout, Page] = await Promise.all([
                import('../perps/perps-layout.tsx'),
                import('../perps/market-list/index.tsx'),
              ]);
              const LayoutComponent = Layout.Component;
              const PageComponent = Page.Component;
              return {
                Component: () => (
                  <LayoutComponent>
                    <PageComponent />
                  </LayoutComponent>
                ),
              };
            },
          },
        ],
      },
    ],
  },
];

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
  const { autoLockTimeLimit = DEFAULT_AUTO_LOCK_TIME_LIMIT } =
    useAppSelector(getPreferences);
  const completedOnboarding = useAppSelector(getCompletedOnboarding);

  const networkToAutomaticallySwitchTo = useAppSelector(
    getNetworkToAutomaticallySwitchTo,
  );
  const oldestPendingApproval = useAppSelector(
    oldestPendingConfirmationSelector,
  );
  const pendingApprovals = useAppSelector(getPendingApprovals);
  const transactionsMetadata = useAppSelector(
    getUnapprovedTransactions,
  ) as Record<string, TransactionMeta>;

  const textDirection = useAppSelector((state) => state.metamask.textDirection);
  const isUnlocked = useAppSelector(getIsUnlocked);
  const currentCurrency = useAppSelector(
    getCurrencyRateControllerCurrentCurrency,
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

  const isShowKeyringSnapRemovalResultModal = useAppSelector(
    (state) => state.appState.showKeyringRemovalSnapModal,
  );
  const pendingConfirmations = useAppSelector(getUnapprovedConfirmations);
  const hideShowKeyringSnapRemovalResultModal = () =>
    dispatch(hideKeyringRemovalResultModal());

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

  const renderRoutes = () => {
    const routes = (
      <Suspense fallback={null}>
        <Outlet />
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
    !pendingConfirmations.some(
      (confirmation: Confirmation) =>
        confirmation.type ===
        SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showSnapAccountRedirect,
    ) &&
    // In the redesigned screens, we hide the general loading spinner and the
    // loading states are on a component by component basis.
    !isCorrectApprovalType &&
    !isCorrectTransactionType &&
    // We don't want to show the loading screen on the deep link route, as it
    // is already a fullscreen interface.
    !isShowingDeepLinkRoute;

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
      {isShowKeyringSnapRemovalResultModal && (
        <KeyringSnapRemovalResult
          isOpen={isShowKeyringSnapRemovalResultModal}
          onClose={hideShowKeyringSnapRemovalResultModal}
        />
      )}

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
