import { MultichainAccountService } from '@metamask/multichain-account-service';
import { GasFeeController } from '@metamask/gas-fee-controller';
import { KeyringController } from '@metamask/keyring-controller';
import { NetworkController } from '@metamask/network-controller';
import {
  CaveatSpecificationConstraint,
  PermissionController,
  PermissionSpecificationConstraint,
} from '@metamask/permission-controller';
import { PPOMController } from '@metamask/ppom-validator';
import SmartTransactionsController from '@metamask/smart-transactions-controller';
import { TransactionController } from '@metamask/transaction-controller';
import { AccountsController } from '@metamask/accounts-controller';
import {
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
import { MultichainNetworkController } from '@metamask/multichain-network-controller';
import { MultichainTransactionsController } from '@metamask/multichain-transactions-controller';
import {
  CronjobController,
  ExecutionService,
  JsonSnapsRegistry,
  SnapController,
  SnapInsightsController,
  SnapInterfaceController,
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
import OnboardingController from '../controllers/onboarding';
import { PreferencesController } from '../controllers/preferences-controller';
import SwapsController from '../controllers/swaps';
import { InstitutionalSnapController } from '../controllers/institutional-snap/InstitutionalSnapController';
import { NetworkOrderController } from '../controllers/network-order';
import OAuthService from '../services/oauth/oauth-service';
import MetaMetricsController from '../controllers/metametrics-controller';
import { SnapsNameProvider } from '../lib/SnapsNameProvider';
import AccountTrackerController from '../controllers/account-tracker-controller';

/**
 * Union of all controllers supporting or required by modular initialization.
 */
export type Controller =
  | AccountTrackerController
  | AuthenticationController
  | CronjobController
  | CurrencyRateController
  | DelegationController
  | DeFiPositionsController
  | EnsController
  | ExecutionService
  | GasFeeController
  | GatorPermissionsController
  | JsonSnapsRegistry
  | KeyringController
  | MetaMetricsController
  | MultichainAssetsController
  | MultichainAssetsRatesController
  | MultichainBalancesController
  | MultichainTransactionsController
  | MultichainNetworkController
  | NameController
  | NetworkController
  | NetworkOrderController
  | NotificationServicesController
  | NotificationServicesPushController
  | OAuthService
  | OnboardingController
  | PermissionController<
      PermissionSpecificationConstraint,
      CaveatSpecificationConstraint
    >
  | PPOMController
  | PreferencesController
  | RateLimitController<RateLimitedApiMap>
  | RatesController
  | SeedlessOnboardingController<EncryptionKey>
  | SelectedNetworkController
  | ShieldController
  | SmartTransactionsController
  | SnapController
  | SnapInterfaceController
  | SnapInsightsController
  | SubscriptionController
  | SnapsNameProvider
  | TokenBalancesController
  | TokenDetectionController
  | TokenListController
  | TokensController
  | TransactionController
  | InstitutionalSnapController
  | UserStorageController
  | TokenRatesController
  | NftController
  | NftDetectionController
  | AssetsContractController
  | AccountTreeController
  | WebSocketService
  | MultichainAccountService;

/**
 * Flat state object for all controllers supporting or required by modular initialization.
 * e.g. `{ transactions: [] }`.
 */
export type ControllerFlatState = AccountsController['state'] &
  AccountTreeController['state'] &
  AuthenticationController['state'] &
  CronjobController['state'] &
  CurrencyRateController['state'] &
  DeFiPositionsController['state'] &
  DelegationController['state'] &
  EnsController['state'] &
  GasFeeController['state'] &
  GatorPermissionsController['state'] &
  JsonSnapsRegistry['state'] &
  KeyringController['state'] &
  MetaMetricsController['state'] &
  MultichainAssetsController['state'] &
  MultichainAssetsRatesController['state'] &
  MultichainBalancesController['state'] &
  MultichainTransactionsController['state'] &
  MultichainNetworkController['state'] &
  NameController['state'] &
  NetworkController['state'] &
  NetworkOrderController['state'] &
  OnboardingController['state'] &
  PermissionController<
    PermissionSpecificationConstraint,
    CaveatSpecificationConstraint
  >['state'] &
  PPOMController['state'] &
  PreferencesController['state'] &
  RatesController['state'] &
  SeedlessOnboardingController<EncryptionKey>['state'] &
  SelectedNetworkController['state'] &
  ShieldController['state'] &
  SmartTransactionsController['state'] &
  SnapController['state'] &
  SnapInsightsController['state'] &
  SnapInterfaceController['state'] &
  SubscriptionController['state'] &
  TokenBalancesController['state'] &
  TokenDetectionController['state'] &
  TokenListController['state'] &
  TokensController['state'] &
  TransactionController['state'] &
  SwapsController['state'] &
  UserStorageController['state'] &
  TokenRatesController['state'] &
  NftController['state'] &
  NftDetectionController['state'] &
  RemoteFeatureFlagController['state'];
