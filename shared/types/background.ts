/* eslint-disable import/no-restricted-paths */
/** Circular dependencies in this file should have no impact at build time and runtime, ås all imports/exports are types that will be stripped by tsc */
import {
  TokenRatesController,
  CurrencyRateController,
  TokenListController,
  TokensController,
  TokenBalancesController,
  NftController,
  RatesController,
  CurrencyRateState,
  TokenListState,
  TokensControllerState,
  TokenBalancesControllerState,
  NftControllerState,
  RatesControllerState,
  TokenRatesControllerState,
  MultichainBalancesController,
  MultichainBalancesControllerState,
  MultichainAssetsController,
  MultiChainAssetsRatesController,
  MultichainAssetsControllerState,
  MultichainAssetsRatesControllerState,
} from '@metamask/assets-controllers';
import {
  KeyringController,
  KeyringControllerState,
} from '@metamask/keyring-controller';
import {
  AddressBookController,
  AddressBookControllerState,
} from '@metamask/address-book-controller';
import {
  ApprovalController,
  ApprovalControllerState,
} from '@metamask/approval-controller';
import { EnsController, EnsControllerState } from '@metamask/ens-controller';
import {
  PhishingController,
  PhishingControllerState,
} from '@metamask/phishing-controller';
import {
  AnnouncementController,
  AnnouncementControllerState,
} from '@metamask/announcement-controller';
import { NetworkController, NetworkState } from '@metamask/network-controller';
import { GasFeeController, GasFeeState } from '@metamask/gas-fee-controller';
import {
  CaveatConstraint,
  PermissionConstraint,
  PermissionController,
  PermissionControllerState,
  PermissionSpecificationConstraint,
  SubjectMetadataController,
  SubjectMetadataControllerState,
} from '@metamask/permission-controller';
import {
  RemoteFeatureFlagController,
  RemoteFeatureFlagControllerState,
} from '@metamask/remote-feature-flag-controller';
import {
  SelectedNetworkController,
  SelectedNetworkControllerState,
} from '@metamask/selected-network-controller';
import {
  LoggingController,
  LoggingControllerState,
} from '@metamask/logging-controller';
import {
  PermissionLogController,
  PermissionLogControllerState,
} from '@metamask/permission-log-controller';
import {
  SnapController,
  CronjobController,
  SnapInterfaceController,
  SnapInsightsController,
  SnapControllerState,
  CronjobControllerState,
  SnapsRegistryState,
  SnapInterfaceControllerState,
  SnapInsightsControllerState,
  JsonSnapsRegistry,
} from '@metamask/snaps-controllers';
import {
  AccountsController,
  AccountsControllerState,
} from '@metamask/accounts-controller';
import {
  SignatureController,
  SignatureControllerState,
} from '@metamask/signature-controller';
import { PPOMController, PPOMState } from '@metamask/ppom-validator';
import { NameController, NameControllerState } from '@metamask/name-controller';
import {
  QueuedRequestController,
  QueuedRequestControllerState,
} from '@metamask/queued-request-controller';
import {
  UserOperationController,
  UserOperationControllerState,
} from '@metamask/user-operation-controller';
import {
  TransactionController,
  TransactionControllerState,
} from '@metamask/transaction-controller';
import {
  AuthenticationController,
  UserStorageController,
} from '@metamask/profile-sync-controller';
import {
  NotificationServicesController,
  NotificationServicesPushController,
} from '@metamask/notification-services-controller';
import SmartTransactionsController, {
  SmartTransactionsControllerState,
} from '@metamask/smart-transactions-controller';
import {
  MultichainTransactionsController,
  MultichainTransactionsControllerState,
} from '@metamask/multichain-transactions-controller';
import {
  MultichainNetworkController,
  MultichainNetworkControllerState,
} from '@metamask/multichain-network-controller';
import { MmiConfigurationController } from '@metamask-institutional/custody-keyring';
import { InstitutionalFeaturesController } from '@metamask-institutional/institutional-features';
import { CustodyController } from '@metamask-institutional/custody-controller';

import AccountTrackerController, {
  AccountTrackerControllerState,
} from '../../app/scripts/controllers/account-tracker-controller';
import {
  NetworkOrderController,
  NetworkOrderControllerState,
} from '../../app/scripts/controllers/network-order';
import {
  AccountOrderController,
  AccountOrderControllerState,
} from '../../app/scripts/controllers/account-order';
import {
  PreferencesController,
  PreferencesControllerState,
} from '../../app/scripts/controllers/preferences-controller';
import {
  AppStateController,
  AppStateControllerState,
} from '../../app/scripts/controllers/app-state-controller';
import {
  AlertController,
  AlertControllerState,
} from '../../app/scripts/controllers/alert-controller';
import {
  MetaMetricsDataDeletionController,
  MetaMetricsDataDeletionState,
} from '../../app/scripts/controllers/metametrics-data-deletion/metametrics-data-deletion';
import BridgeController from '../../app/scripts/controllers/bridge/bridge-controller';
import BridgeStatusController from '../../app/scripts/controllers/bridge-status/bridge-status-controller';
import SwapsController from '../../app/scripts/controllers/swaps';
import EncryptionPublicKeyController, {
  EncryptionPublicKeyControllerState,
} from '../../app/scripts/controllers/encryption-public-key';
import DecryptMessageController, {
  DecryptMessageControllerState,
} from '../../app/scripts/controllers/decrypt-message';
import OnboardingController, {
  OnboardingControllerState,
} from '../../app/scripts/controllers/onboarding';
import MetaMetricsController, {
  MetaMetricsControllerState,
} from '../../app/scripts/controllers/metametrics-controller';
import AppMetadataController, {
  AppMetadataControllerState,
} from '../../app/scripts/controllers/app-metadata';
import { SwapsControllerState } from '../../app/scripts/controllers/swaps/swaps.types';

import { BridgeControllerState } from './bridge';
import { BridgeStatusControllerState } from './bridge-status';
import {
  CustodyControllerState,
  InstitutionalFeaturesControllerState,
  MmiConfigurationControllerState,
} from './institutional';

export type ResetOnRestartStores = {
  AccountTracker: AccountTrackerController;
  TokenRatesController: TokenRatesController;
  DecryptMessageController: DecryptMessageController;
  EncryptionPublicKeyController: EncryptionPublicKeyController;
  SignatureController: SignatureController;
  SwapsController: SwapsController;
  BridgeController: BridgeController;
  BridgeStatusController: BridgeStatusController;
  EnsController: EnsController;
  ApprovalController: ApprovalController;
};

export type ResetOnRestartStoresComposedState = {
  AccountTracker: AccountTrackerControllerState;
  TokenRatesController: TokenRatesControllerState;
  DecryptMessageController: DecryptMessageControllerState;
  EncryptionPublicKeyController: EncryptionPublicKeyControllerState;
  SignatureController: SignatureControllerState;
  SwapsController: SwapsControllerState;
  BridgeController: BridgeControllerState;
  BridgeStatusController: BridgeStatusControllerState;
  EnsController: EnsControllerState;
  ApprovalController: ApprovalControllerState;
};

export type PersistedControllers = {
  PPOMController: PPOMController;
};

export type ControllerPersistedState = {
  PPOMController: PPOMState;
};

export type StoreControllers = ResetOnRestartStores &
  PersistedControllers & {
    AccountsController: AccountsController;
    AppStateController: AppStateController;
    AppMetadataController: AppMetadataController;
    KeyringController: KeyringController;
    PreferencesController: PreferencesController;
    MetaMetricsController: MetaMetricsController;
    MetaMetricsDataDeletionController: MetaMetricsDataDeletionController;
    AddressBookController: AddressBookController;
    CurrencyController: CurrencyRateController;
    MultichainNetworkController: MultichainNetworkController;
    NetworkController: NetworkController;
    AlertController: AlertController;
    OnboardingController: OnboardingController;
    PermissionController: PermissionController<
      PermissionSpecificationConstraint,
      CaveatConstraint
    >;
    PermissionLogController: PermissionLogController;
    SubjectMetadataController: SubjectMetadataController;
    AnnouncementController: AnnouncementController;
    NetworkOrderController: NetworkOrderController;
    AccountOrderController: AccountOrderController;
    GasFeeController: GasFeeController;
    TokenListController: TokenListController;
    TokensController: TokensController;
    TokenBalancesController: TokenBalancesController;
    SmartTransactionsController: SmartTransactionsController;
    NftController: NftController;
    PhishingController: PhishingController;
    SelectedNetworkController: SelectedNetworkController;
    LoggingController: LoggingController;
    MultichainRatesController: RatesController;
    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    CustodyController: CustodyController;
    InstitutionalFeaturesController: InstitutionalFeaturesController;
    MmiConfigurationController: MmiConfigurationController;
    ///: END:ONLY_INCLUDE_IF
    NameController: NameController;
    UserOperationController: UserOperationController;
    // Notification Controllers
    AuthenticationController: AuthenticationController.Controller;
    UserStorageController: UserStorageController.Controller;
    NotificationServicesController: NotificationServicesController.Controller;
    NotificationServicesPushController: NotificationServicesPushController.Controller;
    RemoteFeatureFlagController: RemoteFeatureFlagController;
  };

export type StoreControllersComposedState = ResetOnRestartStoresComposedState &
  ControllerPersistedState & {
    AccountsController: AccountsControllerState;
    AppStateController: AppStateControllerState;
    AppMetadataController: AppMetadataControllerState;
    KeyringController: KeyringControllerState;
    PreferencesController: PreferencesControllerState;
    MetaMetricsController: MetaMetricsControllerState;
    MetaMetricsDataDeletionController: MetaMetricsDataDeletionState;
    AddressBookController: AddressBookControllerState;
    CurrencyController: CurrencyRateState;
    MultichainNetworkController: MultichainNetworkControllerState;
    NetworkController: NetworkState;
    AlertController: AlertControllerState;
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
    TokenBalancesController: TokenBalancesControllerState;
    SmartTransactionsController: SmartTransactionsControllerState;
    NftController: NftControllerState;
    PhishingController: PhishingControllerState;
    SelectedNetworkController: SelectedNetworkControllerState;
    LoggingController: LoggingControllerState;
    MultichainRatesController: RatesControllerState;
    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    CustodyController: CustodyControllerState;
    InstitutionalFeaturesController: InstitutionalFeaturesControllerState;
    MmiConfigurationController: MmiConfigurationControllerState;
    ///: END:ONLY_INCLUDE_IF
    NameController: NameControllerState;
    UserOperationController: UserOperationControllerState;
    // Notification Controllers
    AuthenticationController: AuthenticationController.AuthenticationControllerState;
    UserStorageController: UserStorageController.UserStorageControllerState;
    NotificationServicesController: NotificationServicesController.NotificationServicesControllerState;
    NotificationServicesPushController: NotificationServicesPushController.NotificationServicesPushControllerState;
    RemoteFeatureFlagController: RemoteFeatureFlagControllerState;
  };

export type MemControllers = {
  TransactionController: TransactionController;
};

export type ControllerMemState = {
  TransactionController: TransactionControllerState;
};

export type MemStoreControllers = Omit<
  StoreControllers,
  | 'PhishingController'
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  | 'CustodyController'
  | 'InstitutionalFeaturesController'
  | 'MmiConfigurationController'
  ///: END:ONLY_INCLUDE_IF
> &
  MemControllers & {
    ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
    MultichainAssetsController: MultichainAssetsController;
    MultichainBalancesController: MultichainBalancesController;
    MultichainTransactionsController: MultichainTransactionsController;
    MultiChainAssetsRatesController: MultiChainAssetsRatesController;
    ///: END:ONLY_INCLUDE_IF
    SnapController: SnapController;
    CronjobController: CronjobController;
    SnapsRegistry: JsonSnapsRegistry;
    SnapInterfaceController: SnapInterfaceController;
    SnapInsightsController: SnapInsightsController;
    QueuedRequestController: QueuedRequestController;
  };

export type MemStoreControllersComposedState = Omit<
  StoreControllersComposedState,
  | 'PhishingController'
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  | 'CustodyController'
  | 'InstitutionalFeaturesController'
  | 'MmiConfigurationController'
  ///: END:ONLY_INCLUDE_IF
> &
  ControllerMemState & {
    ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
    MultichainAssetsController: MultichainAssetsControllerState;
    MultichainBalancesController: MultichainBalancesControllerState;
    MultichainTransactionsController: MultichainTransactionsControllerState;
    MultiChainAssetsRatesController: MultichainAssetsRatesControllerState;
    ///: END:ONLY_INCLUDE_IF
    SnapController: SnapControllerState;
    CronjobController: CronjobControllerState;
    SnapsRegistry: SnapsRegistryState;
    SnapInterfaceController: SnapInterfaceControllerState;
    SnapInsightsController: SnapInsightsControllerState;
    QueuedRequestController: QueuedRequestControllerState;
  };

export type BackgroundStateProxy = {
  isInitialized: boolean;
} & MemStoreControllersComposedState;

export type FlattenedBackgroundStateProxy = {
  isInitialized: boolean;
  internalAccounts: AccountsControllerState['internalAccounts'];
  accounts: AccountTrackerControllerState['accounts'];
  accountsByChainId: AccountTrackerControllerState['accountsByChainId'];
  currentBlockGasLimit: AccountTrackerControllerState['currentBlockGasLimit'];
  currentBlockGasLimitByChainId: AccountTrackerControllerState['currentBlockGasLimitByChainId'];
  addressBook: AddressBookControllerState['addressBook'];
  alertEnabledness: AlertControllerState['alertEnabledness'];
  unconnectedAccountAlertShownOrigins: AlertControllerState['unconnectedAccountAlertShownOrigins'];
  web3ShimUsageOrigins: AlertControllerState['web3ShimUsageOrigins'];
  announcements: AnnouncementControllerState['announcements'];
  isSignedIn: AuthenticationController.AuthenticationControllerState['isSignedIn'];
  orderedNetworkList: NetworkOrderControllerState['orderedNetworkList'];
  pinnedAccountList: AccountOrderControllerState['pinnedAccountList'];
  hiddenAccountList: AccountOrderControllerState['hiddenAccountList'];
  currentAppVersion: AppMetadataControllerState['currentAppVersion'];
  currentMigrationVersion: AppMetadataControllerState['currentMigrationVersion'];
  previousAppVersion: AppMetadataControllerState['previousAppVersion'];
  previousMigrationVersion: AppMetadataControllerState['previousMigrationVersion'];
  approvalFlows: ApprovalControllerState['approvalFlows'];
  pendingApprovals: ApprovalControllerState['pendingApprovals'];
  pendingApprovalCount: ApprovalControllerState['pendingApprovalCount'];
  browserEnvironment: AppStateControllerState['browserEnvironment'];
  connectedStatusPopoverHasBeenShown: AppStateControllerState['connectedStatusPopoverHasBeenShown'];
  currentPopupId: AppStateControllerState['currentPopupId'];
  onboardingDate: AppStateControllerState['onboardingDate'];
  currentExtensionPopupId: AppStateControllerState['currentExtensionPopupId'];
  defaultHomeActiveTabName: AppStateControllerState['defaultHomeActiveTabName'];
  fullScreenGasPollTokens: AppStateControllerState['fullScreenGasPollTokens'];
  hadAdvancedGasFeesSetPriorToMigration92_3: AppStateControllerState['hadAdvancedGasFeesSetPriorToMigration92_3'];
  nftsDetectionNoticeDismissed: AppStateControllerState['nftsDetectionNoticeDismissed'];
  nftsDropdownState: AppStateControllerState['nftsDropdownState'];
  notificationGasPollTokens: AppStateControllerState['notificationGasPollTokens'];
  outdatedBrowserWarningLastShown: AppStateControllerState['outdatedBrowserWarningLastShown'];
  popupGasPollTokens: AppStateControllerState['popupGasPollTokens'];
  qrHardware: AppStateControllerState['qrHardware'];
  recoveryPhraseReminderHasBeenShown: AppStateControllerState['recoveryPhraseReminderHasBeenShown'];
  recoveryPhraseReminderLastShown: AppStateControllerState['recoveryPhraseReminderLastShown'];
  signatureSecurityAlertResponses: AppStateControllerState['signatureSecurityAlertResponses'];
  showBetaHeader: AppStateControllerState['showBetaHeader'];
  showPermissionsTour: AppStateControllerState['showPermissionsTour'];
  showNetworkBanner: AppStateControllerState['showNetworkBanner'];
  showAccountBanner: AppStateControllerState['showAccountBanner'];
  switchedNetworkDetails: AppStateControllerState['switchedNetworkDetails'];
  switchedNetworkNeverShowMessage: AppStateControllerState['switchedNetworkNeverShowMessage'];
  showTestnetMessageInDropdown: AppStateControllerState['showTestnetMessageInDropdown'];
  surveyLinkLastClickedOrClosed: AppStateControllerState['surveyLinkLastClickedOrClosed'];
  snapsInstallPrivacyWarningShown: AppStateControllerState['snapsInstallPrivacyWarningShown'];
  termsOfUseLastAgreed: AppStateControllerState['termsOfUseLastAgreed'];
  timeoutMinutes: AppStateControllerState['timeoutMinutes'];
  trezorModel: AppStateControllerState['trezorModel'];
  newPrivacyPolicyToastClickedOrClosed: AppStateControllerState['newPrivacyPolicyToastClickedOrClosed'];
  newPrivacyPolicyToastShownDate: AppStateControllerState['newPrivacyPolicyToastShownDate'];
  balances: MultichainBalancesControllerState['balances'];
  bridgeState: BridgeControllerState;
  bridgeStatusState: BridgeStatusControllerState;
  jobs: CronjobControllerState['jobs'];
  currentCurrency: CurrencyRateState['currentCurrency'];
  currencyRates: CurrencyRateState['currencyRates'];
  unapprovedDecryptMsgs: DecryptMessageControllerState['unapprovedDecryptMsgs'];
  unapprovedDecryptMsgCount: DecryptMessageControllerState['unapprovedDecryptMsgCount'];
  unapprovedEncryptionPublicKeyMsgs: EncryptionPublicKeyControllerState['unapprovedEncryptionPublicKeyMsgs'];
  unapprovedEncryptionPublicKeyMsgCount: EncryptionPublicKeyControllerState['unapprovedEncryptionPublicKeyMsgCount'];
  ensResolutionsByAddress: EnsControllerState['ensResolutionsByAddress'];
  ensEntries: EnsControllerState['ensEntries'];
  estimatedGasFeeTimeBounds: GasFeeState['estimatedGasFeeTimeBounds'];
  gasEstimateType: GasFeeState['gasEstimateType'];
  gasFeeEstimates: GasFeeState['gasFeeEstimates'];
  gasFeeEstimatesByChainId: GasFeeState['gasFeeEstimatesByChainId'];
  nonRPCGasFeeApisDisabled: GasFeeState['nonRPCGasFeeApisDisabled'];
  isUnlocked: KeyringControllerState['isUnlocked'];
  keyrings: KeyringControllerState['keyrings'];
  logs: LoggingControllerState['logs'];
  subscriptionAccountsSeen: NotificationServicesController.NotificationServicesControllerState['subscriptionAccountsSeen'];
  isMetamaskNotificationsFeatureSeen: NotificationServicesController.NotificationServicesControllerState['isMetamaskNotificationsFeatureSeen'];
  isNotificationServicesEnabled: NotificationServicesController.NotificationServicesControllerState['isNotificationServicesEnabled'];
  isFeatureAnnouncementsEnabled: NotificationServicesController.NotificationServicesControllerState['isFeatureAnnouncementsEnabled'];
  metamaskNotificationsList: NotificationServicesController.NotificationServicesControllerState['metamaskNotificationsList'];
  metamaskNotificationsReadList: NotificationServicesController.NotificationServicesControllerState['metamaskNotificationsReadList'];
  isCheckingAccountsPresence: NotificationServicesController.NotificationServicesControllerState['isCheckingAccountsPresence'];
  isFetchingMetamaskNotifications: NotificationServicesController.NotificationServicesControllerState['isFetchingMetamaskNotifications'];
  isUpdatingMetamaskNotifications: NotificationServicesController.NotificationServicesControllerState['isUpdatingMetamaskNotifications'];
  isUpdatingMetamaskNotificationsAccount: NotificationServicesController.NotificationServicesControllerState['isUpdatingMetamaskNotificationsAccount'];
  eventsBeforeMetricsOptIn: MetaMetricsControllerState['eventsBeforeMetricsOptIn'];
  fragments: MetaMetricsControllerState['fragments'];
  metaMetricsId: MetaMetricsControllerState['metaMetricsId'];
  participateInMetaMetrics: MetaMetricsControllerState['participateInMetaMetrics'];
  previousUserTraits: MetaMetricsControllerState['previousUserTraits'];
  segmentApiCalls: MetaMetricsControllerState['segmentApiCalls'];
  traits: MetaMetricsControllerState['traits'];
  dataCollectionForMarketing: MetaMetricsControllerState['dataCollectionForMarketing'];
  marketingCampaignCookieId: MetaMetricsControllerState['marketingCampaignCookieId'];
  latestNonAnonymousEventTimestamp: MetaMetricsControllerState['latestNonAnonymousEventTimestamp'];
  metaMetricsDataDeletionId: MetaMetricsDataDeletionState['metaMetricsDataDeletionId'];
  metaMetricsDataDeletionTimestamp: MetaMetricsDataDeletionState['metaMetricsDataDeletionTimestamp'];
  names: NameControllerState['names'];
  nameSources: NameControllerState['nameSources'];
  // networkConfigurations: NetworkState['networkConfigurations'];
  networksMetadata: NetworkState['networksMetadata'];
  selectedNetworkClientId: NetworkState['selectedNetworkClientId'];
  allNftContracts: NftControllerState['allNftContracts'];
  allNfts: NftControllerState['allNfts'];
  ignoredNfts: NftControllerState['ignoredNfts'];
  completedOnboarding: OnboardingControllerState['completedOnboarding'];
  firstTimeFlowType: OnboardingControllerState['firstTimeFlowType'];
  onboardingTabs: OnboardingControllerState['onboardingTabs'];
  seedPhraseBackedUp: OnboardingControllerState['seedPhraseBackedUp'];
  storageMetadata: PPOMState['storageMetadata'];
  versionInfo: PPOMState['versionInfo'];
  subjects: PermissionControllerState<PermissionConstraint>['subjects'];
  permissionActivityLog: PermissionLogControllerState['permissionActivityLog'];
  permissionHistory: PermissionLogControllerState['permissionHistory'];
  advancedGasFee: PreferencesControllerState['advancedGasFee'];
  currentLocale: PreferencesControllerState['currentLocale'];
  dismissSeedBackUpReminder: PreferencesControllerState['dismissSeedBackUpReminder'];
  overrideContentSecurityPolicyHeader: PreferencesControllerState['overrideContentSecurityPolicyHeader'];
  featureFlags: PreferencesControllerState['featureFlags'];
  forgottenPassword: PreferencesControllerState['forgottenPassword'];
  identities: PreferencesControllerState['identities'];
  incomingTransactionsPreferences: PreferencesControllerState['incomingTransactionsPreferences'];
  isIpfsGatewayEnabled: PreferencesControllerState['isIpfsGatewayEnabled'];
  ipfsGateway: PreferencesControllerState['ipfsGateway'];
  knownMethodData: PreferencesControllerState['knownMethodData'];
  ledgerTransportType: PreferencesControllerState['ledgerTransportType'];
  lostIdentities: PreferencesControllerState['lostIdentities'];
  openSeaEnabled: PreferencesControllerState['openSeaEnabled'];
  preferences: PreferencesControllerState['preferences'];
  useExternalServices: PreferencesControllerState['useExternalServices'];
  securityAlertsEnabled: PreferencesControllerState['securityAlertsEnabled'];
  selectedAddress: PreferencesControllerState['selectedAddress'];
  snapRegistryList: PreferencesControllerState['snapRegistryList'];
  theme: PreferencesControllerState['theme'];
  use4ByteResolution: PreferencesControllerState['use4ByteResolution'];
  useAddressBarEnsResolution: PreferencesControllerState['useAddressBarEnsResolution'];
  useBlockie: PreferencesControllerState['useBlockie'];
  useCurrencyRateCheck: PreferencesControllerState['useCurrencyRateCheck'];
  useExternalNameSources: PreferencesControllerState['useExternalNameSources'];
  useMultiAccountBalanceChecker: PreferencesControllerState['useMultiAccountBalanceChecker'];
  useNftDetection: PreferencesControllerState['useNftDetection'];
  usePhishDetect: PreferencesControllerState['usePhishDetect'];
  useTokenDetection: PreferencesControllerState['useTokenDetection'];
  // useRequestQueue: PreferencesControllerState['useRequestQueue'];
  useTransactionSimulations: PreferencesControllerState['useTransactionSimulations'];
  enableMV3TimestampSave: PreferencesControllerState['enableMV3TimestampSave'];
  useSafeChainsListValidation: PreferencesControllerState['useSafeChainsListValidation'];
  watchEthereumAccountEnabled: PreferencesControllerState['watchEthereumAccountEnabled'];
  bitcoinSupportEnabled: PreferencesControllerState['bitcoinSupportEnabled'];
  bitcoinTestnetSupportEnabled: PreferencesControllerState['bitcoinTestnetSupportEnabled'];
  addSnapAccountEnabled: PreferencesControllerState['addSnapAccountEnabled'];
  snapsAddSnapAccountModalDismissed: PreferencesControllerState['snapsAddSnapAccountModalDismissed'];
  remoteFeatureFlags: RemoteFeatureFlagControllerState['remoteFeatureFlags'];
  cacheTimestamp: RemoteFeatureFlagControllerState['cacheTimestamp'];
  fcmToken: NotificationServicesPushController.NotificationServicesPushControllerState['fcmToken'];
  fiatCurrency: RatesControllerState['fiatCurrency'];
  rates: RatesControllerState['rates'];
  cryptocurrencies: RatesControllerState['cryptocurrencies'];
  queuedRequestCount: QueuedRequestControllerState['queuedRequestCount'];
  domains: SelectedNetworkControllerState['domains'];
  unapprovedPersonalMsgCount: SignatureControllerState['unapprovedPersonalMsgCount'];
  unapprovedPersonalMsgs: SignatureControllerState['unapprovedPersonalMsgs'];
  unapprovedTypedMessages: SignatureControllerState['unapprovedTypedMessages'];
  unapprovedTypedMessagesCount: SignatureControllerState['unapprovedTypedMessagesCount'];
  smartTransactionsState: SmartTransactionsControllerState['smartTransactionsState'];
  snaps: SnapControllerState['snaps'];
  interfaces: SnapInterfaceControllerState['interfaces'];
  insights: SnapInsightsControllerState['insights'];
  database: SnapsRegistryState['database'];
  lastUpdated: SnapsRegistryState['lastUpdated'];
  databaseUnavailable: SnapsRegistryState['databaseUnavailable'];
  subjectMetadata: SubjectMetadataControllerState['subjectMetadata'];
  swapsState: SwapsControllerState['swapsState'];
  tokenBalances: TokenBalancesControllerState['tokenBalances'];
  allDetectedTokens: TokensControllerState['allDetectedTokens'];
  allIgnoredTokens: TokensControllerState['allIgnoredTokens'];
  allTokens: TokensControllerState['allTokens'];
  detectedTokens: TokensControllerState['detectedTokens'];
  ignoredTokens: TokensControllerState['ignoredTokens'];
  tokens: TokensControllerState['tokens'];
  preventPollingOnNetworkRestart: TokenListState['preventPollingOnNetworkRestart'];
  tokenList: TokenListState['tokenList'];
  tokensChainsCache: TokenListState['tokensChainsCache'];
  marketData: TokenRatesControllerState['marketData'];
  lastFetchedBlockNumbers: TransactionControllerState['lastFetchedBlockNumbers'];
  methodData: TransactionControllerState['methodData'];
  transactions: TransactionControllerState['transactions'];
  userOperations: UserOperationControllerState['userOperations'];
  isProfileSyncingEnabled: UserStorageController.UserStorageControllerState['isProfileSyncingEnabled'];
  isProfileSyncingUpdateLoading: UserStorageController.UserStorageControllerState['isProfileSyncingUpdateLoading'];
  hasAccountSyncingSyncedAtLeastOnce: UserStorageController.UserStorageControllerState['hasAccountSyncingSyncedAtLeastOnce'];
  isAccountSyncingReadyToBeDispatched: UserStorageController.UserStorageControllerState['isAccountSyncingReadyToBeDispatched'];
};
