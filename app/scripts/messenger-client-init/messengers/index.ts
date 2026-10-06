import { noop } from 'lodash';
import {
  getAnalyticsControllerInitMessenger,
  getAnalyticsControllerMessenger,
} from './analytics-controller-messenger';
import {
  getPPOMControllerMessenger,
  getPPOMControllerInitMessenger,
} from './ppom-controller-messenger';
import { getCronjobControllerMessenger } from './snaps/cronjob-controller-messenger';
import { getExecutionServiceMessenger } from './snaps/execution-service-messenger';
import {
  getMultichainRoutingServiceInitMessenger,
  getMultichainRoutingServiceMessenger,
} from './snaps/multichain-routing-service-messenger';
import {
  getRateLimitControllerInitMessenger,
  getRateLimitControllerMessenger,
} from './snaps/rate-limit-controller-messenger';
import {
  getSnapControllerInitMessenger,
  getSnapControllerMessenger,
} from './snaps/snap-controller-messenger';
import { getSnapInsightsControllerMessenger } from './snaps/snap-insights-controller-messenger';
import { getSnapInterfaceControllerMessenger } from './snaps/snap-interface-controller-messenger';
import { getSnapsNameProviderMessenger } from './snaps/snaps-name-provider-messenger';
import { getSnapRegistryControllerMessenger } from './snaps/snap-registry-controller-messenger';
import { getWebSocketServiceMessenger } from './snaps/websocket-service-messenger';
import {
  getTransactionPayControllerMessenger,
  getTransactionPayControllerInitMessenger,
} from './transaction-pay-controller-messenger';
import {
  getBackendWebSocketServiceMessenger,
  getBackendWebSocketServiceInitMessenger,
} from './core-backend/backend-websocket-service-messenger';
import { getAccountActivityServiceMessenger } from './core-backend/account-activity-service-messenger';
import {
  getMultichainBalancesControllerMessenger,
  getMultichainBalancesControllerInitMessenger,
} from './multichain/multichain-balances-controller-messenger';
import { getMultichainTransactionsControllerMessenger } from './multichain/multichain-transactions-controller-messenger';
import {
  getMultichainAssetsControllerMessenger,
  getMultichainAssetsControllerInitMessenger,
} from './multichain/multichain-assets-controller-messenger';
import { getMultichainNetworkControllerMessenger } from './multichain/multichain-network-controller-messenger';
import {
  getMultichainAssetsRatesControllerMessenger,
  getMultichainAssetsRatesControllerInitMessenger,
} from './multichain/multichain-assets-rates-controller-messenger';
import { getInstitutionalSnapControllerMessenger } from './accounts/institutional-snap-controller-messenger';
import {
  getAuthenticationControllerInitMessenger,
  getAuthenticationControllerMessenger,
} from './identity/authentication-controller-messenger';
import {
  getUserStorageControllerMessenger,
  getUserStorageControllerInitMessenger,
} from './identity/user-storage-controller-messenger';
import {
  getAssetsContractControllerMessenger,
  getAssetsContractControllerInitMessenger,
} from './assets/assets-contract-controller-messenger';
import {
  getNetworkEnablementControllerMessenger,
  getNetworkEnablementControllerInitMessenger,
} from './assets/network-enablement-controller-messenger';
import { getNetworkOrderControllerMessenger } from './assets/network-order-controller-messenger';
import {
  getNftControllerInitMessenger,
  getNftControllerMessenger,
} from './assets/nft-controller-messenger';
import { getNftDetectionControllerMessenger } from './assets/nft-detection-controller-messenger';
import {
  getTokenRatesControllerInitMessenger,
  getTokenRatesControllerMessenger,
} from './assets/token-rates-controller-messenger';
import {
  getAssetsControllerMessenger,
  getAssetsControllerInitMessenger,
} from './assets/assets-controller-messenger';
import { getClientControllerMessenger } from './assets/client-controller-messenger';
import { getNotificationServicesControllerMessenger } from './notifications/notification-services-controller-messenger';
import {
  getNotificationServicesPushControllerInitMessenger,
  getNotificationServicesPushControllerMessenger,
} from './notifications/notification-services-push-controller-messenger';
import {
  getDeFiPositionsControllerMessenger,
  getDeFiPositionsControllerInitMessenger,
} from './defi-positions/defi-positions-controller-messenger';
import {
  getDeFiPositionsControllerV2Messenger,
  getDeFiPositionsControllerV2InitMessenger,
} from './defi-positions/defi-positions-controller-v2-messenger';
import { getDelegationControllerMessenger } from './delegation/delegation-controller-messenger';
import {
  getAccountTreeControllerMessenger,
  getAccountTreeControllerInitMessenger,
} from './accounts/account-tree-controller-messenger';
import {
  getMultichainAccountServiceMessenger,
  getMultichainAccountServiceInitMessenger,
} from './accounts/multichain-account-service-messenger';
import { getSnapAccountServiceMessenger } from './accounts/snap-account-service-messenger';
import { getOAuthServiceMessenger } from './seedless-onboarding/oauth-service-messenger';
import {
  getSmartTransactionsControllerInitMessenger,
  getSmartTransactionsControllerMessenger,
} from './smart-transactions-controller-messenger';
import { getNetworkConnectionBannerControllerMessenger } from './network-connection-banner/network-connection-banner-controller-messenger';
import { getGatorPermissionsControllerMessenger } from './gator-permissions/gator-permissions-controller-messenger';
import {
  getTokenListControllerInitMessenger,
  getTokenListControllerMessenger,
} from './token-list-controller-messenger';
import {
  getTokenDetectionControllerInitMessenger,
  getTokenDetectionControllerMessenger,
} from './token-detection-controller-messenger';
import {
  getTokensControllerInitMessenger,
  getTokensControllerMessenger,
} from './tokens-controller-messenger';
import {
  getTokenBalancesControllerInitMessenger,
  getTokenBalancesControllerMessenger,
} from './token-balances-controller-messenger';
import {
  getStaticAssetsControllerInitMessenger,
  getStaticAssetsControllerMessenger,
} from './static-assets-controller-messenger';
import { getRatesControllerMessenger } from './rates-controller-messenger';
import {
  getCurrencyRateControllerInitMessenger,
  getCurrencyRateControllerMessenger,
} from './currency-rate-controller-messenger';
import {
  getNameControllerInitMessenger,
  getNameControllerMessenger,
} from './name-controller-messenger';
import { getSelectedNetworkControllerMessenger } from './selected-network-controller-messenger';
import {
  getAccountTrackerControllerInitMessenger,
  getAccountTrackerControllerMessenger,
} from './account-tracker-controller-messenger';
import { getOnboardingControllerMessenger } from './onboarding-controller-messenger';
import { getQrSyncControllerMessenger } from './qr-sync/qr-sync-controller-messenger';
import {
  getRampsControllerInitMessenger,
  getRampsControllerMessenger,
} from './ramps-controller-messenger';
import { getRampsServiceMessenger } from './ramps-service-messenger';
import {
  getRewardsControllerInitMessenger,
  getRewardsControllerMessenger,
} from './rewards-controller-messenger';
import {
  getBridgeControllerInitMessenger,
  getBridgeControllerMessenger,
} from './bridge-controller-messenger';
import { getBridgeStatusControllerMessenger } from './bridge-status-controller-messenger';
import { getPreferencesControllerMessenger } from './preferences-controller-messenger';
import { getAppStateControllerMessenger } from './app-state-controller-messenger';
import {
  getPermissionControllerMessenger,
  getPermissionControllerInitMessenger,
} from './permission-controller-messenger';
import { getSubjectMetadataControllerMessenger } from './subject-metadata-controller-messenger';
import { getPermissionLogControllerMessenger } from './permission-log-controller-messenger';
import { getShieldSubscriptionServiceMessenger } from './subscription/shield-subscription-service-messenger';
import { getAnnouncementControllerMessenger } from './announcement-controller-messenger';
import { getAccountOrderControllerMessenger } from './account-order-controller-messenger';
import { getPhishingControllerMessenger } from './phishing-controller-messenger';
import { getAlertControllerMessenger } from './alert-controller-messenger';
import { getMetaMetricsDataDeletionControllerMessenger } from './metametrics-data-deletion-controller-messenger';
import { getLoggingControllerMessenger } from './logging-controller-messenger';
import { getAppMetadataControllerMessenger } from './app-metadata-controller-messenger';
import { getDecryptMessageManagerMessenger } from './decrypt-message-manager-messenger';
import {
  getDecryptMessageControllerInitMessenger,
  getDecryptMessageControllerMessenger,
} from './decrypt-message-controller-messenger';
import {
  getEncryptionPublicKeyControllerInitMessenger,
  getEncryptionPublicKeyControllerMessenger,
} from './encryption-public-key-controller-messenger';
import { getEncryptionPublicKeyManagerMessenger } from './encryption-public-key-manager-messenger';
import {
  getSignatureControllerInitMessenger,
  getSignatureControllerMessenger,
} from './signature-controller-messenger';
import {
  getUserOperationControllerInitMessenger,
  getUserOperationControllerMessenger,
} from './user-operation-controller-messenger';
import { getRewardsDataServiceMessenger } from './reward-data-service-messenger';
import { getAuthenticatedUserStorageServiceMessenger } from './authenticated-user-storage-service-messenger';
import {
  getChompApiServiceInitMessenger,
  getChompApiServiceMessenger,
} from './chomp-api-service-messenger';
import {
  getProfileMetricsControllerInitMessenger,
  getProfileMetricsControllerMessenger,
} from './profile-metrics-controller-messenger';
import { getProfileMetricsServiceMessenger } from './profile-metrics-service-messenger';
import { getProofOfOwnershipServiceMessenger } from './proof-of-ownership-service-messenger';
import { getGeolocationApiServiceMessenger } from './geolocation-api-service-messenger';
import { getGeolocationControllerMessenger } from './geolocation-controller-messenger';
import { getComplianceControllerMessenger } from './compliance-controller-messenger';
import { getComplianceServiceMessenger } from './compliance-service-messenger';
import { getPerpsControllerMessenger } from './perps-controller-messenger';
import { getDataDeletionServiceMessenger } from './data-deletion-service-messenger';
import { getUserTraitsServiceMessenger } from './user-traits-service-messenger';
import { getLegacyBackgroundApiServiceMessenger } from './legacy-background-api-service-messenger';
import { getSentinelApiServiceMessenger } from './sentinel-api-service-messenger';
import { getSentryTracingServiceMessenger } from './sentry-tracing-service-messenger';
import { getMoneyAccountApiDataServiceMessenger } from './money-account-api-data-service-messenger';
import { getMoneyAccountBalanceServiceMessenger } from './money-account-balance-service-messenger';
import { getMoneyAccountAvailabilityServiceMessenger } from './money-account-availability-service-messenger';
import {
  getMoneyAccountControllerInitMessenger,
  getMoneyAccountControllerMessenger,
} from './money-account-controller-messenger';
import {
  getMoneyAccountUpgradeControllerMessenger,
  getMoneyAccountUpgradeControllerInitMessenger,
} from './money-account-upgrade-controller-messenger';

export const MESSENGER_FACTORIES = {
  AccountOrderController: {
    getMessenger: getAccountOrderControllerMessenger,
    getInitMessenger: noop,
  },
  AccountTrackerController: {
    getMessenger: getAccountTrackerControllerMessenger,
    getInitMessenger: getAccountTrackerControllerInitMessenger,
  },
  AlertController: {
    getMessenger: getAlertControllerMessenger,
    getInitMessenger: noop,
  },
  AnnouncementController: {
    getMessenger: getAnnouncementControllerMessenger,
    getInitMessenger: noop,
  },
  AppMetadataController: {
    getMessenger: getAppMetadataControllerMessenger,
    getInitMessenger: noop,
  },
  AppStateController: {
    getMessenger: getAppStateControllerMessenger,
    getInitMessenger: noop,
  },
  AnalyticsController: {
    getMessenger: getAnalyticsControllerMessenger,
    getInitMessenger: getAnalyticsControllerInitMessenger,
  },
  AssetsController: {
    getMessenger: getAssetsControllerMessenger,
    getInitMessenger: getAssetsControllerInitMessenger,
  },
  AuthenticationController: {
    getMessenger: getAuthenticationControllerMessenger,
    getInitMessenger: getAuthenticationControllerInitMessenger,
  },
  AuthenticatedUserStorageService: {
    getMessenger: getAuthenticatedUserStorageServiceMessenger,
    getInitMessenger: noop,
  },
  BridgeController: {
    getMessenger: getBridgeControllerMessenger,
    getInitMessenger: getBridgeControllerInitMessenger,
  },
  BridgeStatusController: {
    getMessenger: getBridgeStatusControllerMessenger,
    getInitMessenger: noop,
  },
  NetworkConnectionBannerController: {
    getMessenger: getNetworkConnectionBannerControllerMessenger,
    getInitMessenger: noop,
  },
  ChompApiService: {
    getMessenger: getChompApiServiceMessenger,
    getInitMessenger: getChompApiServiceInitMessenger,
  },
  ClientController: {
    getMessenger: getClientControllerMessenger,
    getInitMessenger: noop,
  },
  ComplianceService: {
    getMessenger: getComplianceServiceMessenger,
    getInitMessenger: noop,
  },
  ComplianceController: {
    getMessenger: getComplianceControllerMessenger,
    getInitMessenger: noop,
  },
  CronjobController: {
    getMessenger: getCronjobControllerMessenger,
    getInitMessenger: noop,
  },
  CurrencyRateController: {
    getMessenger: getCurrencyRateControllerMessenger,
    getInitMessenger: getCurrencyRateControllerInitMessenger,
  },
  DataDeletionService: {
    getMessenger: getDataDeletionServiceMessenger,
    getInitMessenger: noop,
  },
  DecryptMessageController: {
    getMessenger: getDecryptMessageControllerMessenger,
    getInitMessenger: getDecryptMessageControllerInitMessenger,
  },
  DecryptMessageManager: {
    getMessenger: getDecryptMessageManagerMessenger,
    getInitMessenger: noop,
  },
  DeFiPositionsController: {
    getMessenger: getDeFiPositionsControllerMessenger,
    getInitMessenger: getDeFiPositionsControllerInitMessenger,
  },
  DeFiPositionsControllerV2: {
    getMessenger: getDeFiPositionsControllerV2Messenger,
    getInitMessenger: getDeFiPositionsControllerV2InitMessenger,
  },
  DelegationController: {
    getMessenger: getDelegationControllerMessenger,
    getInitMessenger: noop,
  },
  EncryptionPublicKeyController: {
    getMessenger: getEncryptionPublicKeyControllerMessenger,
    getInitMessenger: getEncryptionPublicKeyControllerInitMessenger,
  },
  EncryptionPublicKeyManager: {
    getMessenger: getEncryptionPublicKeyManagerMessenger,
    getInitMessenger: noop,
  },
  ExecutionService: {
    getMessenger: getExecutionServiceMessenger,
    getInitMessenger: noop,
  },
  GatorPermissionsController: {
    getMessenger: getGatorPermissionsControllerMessenger,
    getInitMessenger: noop,
  },
  GeolocationApiService: {
    getMessenger: getGeolocationApiServiceMessenger,
    getInitMessenger: noop,
  },
  GeolocationController: {
    getMessenger: getGeolocationControllerMessenger,
    getInitMessenger: noop,
  },
  InstitutionalSnapController: {
    getMessenger: getInstitutionalSnapControllerMessenger,
    getInitMessenger: noop,
  },
  LegacyBackgroundApiService: {
    getMessenger: getLegacyBackgroundApiServiceMessenger,
    getInitMessenger: noop,
  },
  LoggingController: {
    getMessenger: getLoggingControllerMessenger,
    getInitMessenger: noop,
  },
  MetaMetricsDataDeletionController: {
    getMessenger: getMetaMetricsDataDeletionControllerMessenger,
    getInitMessenger: noop,
  },
  MoneyAccountApiDataService: {
    getMessenger: getMoneyAccountApiDataServiceMessenger,
    getInitMessenger: noop,
  },
  MoneyAccountAvailabilityService: {
    getMessenger: getMoneyAccountAvailabilityServiceMessenger,
    getInitMessenger: noop,
  },
  MoneyAccountBalanceService: {
    getMessenger: getMoneyAccountBalanceServiceMessenger,
    getInitMessenger: noop,
  },
  MoneyAccountController: {
    getMessenger: getMoneyAccountControllerMessenger,
    getInitMessenger: getMoneyAccountControllerInitMessenger,
  },
  MoneyAccountUpgradeController: {
    getMessenger: getMoneyAccountUpgradeControllerMessenger,
    getInitMessenger: getMoneyAccountUpgradeControllerInitMessenger,
  },
  MultichainAssetsController: {
    getMessenger: getMultichainAssetsControllerMessenger,
    getInitMessenger: getMultichainAssetsControllerInitMessenger,
  },
  MultichainAssetsRatesController: {
    getMessenger: getMultichainAssetsRatesControllerMessenger,
    getInitMessenger: getMultichainAssetsRatesControllerInitMessenger,
  },
  MultichainBalancesController: {
    getMessenger: getMultichainBalancesControllerMessenger,
    getInitMessenger: getMultichainBalancesControllerInitMessenger,
  },
  MultichainTransactionsController: {
    getMessenger: getMultichainTransactionsControllerMessenger,
    getInitMessenger: noop,
  },
  MultichainNetworkController: {
    getMessenger: getMultichainNetworkControllerMessenger,
    getInitMessenger: noop,
  },
  MultichainRoutingService: {
    getMessenger: getMultichainRoutingServiceMessenger,
    getInitMessenger: getMultichainRoutingServiceInitMessenger,
  },
  NameController: {
    getMessenger: getNameControllerMessenger,
    getInitMessenger: getNameControllerInitMessenger,
  },
  NotificationServicesController: {
    getMessenger: getNotificationServicesControllerMessenger,
    getInitMessenger: noop,
  },
  NotificationServicesPushController: {
    getMessenger: getNotificationServicesPushControllerMessenger,
    getInitMessenger: getNotificationServicesPushControllerInitMessenger,
  },
  OAuthService: {
    getMessenger: getOAuthServiceMessenger,
    getInitMessenger: noop,
  },
  OnboardingController: {
    getMessenger: getOnboardingControllerMessenger,
    getInitMessenger: noop,
  },
  PermissionController: {
    getMessenger: getPermissionControllerMessenger,
    getInitMessenger: getPermissionControllerInitMessenger,
  },
  PermissionLogController: {
    getMessenger: getPermissionLogControllerMessenger,
    getInitMessenger: noop,
  },
  PerpsController: {
    getMessenger: getPerpsControllerMessenger,
    getInitMessenger: noop,
  },
  PhishingController: {
    getMessenger: getPhishingControllerMessenger,
    getInitMessenger: noop,
  },
  RateLimitController: {
    getMessenger: getRateLimitControllerMessenger,
    getInitMessenger: getRateLimitControllerInitMessenger,
  },
  RatesController: {
    getMessenger: getRatesControllerMessenger,
    getInitMessenger: noop,
  },
  SelectedNetworkController: {
    getMessenger: getSelectedNetworkControllerMessenger,
    getInitMessenger: noop,
  },
  SentinelApiService: {
    getMessenger: getSentinelApiServiceMessenger,
    getInitMessenger: noop,
  },
  SentryTracingService: {
    getMessenger: getSentryTracingServiceMessenger,
    getInitMessenger: noop,
  },
  SignatureController: {
    getMessenger: getSignatureControllerMessenger,
    getInitMessenger: getSignatureControllerInitMessenger,
  },
  SnapAccountService: {
    getMessenger: getSnapAccountServiceMessenger,
    getInitMessenger: noop,
  },
  SnapsNameProvider: {
    getMessenger: getSnapsNameProviderMessenger,
    getInitMessenger: noop,
  },
  SnapRegistryController: {
    getMessenger: getSnapRegistryControllerMessenger,
    getInitMessenger: noop,
  },
  SnapController: {
    getMessenger: getSnapControllerMessenger,
    getInitMessenger: getSnapControllerInitMessenger,
  },
  SnapInsightsController: {
    getMessenger: getSnapInsightsControllerMessenger,
    getInitMessenger: noop,
  },
  SnapInterfaceController: {
    getMessenger: getSnapInterfaceControllerMessenger,
    getInitMessenger: noop,
  },
  StaticAssetsController: {
    getMessenger: getStaticAssetsControllerMessenger,
    getInitMessenger: getStaticAssetsControllerInitMessenger,
  },
  SubjectMetadataController: {
    getMessenger: getSubjectMetadataControllerMessenger,
    getInitMessenger: noop,
  },
  ShieldSubscriptionService: {
    getMessenger: getShieldSubscriptionServiceMessenger,
    getInitMessenger: noop,
  },
  RewardsDataService: {
    getMessenger: getRewardsDataServiceMessenger,
    getInitMessenger: noop,
  },
  RewardsController: {
    getMessenger: getRewardsControllerMessenger,
    getInitMessenger: getRewardsControllerInitMessenger,
  },
  PPOMController: {
    getMessenger: getPPOMControllerMessenger,
    getInitMessenger: getPPOMControllerInitMessenger,
  },
  PreferencesController: {
    getMessenger: getPreferencesControllerMessenger,
    getInitMessenger: noop,
  },
  QrSyncController: {
    getMessenger: getQrSyncControllerMessenger,
    getInitMessenger: noop,
  },
  RampsService: {
    getMessenger: getRampsServiceMessenger,
    getInitMessenger: noop,
  },
  RampsController: {
    getMessenger: getRampsControllerMessenger,
    getInitMessenger: getRampsControllerInitMessenger,
  },
  TokenBalancesController: {
    getMessenger: getTokenBalancesControllerMessenger,
    getInitMessenger: getTokenBalancesControllerInitMessenger,
  },
  TokenDetectionController: {
    getMessenger: getTokenDetectionControllerMessenger,
    getInitMessenger: getTokenDetectionControllerInitMessenger,
  },
  TokenListController: {
    getMessenger: getTokenListControllerMessenger,
    getInitMessenger: getTokenListControllerInitMessenger,
  },
  TokensController: {
    getMessenger: getTokensControllerMessenger,
    getInitMessenger: getTokensControllerInitMessenger,
  },
  TransactionPayController: {
    getMessenger: getTransactionPayControllerMessenger,
    getInitMessenger: getTransactionPayControllerInitMessenger,
  },
  UserOperationController: {
    getMessenger: getUserOperationControllerMessenger,
    getInitMessenger: getUserOperationControllerInitMessenger,
  },
  UserStorageController: {
    getMessenger: getUserStorageControllerMessenger,
    getInitMessenger: getUserStorageControllerInitMessenger,
  },
  TokenRatesController: {
    getMessenger: getTokenRatesControllerMessenger,
    getInitMessenger: getTokenRatesControllerInitMessenger,
  },
  NftController: {
    getMessenger: getNftControllerMessenger,
    getInitMessenger: getNftControllerInitMessenger,
  },
  NftDetectionController: {
    getMessenger: getNftDetectionControllerMessenger,
    getInitMessenger: noop,
  },
  AssetsContractController: {
    getMessenger: getAssetsContractControllerMessenger,
    getInitMessenger: getAssetsContractControllerInitMessenger,
  },
  AccountTreeController: {
    getMessenger: getAccountTreeControllerMessenger,
    getInitMessenger: getAccountTreeControllerInitMessenger,
  },
  WebSocketService: {
    getMessenger: getWebSocketServiceMessenger,
    getInitMessenger: noop,
  },
  BackendWebSocketService: {
    getMessenger: getBackendWebSocketServiceMessenger,
    getInitMessenger: getBackendWebSocketServiceInitMessenger,
  },
  AccountActivityService: {
    getMessenger: getAccountActivityServiceMessenger,
    getInitMessenger: noop,
  },
  SmartTransactionsController: {
    getMessenger: getSmartTransactionsControllerMessenger,
    getInitMessenger: getSmartTransactionsControllerInitMessenger,
  },
  MultichainAccountService: {
    getMessenger: getMultichainAccountServiceMessenger,
    getInitMessenger: getMultichainAccountServiceInitMessenger,
  },
  NetworkOrderController: {
    getMessenger: getNetworkOrderControllerMessenger,
    getInitMessenger: noop,
  },
  NetworkEnablementController: {
    getMessenger: getNetworkEnablementControllerMessenger,
    getInitMessenger: getNetworkEnablementControllerInitMessenger,
  },
  ProfileMetricsController: {
    getMessenger: getProfileMetricsControllerMessenger,
    getInitMessenger: getProfileMetricsControllerInitMessenger,
  },
  ProfileMetricsService: {
    getMessenger: getProfileMetricsServiceMessenger,
    getInitMessenger: noop,
  },
  ProofOfOwnershipService: {
    getMessenger: getProofOfOwnershipServiceMessenger,
    getInitMessenger: noop,
  },
  UserTraitsService: {
    getMessenger: getUserTraitsServiceMessenger,
    getInitMessenger: noop,
  },
} as const;
