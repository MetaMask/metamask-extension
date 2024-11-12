import {
  type CurrencyRateState,
  type NftControllerState,
  type TokenListState,
  type TokenRatesControllerState,
  type TokensControllerState,
  type RatesControllerState,
  type AccountTrackerControllerState,
  getDefaultNftControllerState,
  getDefaultTokenRatesControllerState,
} from '@metamask/assets-controllers';
import {
  getDefaultKeyringState,
  type KeyringControllerState,
} from '@metamask/keyring-controller';
import {
  getDefaultAddressBookControllerState,
  type AddressBookControllerState,
} from '@metamask/address-book-controller';
import type { ApprovalControllerState } from '@metamask/approval-controller';
import type { EnsControllerState } from '@metamask/ens-controller';
import type { PhishingControllerState } from '@metamask/phishing-controller';
import { getDefaultPreferencesState } from '@metamask/preferences-controller';
import type { AnnouncementControllerState } from '@metamask/announcement-controller';
import {
  getDefaultNetworkControllerState,
  type NetworkState,
} from '@metamask/network-controller';
import type { GasFeeState } from '@metamask/gas-fee-controller';
import type {
  PermissionConstraint,
  PermissionControllerState,
  SubjectMetadataControllerState,
} from '@metamask/permission-controller';
import type { SmartTransactionsControllerState } from '@metamask/smart-transactions-controller';
import { getDefaultSmartTransactionsControllerState } from '@metamask/smart-transactions-controller/dist/SmartTransactionsController';
import type { SelectedNetworkControllerState } from '@metamask/selected-network-controller';
import type { LoggingControllerState } from '@metamask/logging-controller';
import type { PermissionLogControllerState } from '@metamask/permission-log-controller';
import type { NotificationControllerState } from '@metamask/notification-controller';
import type {
  CronjobControllerState,
  SnapControllerState,
  SnapInterfaceControllerState,
  SnapInsightsControllerState,
  SnapsRegistry,
} from '@metamask/snaps-controllers';
import type { AccountsControllerState } from '@metamask/accounts-controller';

///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
import type { MmiConfigurationController } from '@metamask-institutional/custody-keyring';
import type { InstitutionalFeaturesController } from '@metamask-institutional/institutional-features';
import type { CustodyController } from '@metamask-institutional/custody-controller';
///: END:ONLY_INCLUDE_IF
import type { SignatureControllerState } from '@metamask/signature-controller';
import type { PPOMState } from '@metamask/ppom-validator';

import type { NameControllerState } from '@metamask/name-controller';

import type { QueuedRequestControllerState } from '@metamask/queued-request-controller';

import type { UserOperationControllerState } from '@metamask/user-operation-controller';

import type { TransactionControllerState } from '@metamask/transaction-controller';
import type {
  AuthenticationController,
  UserStorageController,
} from '@metamask/profile-sync-controller';
import type {
  NotificationServicesController,
  NotificationServicesPushController,
} from '@metamask/notification-services-controller';

import type { BalancesController as MultichainBalancesControllerState } from './lib/accounts/BalancesController';
import type { NetworkOrderControllerState } from './controllers/network-order';
import type { AccountOrderControllerState } from './controllers/account-order';
import type { PreferencesControllerState } from './controllers/preferences-controller';
import type { AppStateController } from './controllers/app-state-controller';
import type { AlertController } from './controllers/alert-controller';
import {
  getDefaultOnboardingControllerState,
  type OnboardingControllerState,
} from './controllers/onboarding';
import MetaMetricsController from './controllers/metametrics';
import type { EncryptionPublicKeyControllerState } from './controllers/encryption-public-key';
import AppMetadataController from './controllers/app-metadata';
import {
  getDefaultState as getDefaultDecryptMessageControllerState,
  type DecryptMessageControllerState,
} from './controllers/decrypt-message';
import type { SwapsControllerState } from './controllers/swaps/swaps.types';
import type { BridgeControllerState } from './controllers/bridge/types';
import { MetaMetricsDataDeletionState } from './controllers/metametrics-data-deletion/metametrics-data-deletion';
import { SENTRY_BACKGROUND_STATE } from './constants/sentry-state';
import { getDefaultSwapsControllerState } from './controllers/swaps/swaps.constants';
import { getDefaultAlertControllerState } from './controllers/alert-controller';
import { getDefaultAccountTrackerControllerState } from './controllers/account-tracker-controller';

export type ResetOnRestartStoresComposedState = {
  AccountTracker: AccountTrackerControllerState;
  TokenRatesController: TokenRatesControllerState;
  DecryptMessageController: DecryptMessageControllerState;
  EncryptionPublicKeyController: EncryptionPublicKeyControllerState;
  SignatureController: SignatureControllerState;
  SwapsController: SwapsControllerState;
  BridgeController: BridgeControllerState;
  EnsController: EnsControllerState;
  ApprovalController: ApprovalControllerState;
  PPOMController: PPOMState;
};

export type StoreControllersComposedState =
  ResetOnRestartStoresComposedState & {
    AccountsController: AccountsControllerState;
    AppStateController: AppStateController['store'];
    AppMetadataController: AppMetadataController['store'];
    MultichainBalancesController: MultichainBalancesControllerState;
    TransactionController: TransactionControllerState;
    KeyringController: KeyringControllerState;
    PreferencesController: PreferencesControllerState;
    MetaMetricsController: MetaMetricsController['store'];
    MetaMetricsDataDeletionController: MetaMetricsDataDeletionState;
    AddressBookController: AddressBookControllerState;
    CurrencyController: CurrencyRateState;
    NetworkController: NetworkState;
    AlertController: AlertController['store'];
    OnboardingController: OnboardingControllerState;
    PermissionController: PermissionControllerState<PermissionConstraint>;
    PermissionLogController: PermissionLogControllerState;
    SubjectMetadataController: SubjectMetadataControllerState;
    AnnouncementController: AnnouncementControllerState;
    NetworkOrderController: NetworkOrderControllerState;
    AccountOrderController: AccountOrderControllerState;
    GasFeeController: GasFeeState;
    TokenListController: TokenListState;
    TokensController: TokensControllerState;
    SmartTransactionsController: SmartTransactionsControllerState;
    NftController: NftControllerState;
    PhishingController: PhishingControllerState;
    SelectedNetworkController: SelectedNetworkControllerState;
    LoggingController: LoggingControllerState;
    MultichainRatesController: RatesControllerState;
    SnapController: SnapControllerState;
    CronjobController: CronjobControllerState;
    SnapsRegistry: SnapsRegistry;
    NotificationController: NotificationControllerState;
    SnapInterfaceController: SnapInterfaceControllerState;
    SnapInsightsController: SnapInsightsControllerState;
    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    CustodyController: CustodyController['store'];
    InstitutionalFeaturesController: InstitutionalFeaturesController['store'];
    MmiConfigurationController: MmiConfigurationController['store'];
    ///: END:ONLY_INCLUDE_IF
    PPOMController: PPOMState;
    NameController: NameControllerState;
    UserOperationController: UserOperationControllerState;
    // Notification Controllers
    AuthenticationController: AuthenticationController.AuthenticationControllerState;
    UserStorageController: UserStorageController.UserStorageControllerState;
    NotificationServicesController: NotificationServicesController.NotificationServicesControllerState;
    NotificationServicesPushController: NotificationServicesPushController.NotificationServicesPushControllerState;
  };

export type MemStoreControllersComposedState = Omit<
  StoreControllersComposedState,
  'PhishingController' | 'PPOMController' | 'TransactionController'
> & {
  TxController: TransactionControllerState;
  QueuedRequestController: QueuedRequestControllerState;
};

type defaultComposedStateProperties = typeof SENTRY_BACKGROUND_STATE;

export const defaultComposedState: MemStoreControllersComposedState = {
  AccountsController: {
    internalAccounts: {
      accounts: {},
      selectedAccount: '',
    },
  },
  AccountTracker: getDefaultAccountTrackerControllerState(),
  AddressBookController: getDefaultAddressBookControllerState(),
  AlertController: getDefaultAlertControllerState(),
  AnnouncementController: {
    announcements: false,
  },
  AuthenticationController: {
    isSignedIn: false,
  },
  NetworkOrderController: {
    orderedNetworkList: [],
  },
  AccountOrderController: {
    pinnedAccountList: [],
    hiddenAccountList: [],
  },
  AppMetadataController: {
    currentAppVersion: true,
    currentMigrationVersion: true,
    previousAppVersion: true,
    previousMigrationVersion: true,
  },
  ApprovalController: {
    approvalFlows: false,
    pendingApprovals: false,
    pendingApprovalCount: false,
  },
  AppStateController: {
    browserEnvironment: true,
    connectedStatusPopoverHasBeenShown: true,
    currentPopupId: false,
    onboardingDate: false,
    currentExtensionPopupId: false,
    defaultHomeActiveTabName: true,
    fullScreenGasPollTokens: true,
    hadAdvancedGasFeesSetPriorToMigration92_3: true,
    nftsDetectionNoticeDismissed: true,
    nftsDropdownState: true,
    notificationGasPollTokens: true,
    outdatedBrowserWarningLastShown: true,
    popupGasPollTokens: true,
    qrHardware: true,
    recoveryPhraseReminderHasBeenShown: true,
    recoveryPhraseReminderLastShown: true,
    showBetaHeader: true,
    showPermissionsTour: true,
    showNetworkBanner: true,
    showAccountBanner: true,
    switchedNetworkDetails: false,
    switchedNetworkNeverShowMessage: false,
    showTestnetMessageInDropdown: true,
    surveyLinkLastClickedOrClosed: true,
    snapsInstallPrivacyWarningShown: true,
    termsOfUseLastAgreed: true,
    timeoutMinutes: true,
    trezorModel: true,
    usedNetworks: true,
  },
  MultichainBalancesController: {
    balances: false,
  },
  BridgeController: {
    bridgeState: {
      bridgeFeatureFlags: {
        extensionConfig: false,
        extensionSupport: false,
        destNetworkAllowlist: [],
        srcNetworkAllowlist: [],
      },
      destTokens: {},
      destTopAssets: [],
      srcTokens: {},
      srcTopAssets: [],
      quoteRequest: {
        walletAddress: false,
        srcTokenAddress: true,
        slippage: true,
        srcChainId: true,
        destChainId: true,
        destTokenAddress: true,
        srcTokenAmount: true,
      },
      quotes: [],
      quotesLastFetched: true,
      quotesLoadingStatus: true,
    },
  },
  CronjobController: {
    jobs: false,
  },
  CurrencyController: {
    currentCurrency: true,
    currencyRates: true,
  },
  DecryptMessageController: getDefaultDecryptMessageControllerState(),
  EncryptionPublicKeyController: {
    unapprovedEncryptionPublicKeyMsgs: false,
    unapprovedEncryptionPublicKeyMsgCount: true,
  },
  EnsController: {
    ensResolutionsByAddress: false,
    ensEntries: false,
  },
  GasFeeController: {
    estimatedGasFeeTimeBounds: true,
    gasEstimateType: true,
    gasFeeEstimates: true,
    gasFeeEstimatesByChainId: true,
    nonRPCGasFeeApisDisabled: false,
  },
  KeyringController: getDefaultKeyringState(),
  LoggingController: {
    logs: false,
  },
  NotificationServicesController: {
    subscriptionAccountsSeen: false,
    isMetamaskNotificationsFeatureSeen: false,
    isNotificationServicesEnabled: false,
    isFeatureAnnouncementsEnabled: false,
    metamaskNotificationsList: false,
    metamaskNotificationsReadList: false,
    isCheckingAccountsPresence: false,
    isFetchingMetamaskNotifications: false,
    isUpdatingMetamaskNotifications: false,
    isUpdatingMetamaskNotificationsAccount: false,
  },
  MetaMetricsController: {
    eventsBeforeMetricsOptIn: false,
    fragments: false,
    metaMetricsId: true,
    participateInMetaMetrics: true,
    previousUserTraits: false,
    segmentApiCalls: false,
    traits: false,
    dataCollectionForMarketing: false,
    marketingCampaignCookieId: true,
    latestNonAnonymousEventTimestamp: true,
  },
  MetaMetricsDataDeletionController: {
    metaMetricsDataDeletionId: true,
    metaMetricsDataDeletionTimestamp: true,
  },
  NameController: {
    names: false,
    nameSources: false,
    useExternalNameSources: false,
  },
  NetworkController: getDefaultNetworkControllerState(),
  NftController: getDefaultNftControllerState(),
  NotificationController: {
    notifications: false,
  },
  OnboardingController: getDefaultOnboardingControllerState(),
  PPOMController: {
    securityAlertsEnabled: false,
    storageMetadata: [],
    versionInfo: [],
  },
  PermissionController: {
    subjects: false,
  },
  PermissionLogController: {
    permissionActivityLog: false,
    permissionHistory: false,
  },
  PhishingController: {},
  PreferencesController: getDefaultPreferencesState(),
  NotificationServicesPushController: {
    fcmToken: false,
  },
  MultichainRatesController: {
    fiatCurrency: true,
    rates: true,
    cryptocurrencies: true,
  },
  QueuedRequestController: {
    queuedRequestCount: true,
  },
  SelectedNetworkController: { domains: false },
  SignatureController: {
    unapprovedPersonalMsgCount: true,
    unapprovedPersonalMsgs: false,
    unapprovedTypedMessages: false,
    unapprovedTypedMessagesCount: true,
  },
  SmartTransactionsController: getDefaultSmartTransactionsControllerState(),
  SnapController: {
    snaps: false,
  },
  SnapInterfaceController: {
    interfaces: false,
  },
  SnapInsightsController: {
    insights: false,
  },
  SnapsRegistry: {
    database: false,
    lastUpdated: false,
    databaseUnavailable: false,
  },
  SubjectMetadataController: {
    subjectMetadata: false,
  },
  SwapsController: getDefaultSwapsControllerState(),
  TokenDetectionController: {},
  TokenListController: {
    preventPollingOnNetworkRestart: true,
    tokenList: false,
    tokensChainsCache: {},
  },
  TokenRatesController: getDefaultTokenRatesControllerState(),
  TokensController: {
    allDetectedTokens: {},
    allIgnoredTokens: {},
    allTokens: {},
    detectedTokens: false,
    ignoredTokens: false,
    tokens: false,
  },
  TransactionController: {
    transactions: false,
    lastFetchedBlockNumbers: false,
    methodData: false,
  },
  TxController: {
    transactions: false,
  },
  UserOperationController: {
    userOperations: false,
  },
  UserStorageController: {
    isProfileSyncingEnabled: true,
    isProfileSyncingUpdateLoading: false,
  },
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  MMIController: {
    opts: true,
  },
  CustodyController: {
    store: true,
  },
  MmiConfigurationController: {
    store: true,
    configurationClient: true,
  },
  ///: END:ONLY_INCLUDE_IF
};
