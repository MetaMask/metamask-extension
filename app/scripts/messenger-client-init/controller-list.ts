import { MultichainAccountService } from '@metamask/multichain-account-service';
import { GasFeeController } from '@metamask/gas-fee-controller';
import { KeyringController } from '@metamask/keyring-controller';
import { NetworkController } from '@metamask/network-controller';
import {
  CaveatSpecificationConstraint,
  PermissionController,
  PermissionSpecificationConstraint,
  SubjectMetadataController,
} from '@metamask/permission-controller';
import { PPOMController } from '@metamask/ppom-validator';
import { SmartTransactionsController } from '@metamask/smart-transactions-controller';
import { TransactionController } from '@metamask/transaction-controller';
import { TransactionPayController } from '@metamask/transaction-pay-controller';
import { AccountsController } from '@metamask/accounts-controller';
import {
  AccountTrackerController,
  AssetsContractController,
  CurrencyRateController,
  DeFiPositionsController,
  MultichainAssetsController,
  MultichainAssetsRatesController,
  MultichainBalancesController,
  NftController,
  NftDetectionController,
  RatesController,
  TokenBalancesController,
  TokenDetectionController,
  TokenListController,
  TokenRatesController,
  TokensController,
} from '@metamask/assets-controllers';
import { AssetsController } from '@metamask/assets-controller';
import { MultichainNetworkController } from '@metamask/multichain-network-controller';
import { MultichainTransactionsController } from '@metamask/multichain-transactions-controller';
import {
  CronjobController,
  ExecutionService,
  MultichainRoutingService,
  SnapController,
  SnapInsightsController,
  SnapInterfaceController,
  SnapRegistryController,
  WebSocketService,
} from '@metamask/snaps-controllers';
import {
  RateLimitController,
  RateLimitedApiMap,
} from '@metamask/rate-limit-controller';
import { Controller as AuthenticationController } from '@metamask/profile-sync-controller/auth';
import { Controller as UserStorageController } from '@metamask/profile-sync-controller/user-storage';
import { Controller as NotificationServicesController } from '@metamask/notification-services-controller/notification-services';
import { Controller as NotificationServicesPushController } from '@metamask/notification-services-controller/push-services';
import { DelegationController } from '@metamask/delegation-controller';

import { RemoteFeatureFlagController } from '@metamask/remote-feature-flag-controller';
import { AccountTreeController } from '@metamask/account-tree-controller';
import { SeedlessOnboardingController } from '@metamask/seedless-onboarding-controller';
import { EncryptionKey } from '@metamask/browser-passworder';
import { GatorPermissionsController } from '@metamask/gator-permissions-controller';
import { ShieldController } from '@metamask/shield-controller';
import { SubscriptionController } from '@metamask/subscription-controller';
import { EnsController } from '@metamask/ens-controller';
import { NameController } from '@metamask/name-controller';
import { SelectedNetworkController } from '@metamask/selected-network-controller';
import { BridgeController } from '@metamask/bridge-controller';
import { BridgeStatusController } from '@metamask/bridge-status-controller';
import { ApprovalController } from '@metamask/approval-controller';
import { NetworkEnablementController } from '@metamask/network-enablement-controller';
import { PermissionLogController } from '@metamask/permission-log-controller';
import { AnnouncementController } from '@metamask/announcement-controller';
import { PhishingController } from '@metamask/phishing-controller';
import { LoggingController } from '@metamask/logging-controller';
import { StorageService } from '@metamask/storage-service';
import { AddressBookController } from '@metamask/address-book-controller';
import {
  DecryptMessageManager,
  EncryptionPublicKeyManager,
} from '@metamask/message-manager';
import { SignatureController } from '@metamask/signature-controller';
import { UserOperationController } from '@metamask/user-operation-controller';
import {
  AccountActivityService,
  BackendWebSocketService,
} from '@metamask/core-backend';
import { ClaimsController, ClaimsService } from '@metamask/claims-controller';
import { ClientController } from '@metamask/client-controller';
import { ConnectivityController } from '@metamask/connectivity-controller';
import {
  ProfileMetricsController,
  ProfileMetricsService,
} from '@metamask/profile-metrics-controller';
import {
  GeolocationApiService,
  GeolocationController,
} from '@metamask/geolocation-controller';
import { PerpsController } from '@metamask/perps-controller';
import { PasskeyController } from '@metamask/passkey-controller';
import { OnboardingController } from '../controllers/onboarding';
import { PreferencesController } from '../controllers/preferences-controller';
import { InstitutionalSnapController } from '../controllers/institutional-snap/InstitutionalSnapController';
import { NetworkOrderController } from '../controllers/network-order';
import { MetaMetricsController } from '../controllers/metametrics-controller';
import { OAuthService } from '../services/oauth/oauth-service';
import { SnapsNameProvider } from '../lib/SnapsNameProvider';
import { AppStateController } from '../controllers/app-state-controller';
import { SnapKeyringBuilder } from '../lib/snap-keyring/snap-keyring';
import { SubscriptionService } from '../services/subscription/subscription-service';
import { AccountOrderController } from '../controllers/account-order';
import { AlertController } from '../controllers/alert-controller';
import { MetaMetricsDataDeletionController } from '../controllers/metametrics-data-deletion/metametrics-data-deletion';
import { AppMetadataController } from '../controllers/app-metadata';
import { DecryptMessageController } from '../controllers/decrypt-message';
import { EncryptionPublicKeyController } from '../controllers/encryption-public-key';
import { RewardsDataService } from '../controllers/rewards/rewards-data-service';
import { RewardsController } from '../controllers/rewards/rewards-controller';
import { StaticAssetsController } from '../controllers/static-assets-controller';
import { DataDeletionService } from '../services/data-deletion-service';
import { LegacyBackgroundApiService } from '../services/legacy-background-api-service';

/**
 * Union of all messenger clients (controllers and services) supporting or required by modular initialization.
 */
export type MessengerClient =
  | AccountOrderController
  | AccountTrackerController
  | AccountsController
  | AddressBookController
  | AlertController
  | AnnouncementController
  | AppMetadataController
  | ApprovalController
  | AppStateController
  | AssetsController
  | AuthenticationController
  | BridgeController
  | BridgeStatusController
  | ClaimsController
  | CronjobController
  | CurrencyRateController
  | DataDeletionService
  | DecryptMessageController
  | DecryptMessageManager
  | DelegationController
  | DeFiPositionsController
  | EncryptionPublicKeyController
  | EncryptionPublicKeyManager
  | EnsController
  | StorageService
  | ExecutionService
  | GasFeeController
  | GatorPermissionsController
  | GeolocationApiService
  | GeolocationController
  | KeyringController
  | LegacyBackgroundApiService
  | LoggingController
  | MetaMetricsController
  | MetaMetricsDataDeletionController
  | MultichainAssetsController
  | MultichainAssetsRatesController
  | MultichainBalancesController
  | MultichainTransactionsController
  | MultichainNetworkController
  | MultichainRoutingService
  | NameController
  | NetworkController
  | NetworkOrderController
  | NotificationServicesController
  | NotificationServicesPushController
  | OAuthService
  | OnboardingController
  | PasskeyController
  | PermissionController<
      PermissionSpecificationConstraint,
      CaveatSpecificationConstraint
    >
  | PermissionLogController
  | PerpsController
  | PhishingController
  | PPOMController
  | PreferencesController
  | RateLimitController<RateLimitedApiMap>
  | RatesController
  | RemoteFeatureFlagController
  | RewardsController
  | RewardsDataService
  | SeedlessOnboardingController<EncryptionKey>
  | SelectedNetworkController
  | ShieldController
  | SignatureController
  | SmartTransactionsController
  | SnapController
  | SnapInterfaceController
  | SnapInsightsController
  | SnapKeyringBuilder
  | SnapRegistryController
  | SubscriptionController
  | SnapsNameProvider
  | SubjectMetadataController
  | SubscriptionService
  | TokenBalancesController
  | TokenDetectionController
  | TokenListController
  | TokensController
  | TransactionController
  | TransactionPayController
  | InstitutionalSnapController
  | UserOperationController
  | UserStorageController
  | TokenRatesController
  | NftController
  | NftDetectionController
  | AssetsContractController
  | AccountTreeController
  | WebSocketService
  | BackendWebSocketService
  | AccountActivityService
  | MultichainAccountService
  | NetworkEnablementController
  | ClaimsService
  | ClientController
  | StaticAssetsController
  | ProfileMetricsController
  | ProfileMetricsService
  | ConnectivityController;

/**
 * Flat state object for all messenger clients supporting or required by modular initialization.
 * e.g. `{ transactions: [] }`.
 */
export type MessengerClientFlatState = AccountOrderController['state'] &
  AccountsController['state'] &
  AlertController['state'] &
  AccountTreeController['state'] &
  AddressBookController['state'] &
  AnnouncementController['state'] &
  AppMetadataController['state'] &
  ApprovalController['state'] &
  AppStateController['state'] &
  AssetsController['state'] &
  AuthenticationController['state'] &
  BridgeController['state'] &
  BridgeStatusController['state'] &
  ClaimsController['state'] &
  ClientController['state'] &
  CronjobController['state'] &
  CurrencyRateController['state'] &
  DeFiPositionsController['state'] &
  DelegationController['state'] &
  EnsController['state'] &
  GasFeeController['state'] &
  GatorPermissionsController['state'] &
  GeolocationController['state'] &
  KeyringController['state'] &
  LoggingController['state'] &
  MetaMetricsController['state'] &
  MetaMetricsDataDeletionController['state'] &
  MultichainAssetsController['state'] &
  MultichainAssetsRatesController['state'] &
  MultichainBalancesController['state'] &
  MultichainTransactionsController['state'] &
  MultichainNetworkController['state'] &
  NameController['state'] &
  NetworkController['state'] &
  NetworkOrderController['state'] &
  OnboardingController['state'] &
  PasskeyController['state'] &
  PermissionController<
    PermissionSpecificationConstraint,
    CaveatSpecificationConstraint
  >['state'] &
  PermissionLogController['state'] &
  PerpsController['state'] &
  PhishingController['state'] &
  PPOMController['state'] &
  PreferencesController['state'] &
  RatesController['state'] &
  RemoteFeatureFlagController['state'] &
  RewardsController['state'] &
  SeedlessOnboardingController<EncryptionKey>['state'] &
  SelectedNetworkController['state'] &
  ShieldController['state'] &
  SignatureController['state'] &
  SmartTransactionsController['state'] &
  SnapController['state'] &
  SnapInsightsController['state'] &
  SnapInterfaceController['state'] &
  SnapRegistryController['state'] &
  SubscriptionController['state'] &
  TokenBalancesController['state'] &
  TokenDetectionController['state'] &
  TokenListController['state'] &
  TokensController['state'] &
  StaticAssetsController['state'] &
  TransactionController['state'] &
  TransactionPayController['state'] &
  UserOperationController['state'] &
  UserStorageController['state'] &
  TokenRatesController['state'] &
  NftController['state'] &
  NftDetectionController['state'] &
  NetworkEnablementController['state'] &
  AccountTrackerController['state'] &
  ProfileMetricsController['state'];
