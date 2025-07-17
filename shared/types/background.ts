/* eslint-disable import/no-restricted-paths */
/** Type import paths do not need to be restricted, as they are stripped at runtime and do not have any build time impact. */
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
  DeFiPositionsControllerState,
} from '@metamask/assets-controllers';
import type { MultichainTransactionsControllerState } from '@metamask/multichain-transactions-controller';
import type { MultichainNetworkControllerState } from '@metamask/multichain-network-controller';
import type { KeyringControllerState } from '@metamask/keyring-controller';
import type { AddressBookControllerState } from '@metamask/address-book-controller';
import type { ApprovalControllerState } from '@metamask/approval-controller';
import type { BridgeControllerState } from '@metamask/bridge-controller';
import type { BridgeStatusControllerState } from '@metamask/bridge-status-controller';
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

export type ControllerStatePropertiesEnumerated = {
  internalAccounts: AccountsControllerState['internalAccounts'];
  accounts: AccountTrackerControllerState['accounts'];
  accountsByChainId: AccountTrackerControllerState['accountsByChainId'];
  currentBlockGasLimit: AccountTrackerControllerState['currentBlockGasLimit'];
  currentBlockGasLimitByChainId: AccountTrackerControllerState['currentBlockGasLimitByChainId'];
  addressBook: AddressBookControllerState['addressBook'];
  alertEnabledness: AlertControllerState['alertEnabledness'];
  unconnectedAccountAlertShownOrigins: AlertControllerState['unconnectedAccountAlertShownOrigins'];
  web3ShimUsageOrigins?: AlertControllerState['web3ShimUsageOrigins'];
  announcements: AnnouncementControllerState['announcements'];
  isSignedIn: AuthenticationController.AuthenticationControllerState['isSignedIn'];
  srpSessionData?: AuthenticationController.AuthenticationControllerState['srpSessionData'];
  pinnedAccountList: AccountOrderControllerState['pinnedAccountList'];
  hiddenAccountList: AccountOrderControllerState['hiddenAccountList'];
  currentAppVersion: AppMetadataControllerState['currentAppVersion'];
  currentMigrationVersion: AppMetadataControllerState['currentMigrationVersion'];
  previousAppVersion: AppMetadataControllerState['previousAppVersion'];
  previousMigrationVersion: AppMetadataControllerState['previousMigrationVersion'];
  approvalFlows: ApprovalControllerState['approvalFlows'];
  pendingApprovals: ApprovalControllerState['pendingApprovals'];
  pendingApprovalCount: ApprovalControllerState['pendingApprovalCount'];
  timeoutMinutes: AppStateControllerState['timeoutMinutes'];
  connectedStatusPopoverHasBeenShown: AppStateControllerState['connectedStatusPopoverHasBeenShown'];
  defaultHomeActiveTabName: AppStateControllerState['defaultHomeActiveTabName'];
  browserEnvironment: AppStateControllerState['browserEnvironment'];
  popupGasPollTokens: AppStateControllerState['popupGasPollTokens'];
  notificationGasPollTokens: AppStateControllerState['notificationGasPollTokens'];
  fullScreenGasPollTokens: AppStateControllerState['fullScreenGasPollTokens'];
  recoveryPhraseReminderHasBeenShown: AppStateControllerState['recoveryPhraseReminderHasBeenShown'];
  recoveryPhraseReminderLastShown: AppStateControllerState['recoveryPhraseReminderLastShown'];
  outdatedBrowserWarningLastShown: AppStateControllerState['outdatedBrowserWarningLastShown'];
  nftsDetectionNoticeDismissed: AppStateControllerState['nftsDetectionNoticeDismissed'];
  showTestnetMessageInDropdown: AppStateControllerState['showTestnetMessageInDropdown'];
  showBetaHeader: AppStateControllerState['showBetaHeader'];
  showPermissionsTour: AppStateControllerState['showPermissionsTour'];
  showNetworkBanner: AppStateControllerState['showNetworkBanner'];
  showAccountBanner: AppStateControllerState['showAccountBanner'];
  trezorModel: AppStateControllerState['trezorModel'];
  currentPopupId?: AppStateControllerState['currentPopupId'];
  onboardingDate: AppStateControllerState['onboardingDate'];
  lastViewedUserSurvey: AppStateControllerState['lastViewedUserSurvey'];
  isRampCardClosed: AppStateControllerState['isRampCardClosed'];
  newPrivacyPolicyToastClickedOrClosed: AppStateControllerState['newPrivacyPolicyToastClickedOrClosed'];
  newPrivacyPolicyToastShownDate: AppStateControllerState['newPrivacyPolicyToastShownDate'];
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  hadAdvancedGasFeesSetPriorToMigration92_3: AppStateControllerState['hadAdvancedGasFeesSetPriorToMigration92_3'];
  qrHardware: AppStateControllerState['qrHardware'];
  nftsDropdownState: AppStateControllerState['nftsDropdownState'];
  surveyLinkLastClickedOrClosed: AppStateControllerState['surveyLinkLastClickedOrClosed'];
  signatureSecurityAlertResponses: AppStateControllerState['signatureSecurityAlertResponses'];
  addressSecurityAlertResponses: AppStateControllerState['addressSecurityAlertResponses'];
  switchedNetworkDetails: AppStateControllerState['switchedNetworkDetails'];
  switchedNetworkNeverShowMessage: AppStateControllerState['switchedNetworkNeverShowMessage'];
  currentExtensionPopupId: AppStateControllerState['currentExtensionPopupId'];
  lastInteractedConfirmationInfo?: AppStateControllerState['lastInteractedConfirmationInfo'];
  termsOfUseLastAgreed?: AppStateControllerState['termsOfUseLastAgreed'];
  snapsInstallPrivacyWarningShown?: AppStateControllerState['snapsInstallPrivacyWarningShown'];
  slides: AppStateControllerState['slides'];
  isUpdateAvailable: AppStateControllerState['isUpdateAvailable'];
  updateModalLastDismissedAt: AppStateControllerState['updateModalLastDismissedAt'];
  lastUpdatedAt: AppStateControllerState['lastUpdatedAt'];
  throttledOrigins: AppStateControllerState['throttledOrigins'];
  quoteRequest: BridgeControllerState['quoteRequest'];
  quotes: BridgeControllerState['quotes'];
  quotesInitialLoadTime: BridgeControllerState['quotesInitialLoadTime'];
  quotesLastFetched: BridgeControllerState['quotesLastFetched'];
  quotesLoadingStatus: BridgeControllerState['quotesLoadingStatus'];
  quoteFetchError: BridgeControllerState['quoteFetchError'];
  quotesRefreshCount: BridgeControllerState['quotesRefreshCount'];
  minimumBalanceForRentExemptionInLamports: BridgeControllerState['minimumBalanceForRentExemptionInLamports'];
  assetExchangeRates: BridgeControllerState['assetExchangeRates'];
  txHistory: BridgeStatusControllerState['txHistory'];
  events: CronjobControllerState['events'];
  currentCurrency: CurrencyRateState['currentCurrency'];
  currencyRates: CurrencyRateState['currencyRates'];
  unapprovedDecryptMsgs: DecryptMessageControllerState['unapprovedDecryptMsgs'];
  unapprovedDecryptMsgCount: DecryptMessageControllerState['unapprovedDecryptMsgCount'];
  allDeFiPositions: DeFiPositionsControllerState['allDeFiPositions'];
  allDeFiPositionsCount: DeFiPositionsControllerState['allDeFiPositionsCount'];
  unapprovedEncryptionPublicKeyMsgs: EncryptionPublicKeyControllerState['unapprovedEncryptionPublicKeyMsgs'];
  unapprovedEncryptionPublicKeyMsgCount: EncryptionPublicKeyControllerState['unapprovedEncryptionPublicKeyMsgCount'];
  ensResolutionsByAddress: EnsControllerState['ensResolutionsByAddress'];
  ensEntries: EnsControllerState['ensEntries'];
  gasFeeEstimatesByChainId?: GasFeeState['gasFeeEstimatesByChainId'];
  gasFeeEstimates: GasFeeState['gasFeeEstimates'];
  estimatedGasFeeTimeBounds: GasFeeState['estimatedGasFeeTimeBounds'];
  gasEstimateType: GasFeeState['gasEstimateType'];
  nonRPCGasFeeApisDisabled?: GasFeeState['nonRPCGasFeeApisDisabled'];
  isUnlocked: KeyringControllerState['isUnlocked'];
  vault?: KeyringControllerState['vault'];
  keyrings: KeyringControllerState['keyrings'];
  encryptionKey?: KeyringControllerState['encryptionKey'];
  encryptionSalt?: KeyringControllerState['encryptionSalt'];
  logs: LoggingControllerState['logs'];
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
  metaMetricsDataDeletionStatus?: MetaMetricsDataDeletionState['metaMetricsDataDeletionStatus'];
  metaMetricsDataDeletionTimestamp: MetaMetricsDataDeletionState['metaMetricsDataDeletionTimestamp'];
  balances: MultichainBalancesControllerState['balances'];
  nonEvmTransactions: MultichainTransactionsControllerState['nonEvmTransactions'];
  conversionRates: MultichainAssetsRatesControllerState['conversionRates'];
  historicalPrices: MultichainAssetsRatesControllerState['historicalPrices'];
  assetsMetadata: MultichainAssetsControllerState['assetsMetadata'];
  accountsAssets: MultichainAssetsControllerState['accountsAssets'];
  multichainNetworkConfigurationsByChainId: MultichainNetworkControllerState['multichainNetworkConfigurationsByChainId'];
  selectedMultichainNetworkChainId: MultichainNetworkControllerState['selectedMultichainNetworkChainId'];
  isEvmSelected: MultichainNetworkControllerState['isEvmSelected'];
  networksWithTransactionActivity: MultichainNetworkControllerState['networksWithTransactionActivity'];
  names: NameControllerState['names'];
  nameSources: NameControllerState['nameSources'];
  networkConfigurationsByChainId: NetworkState['networkConfigurationsByChainId'];
  networksMetadata: NetworkState['networksMetadata'];
  selectedNetworkClientId: NetworkState['selectedNetworkClientId'];
  orderedNetworkList: NetworkOrderControllerState['orderedNetworkList'];
  enabledNetworkMap: NetworkOrderControllerState['enabledNetworkMap'];
  allNftContracts: NftControllerState['allNftContracts'];
  allNfts: NftControllerState['allNfts'];
  ignoredNfts: NftControllerState['ignoredNfts'];
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
  isPushEnabled: NotificationServicesPushController.NotificationServicesPushControllerState['isPushEnabled'];
  fcmToken: NotificationServicesPushController.NotificationServicesPushControllerState['fcmToken'];
  isUpdatingFCMToken: NotificationServicesPushController.NotificationServicesPushControllerState['isUpdatingFCMToken'];
  completedOnboarding: OnboardingControllerState['completedOnboarding'];
  firstTimeFlowType: OnboardingControllerState['firstTimeFlowType'];
  onboardingTabs?: OnboardingControllerState['onboardingTabs'];
  seedPhraseBackedUp: OnboardingControllerState['seedPhraseBackedUp'];
  subjects: PermissionControllerState<PermissionConstraint>['subjects'];
  permissionActivityLog: PermissionLogControllerState['permissionActivityLog'];
  permissionHistory: PermissionLogControllerState['permissionHistory'];
  storageMetadata: PPOMState['storageMetadata'];
  versionInfo: PPOMState['versionInfo'];
  featureFlags: PreferencesControllerState['featureFlags'];
  identities: PreferencesControllerState['identities'];
  ipfsGateway: PreferencesControllerState['ipfsGateway'];
  isIpfsGatewayEnabled: PreferencesControllerState['isIpfsGatewayEnabled'];
  isMultiAccountBalancesEnabled: PreferencesControllerState['isMultiAccountBalancesEnabled'];
  lostIdentities: PreferencesControllerState['lostIdentities'];
  openSeaEnabled: PreferencesControllerState['openSeaEnabled'];
  securityAlertsEnabled: PreferencesControllerState['securityAlertsEnabled'];
  selectedAddress: PreferencesControllerState['selectedAddress'];
  showIncomingTransactions: PreferencesControllerState['showIncomingTransactions'];
  useNftDetection: PreferencesControllerState['useNftDetection'];
  useTokenDetection: PreferencesControllerState['useTokenDetection'];
  useTransactionSimulations: PreferencesControllerState['useTransactionSimulations'];
  useSafeChainsListValidation: PreferencesControllerState['useSafeChainsListValidation'];
  useBlockie: PreferencesControllerState['useBlockie'];
  usePhishDetect: PreferencesControllerState['usePhishDetect'];
  dismissSeedBackUpReminder: PreferencesControllerState['dismissSeedBackUpReminder'];
  overrideContentSecurityPolicyHeader: PreferencesControllerState['overrideContentSecurityPolicyHeader'];
  useMultiAccountBalanceChecker: PreferencesControllerState['useMultiAccountBalanceChecker'];
  use4ByteResolution: PreferencesControllerState['use4ByteResolution'];
  useCurrencyRateCheck: PreferencesControllerState['useCurrencyRateCheck'];
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  watchEthereumAccountEnabled: PreferencesControllerState['watchEthereumAccountEnabled'];
  ///: END:ONLY_INCLUDE_IF
  addSnapAccountEnabled?: PreferencesControllerState['addSnapAccountEnabled'];
  advancedGasFee: PreferencesControllerState['advancedGasFee'];
  knownMethodData: PreferencesControllerState['knownMethodData'];
  currentLocale: PreferencesControllerState['currentLocale'];
  forgottenPassword: PreferencesControllerState['forgottenPassword'];
  preferences: PreferencesControllerState['preferences'];
  useAddressBarEnsResolution: PreferencesControllerState['useAddressBarEnsResolution'];
  ledgerTransportType: PreferencesControllerState['ledgerTransportType'];
  snapRegistryList: PreferencesControllerState['snapRegistryList'];
  theme: PreferencesControllerState['theme'];
  snapsAddSnapAccountModalDismissed?: PreferencesControllerState['snapsAddSnapAccountModalDismissed'];
  useExternalNameSources: PreferencesControllerState['useExternalNameSources'];
  enableMV3TimestampSave: PreferencesControllerState['enableMV3TimestampSave'];
  useExternalServices: PreferencesControllerState['useExternalServices'];
  textDirection?: PreferencesControllerState['textDirection'];
  manageInstitutionalWallets: PreferencesControllerState['manageInstitutionalWallets'];
  remoteFeatureFlags: RemoteFeatureFlagControllerState['remoteFeatureFlags'];
  cacheTimestamp: RemoteFeatureFlagControllerState['cacheTimestamp'];
  fiatCurrency: RatesControllerState['fiatCurrency'];
  rates: RatesControllerState['rates'];
  cryptocurrencies: RatesControllerState['cryptocurrencies'];
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
  preventPollingOnNetworkRestart: TokenListState['preventPollingOnNetworkRestart'];
  tokensChainsCache: TokenListState['tokensChainsCache'];
  marketData: TokenRatesControllerState['marketData'];
  lastFetchedBlockNumbers: TransactionControllerState['lastFetchedBlockNumbers'];
  methodData: TransactionControllerState['methodData'];
  transactions: TransactionControllerState['transactions'];
  transactionBatches: TransactionControllerState['transactionBatches'];
  submitHistory: TransactionControllerState['submitHistory'];
  userOperations: UserOperationControllerState['userOperations'];
  isBackupAndSyncEnabled: UserStorageController.UserStorageControllerState['isBackupAndSyncEnabled'];
  isBackupAndSyncUpdateLoading: UserStorageController.UserStorageControllerState['isBackupAndSyncUpdateLoading'];
  isAccountSyncingEnabled: UserStorageController.UserStorageControllerState['isAccountSyncingEnabled'];
  hasAccountSyncingSyncedAtLeastOnce: UserStorageController.UserStorageControllerState['hasAccountSyncingSyncedAtLeastOnce'];
  isAccountSyncingReadyToBeDispatched: UserStorageController.UserStorageControllerState['isAccountSyncingReadyToBeDispatched'];
  isAccountSyncingInProgress: UserStorageController.UserStorageControllerState['isAccountSyncingInProgress'];
  hasNetworkSyncingSyncedAtLeastOnce?: UserStorageController.UserStorageControllerState['hasNetworkSyncingSyncedAtLeastOnce'];
  isContactSyncingEnabled: UserStorageController.UserStorageControllerState['isContactSyncingEnabled'];
  isContactSyncingInProgress: UserStorageController.UserStorageControllerState['isContactSyncingInProgress'];
};

type ControllerStateTypesMerged = AccountsControllerState &
  AccountTrackerControllerState &
  AddressBookControllerState &
  AlertControllerState &
  AnnouncementControllerState &
  AuthenticationController.AuthenticationControllerState &
  AccountOrderControllerState &
  AppMetadataControllerState &
  ApprovalControllerState &
  AppStateControllerState &
  BridgeControllerState &
  BridgeStatusControllerState &
  CronjobControllerState &
  CurrencyRateState &
  DecryptMessageControllerState &
  DeFiPositionsControllerState &
  EncryptionPublicKeyControllerState &
  EnsControllerState & {
    // This is necessary due to the nested unions and intersections in the `GasFeeState` type definition
    [P in keyof GasFeeState]: GasFeeState[P];
  } & KeyringControllerState &
  LoggingControllerState &
  MetaMetricsControllerState &
  MetaMetricsDataDeletionState &
  MultichainBalancesControllerState &
  MultichainTransactionsControllerState &
  MultichainAssetsRatesControllerState &
  MultichainAssetsControllerState &
  MultichainNetworkControllerState &
  NameControllerState &
  NetworkState &
  NetworkOrderControllerState &
  NftControllerState &
  NotificationServicesController.NotificationServicesControllerState &
  NotificationServicesPushController.NotificationServicesPushControllerState &
  OnboardingControllerState &
  PermissionControllerState<PermissionConstraint> &
  PermissionLogControllerState &
  PPOMState &
  PreferencesControllerState &
  RemoteFeatureFlagControllerState &
  RatesControllerState &
  SelectedNetworkControllerState &
  SignatureControllerState &
  SmartTransactionsControllerState &
  SnapControllerState &
  SnapInterfaceControllerState &
  SnapInsightsControllerState &
  SnapsRegistryState &
  SubjectMetadataControllerState &
  SwapsControllerState &
  TokenBalancesControllerState &
  TokensControllerState &
  TokenListState &
  TokenRatesControllerState &
  TransactionControllerState &
  UserOperationControllerState &
  UserStorageController.UserStorageControllerState;

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export type IsEquivalent<A, B> = [A, B] extends [B, A] ? true : false;

/**
 * This type contains all controller state top-level properties, and
 * is the source-of-truth for the type of the Redux store `metamask` slice.
 *
 * Evaluates to `never` if the type definition is wrong or incomplete.
 */
export type FlattenedBackgroundStateProxy =
  IsEquivalent<
    ControllerStatePropertiesEnumerated,
    ControllerStateTypesMerged
  > extends true
    ? { isInitialized: boolean } & {
        [P in keyof ControllerStatePropertiesEnumerated]: ControllerStatePropertiesEnumerated[P];
      }
    : never;
