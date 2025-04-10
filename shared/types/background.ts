/* eslint-disable import/no-restricted-paths */
/** Circular dependencies in this file should have no impact at build time and runtime, ås all imports/exports are types that will be stripped by tsc */
import type {
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
import type { MultichainTransactionsControllerState } from '@metamask/multichain-transactions-controller';
import type { MultichainNetworkControllerState } from '@metamask/multichain-network-controller';
import type { KeyringControllerState } from '@metamask/keyring-controller';
import type { AddressBookControllerState } from '@metamask/address-book-controller';
import type { ApprovalControllerState } from '@metamask/approval-controller';
import type { EnsControllerState } from '@metamask/ens-controller';
import type { AnnouncementControllerState } from '@metamask/announcement-controller';
import type { NetworkState } from '@metamask/network-controller';
import type { GasFeeState } from '@metamask/gas-fee-controller';
import type {
  PermissionConstraint,
  PermissionControllerState,
  SubjectMetadataControllerState,
} from '@metamask/permission-controller';
import type { RemoteFeatureFlagControllerState } from '@metamask/remote-feature-flag-controller';
import type { SelectedNetworkControllerState } from '@metamask/selected-network-controller';
import type { LoggingControllerState } from '@metamask/logging-controller';
import type { PermissionLogControllerState } from '@metamask/permission-log-controller';
import type {
  SnapControllerState,
  CronjobControllerState,
  SnapsRegistryState,
  SnapInterfaceControllerState,
  SnapInsightsControllerState,
} from '@metamask/snaps-controllers';
import type { AccountsControllerState } from '@metamask/accounts-controller';
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
import type { SmartTransactionsControllerState } from '@metamask/smart-transactions-controller';

import type { AccountTrackerControllerState } from '../../app/scripts/controllers/account-tracker-controller';
import type { NetworkOrderControllerState } from '../../app/scripts/controllers/network-order';
import type { AccountOrderControllerState } from '../../app/scripts/controllers/account-order';
import type { PreferencesControllerState } from '../../app/scripts/controllers/preferences-controller';
import type { AppStateControllerState } from '../../app/scripts/controllers/app-state-controller';
import type { AlertControllerState } from '../../app/scripts/controllers/alert-controller';
import type { MetaMetricsDataDeletionState } from '../../app/scripts/controllers/metametrics-data-deletion/metametrics-data-deletion';
import type { EncryptionPublicKeyControllerState } from '../../app/scripts/controllers/encryption-public-key';
import type { DecryptMessageControllerState } from '../../app/scripts/controllers/decrypt-message';
import type { OnboardingControllerState } from '../../app/scripts/controllers/onboarding';
import type { MetaMetricsControllerState } from '../../app/scripts/controllers/metametrics-controller';
import type { AppMetadataControllerState } from '../../app/scripts/controllers/app-metadata';
import type { SwapsControllerState } from '../../app/scripts/controllers/swaps/swaps.types';
import { BridgeState } from '../../ui/ducks/bridge/bridge';
import { BridgeStatusState } from './bridge-status';

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
  sessionData: AuthenticationController.AuthenticationControllerState['sessionData'];
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
  lastInteractedConfirmationInfo: AppStateControllerState['lastInteractedConfirmationInfo'];
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
  isRampCardClosed: AppStateControllerState['isRampCardClosed'];
  throttledOrigins: AppStateControllerState['throttledOrigins'];
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
  bridgeState: BridgeState;
  bridgeStatusState: BridgeStatusState;
  events: CronjobControllerState['events'];
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
  vault: KeyringControllerState['vault'];
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
  isIpfsGatewayEnabled: PreferencesControllerState['isIpfsGatewayEnabled'];
  ipfsGateway: PreferencesControllerState['ipfsGateway'];
  isMultiAccountBalancesEnabled: PreferencesControllerState['isMultiAccountBalancesEnabled'];
  knownMethodData: PreferencesControllerState['knownMethodData'];
  ledgerTransportType: PreferencesControllerState['ledgerTransportType'];
  lostIdentities: PreferencesControllerState['lostIdentities'];
  openSeaEnabled: PreferencesControllerState['openSeaEnabled'];
  preferences: PreferencesControllerState['preferences'];
  useExternalServices: PreferencesControllerState['useExternalServices'];
  securityAlertsEnabled: PreferencesControllerState['securityAlertsEnabled'];
  selectedAddress: PreferencesControllerState['selectedAddress'];
  snapRegistryList: PreferencesControllerState['snapRegistryList'];
  showIncomingTransactions: PreferencesControllerState['showIncomingTransactions'];
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
  signatureRequests: SignatureControllerState['signatureRequests'];
  smartTransactionsState: SmartTransactionsControllerState['smartTransactionsState'];
  snaps: SnapControllerState['snaps'];
  snapStates: SnapControllerState['snapStates'];
  unencryptedSnapStates: SnapControllerState['unencryptedSnapStates'];
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
  submitHistory: TransactionControllerState['submitHistory'];
  userOperations: UserOperationControllerState['userOperations'];
  isProfileSyncingEnabled: UserStorageController.UserStorageControllerState['isProfileSyncingEnabled'];
  isProfileSyncingUpdateLoading: UserStorageController.UserStorageControllerState['isProfileSyncingUpdateLoading'];
  hasAccountSyncingSyncedAtLeastOnce: UserStorageController.UserStorageControllerState['hasAccountSyncingSyncedAtLeastOnce'];
  isAccountSyncingReadyToBeDispatched: UserStorageController.UserStorageControllerState['isAccountSyncingReadyToBeDispatched'];
  isAccountSyncingInProgress: UserStorageController.UserStorageControllerState['isAccountSyncingInProgress'];
};
