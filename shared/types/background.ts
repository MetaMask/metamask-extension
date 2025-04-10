/* eslint-disable import/no-restricted-paths */
/** Circular dependencies in this file should have no impact at build time and runtime, ås all imports/exports are types that will be stripped by tsc */
import {
  CurrencyRateState,
  TokenListState,
  TokensControllerState,
  TokenBalancesControllerState,
  NftControllerState,
  RatesControllerState,
  TokenRatesControllerState,
  MultichainBalancesControllerState,
  MultichainAssetsRatesControllerState,
  MultichainAssetsControllerState,
} from '@metamask/assets-controllers';
import { MultichainTransactionsControllerState } from '@metamask/multichain-transactions-controller';
import { MultichainNetworkControllerState } from '@metamask/multichain-network-controller';
import { KeyringControllerState } from '@metamask/keyring-controller';
import { AddressBookControllerState } from '@metamask/address-book-controller';
import { ApprovalControllerState } from '@metamask/approval-controller';
import { EnsControllerState } from '@metamask/ens-controller';
import { AnnouncementControllerState } from '@metamask/announcement-controller';
import { NetworkState } from '@metamask/network-controller';
import { GasFeeState } from '@metamask/gas-fee-controller';
import {
  PermissionConstraint,
  PermissionControllerState,
  SubjectMetadataControllerState,
} from '@metamask/permission-controller';
import { RemoteFeatureFlagControllerState } from '@metamask/remote-feature-flag-controller';
import { SelectedNetworkControllerState } from '@metamask/selected-network-controller';
import { LoggingControllerState } from '@metamask/logging-controller';
import { PermissionLogControllerState } from '@metamask/permission-log-controller';
import {
  SnapControllerState,
  CronjobControllerState,
  SnapsRegistryState,
  SnapInterfaceControllerState,
  SnapInsightsControllerState,
} from '@metamask/snaps-controllers';
import { AccountsControllerState } from '@metamask/accounts-controller';
import { SignatureControllerState } from '@metamask/signature-controller';
import { PPOMState } from '@metamask/ppom-validator';
import { NameControllerState } from '@metamask/name-controller';
import { QueuedRequestControllerState } from '@metamask/queued-request-controller';
import { UserOperationControllerState } from '@metamask/user-operation-controller';
import { TransactionControllerState } from '@metamask/transaction-controller';
import {
  AuthenticationController,
  UserStorageController,
} from '@metamask/profile-sync-controller';
import {
  NotificationServicesController,
  NotificationServicesPushController,
} from '@metamask/notification-services-controller';
import { SmartTransactionsControllerState } from '@metamask/smart-transactions-controller';

import { AccountTrackerControllerState } from '../../app/scripts/controllers/account-tracker-controller';
import { NetworkOrderControllerState } from '../../app/scripts/controllers/network-order';
import { AccountOrderControllerState } from '../../app/scripts/controllers/account-order';
import { PreferencesControllerState } from '../../app/scripts/controllers/preferences-controller';
import { AppStateControllerState } from '../../app/scripts/controllers/app-state-controller';
import { AlertControllerState } from '../../app/scripts/controllers/alert-controller';
import { MetaMetricsDataDeletionState } from '../../app/scripts/controllers/metametrics-data-deletion/metametrics-data-deletion';
import { EncryptionPublicKeyControllerState } from '../../app/scripts/controllers/encryption-public-key';
import { DecryptMessageControllerState } from '../../app/scripts/controllers/decrypt-message';
import { OnboardingControllerState } from '../../app/scripts/controllers/onboarding';
import { MetaMetricsControllerState } from '../../app/scripts/controllers/metametrics-controller';
import { AppMetadataControllerState } from '../../app/scripts/controllers/app-metadata';
import { SwapsControllerState } from '../../app/scripts/controllers/swaps/swaps.types';

import { BridgeControllerState } from './bridge';
import { BridgeStatusControllerState } from './bridge-status';

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
  lastViewedUserSurvey: AppStateControllerState['lastViewedUserSurvey'];
  nftsDetectionNoticeDismissed: AppStateControllerState['nftsDetectionNoticeDismissed'];
  nftsDropdownState: AppStateControllerState['nftsDropdownState'];
  notificationGasPollTokens: AppStateControllerState['notificationGasPollTokens'];
  outdatedBrowserWarningLastShown: AppStateControllerState['outdatedBrowserWarningLastShown'];
  popupGasPollTokens: AppStateControllerState['popupGasPollTokens'];
  qrHardware: AppStateControllerState['qrHardware'];
  recoveryPhraseReminderHasBeenShown: AppStateControllerState['recoveryPhraseReminderHasBeenShown'];
  recoveryPhraseReminderLastShown: AppStateControllerState['recoveryPhraseReminderLastShown'];
  signatureSecurityAlertResponses: AppStateControllerState['signatureSecurityAlertResponses'];
  slides: AppStateControllerState['slides'];
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
  nonEvmTransactions: MultichainTransactionsControllerState['nonEvmTransactions'];
  conversionRates: MultichainAssetsRatesControllerState['conversionRates'];
  assetsMetadata: MultichainAssetsControllerState['assetsMetadata'];
  accountsAssets: MultichainAssetsControllerState['accountsAssets'];
  multichainNetworkConfigurationsByChainId: MultichainNetworkControllerState['multichainNetworkConfigurationsByChainId'];
  selectedMultichainNetworkChainId: MultichainNetworkControllerState['selectedMultichainNetworkChainId'];
  isEvmSelected: MultichainNetworkControllerState['isEvmSelected'];
  bridgeState: BridgeControllerState['bridgeState'];
  bridgeStatusState: BridgeStatusControllerState['bridgeStatusState'];
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
  keyringsMetadata: KeyringControllerState['keyringsMetadata'];
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
  metaMetricsDataDeletionStatus: MetaMetricsDataDeletionState['metaMetricsDataDeletionStatus'];
  metaMetricsDataDeletionTimestamp: MetaMetricsDataDeletionState['metaMetricsDataDeletionTimestamp'];
  names: NameControllerState['names'];
  nameSources: NameControllerState['nameSources'];
  networkConfigurationsByChainId: NetworkState['networkConfigurationsByChainId'];
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
