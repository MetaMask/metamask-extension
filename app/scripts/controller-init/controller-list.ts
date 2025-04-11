import type { TransactionUpdateController } from '@metamask-institutional/transaction-update';
import type { AccountsController } from '@metamask/accounts-controller';
import type {
  AssetsContractController,
  MultichainAssetsController,
  MultichainAssetsRatesController,
  MultichainBalancesController,
  NftController,
  NftDetectionController,
  TokenRatesController,
} from '@metamask/assets-controllers';
import type { GasFeeController } from '@metamask/gas-fee-controller';
import type { KeyringController } from '@metamask/keyring-controller';
import type { MultichainNetworkController } from '@metamask/multichain-network-controller';
import type { MultichainTransactionsController } from '@metamask/multichain-transactions-controller';
import type { NetworkController } from '@metamask/network-controller';
import type { Controller as NotificationServicesController } from '@metamask/notification-services-controller/notification-services';
import type { Controller as NotificationServicesPushController } from '@metamask/notification-services-controller/push-services';
import type {
  CaveatSpecificationConstraint,
  PermissionController,
  PermissionSpecificationConstraint,
} from '@metamask/permission-controller';
import type { PPOMController } from '@metamask/ppom-validator';
import type { Controller as AuthenticationController } from '@metamask/profile-sync-controller/auth';
import type { Controller as UserStorageController } from '@metamask/profile-sync-controller/user-storage';
import type {
  RateLimitController,
  RateLimitedApiMap,
} from '@metamask/rate-limit-controller';
// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import type SmartTransactionsController from '@metamask/smart-transactions-controller';
import type { TransactionController } from '@metamask/transaction-controller';
import type {
  CronjobController,
  ExecutionService,
  JsonSnapsRegistry,
  SnapController,
  SnapInsightsController,
  SnapInterfaceController,
} from '@metamask/snaps-controllers';

import type { InstitutionalSnapController } from '../controllers/institutional-snap/InstitutionalSnapController';
// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import type OnboardingController from '../controllers/onboarding';
import type { PreferencesController } from '../controllers/preferences-controller';
// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import type SwapsController from '../controllers/swaps';

/**
 * Union of all controllers supporting or required by modular initialization.
 */
export type Controller =
  | AuthenticationController
  | CronjobController
  | ExecutionService
  | GasFeeController
  | JsonSnapsRegistry
  | KeyringController
  | MultichainAssetsController
  | MultichainAssetsRatesController
  | MultichainBalancesController
  | MultichainTransactionsController
  | MultichainNetworkController
  | NetworkController
  | NotificationServicesController
  | NotificationServicesPushController
  | OnboardingController
  | PermissionController<
      PermissionSpecificationConstraint,
      CaveatSpecificationConstraint
    >
  | PPOMController
  | PreferencesController
  | RateLimitController<RateLimitedApiMap>
  | SmartTransactionsController
  | SnapController
  | SnapInterfaceController
  | SnapInsightsController
  | TransactionController
  | (TransactionUpdateController & {
      name: 'TransactionUpdateController';
      state: Record<string, unknown>;
    })
  | InstitutionalSnapController
  | UserStorageController
  | TokenRatesController
  | NftController
  | NftDetectionController
  | AssetsContractController;

/**
 * Flat state object for all controllers supporting or required by modular initialization.
 * e.g. `{ transactions: [] }`.
 */
export type ControllerFlatState = AccountsController['state'] &
  AuthenticationController['state'] &
  CronjobController['state'] &
  GasFeeController['state'] &
  JsonSnapsRegistry['state'] &
  KeyringController['state'] &
  MultichainAssetsController['state'] &
  MultichainAssetsRatesController['state'] &
  MultichainBalancesController['state'] &
  MultichainTransactionsController['state'] &
  MultichainNetworkController['state'] &
  NetworkController['state'] &
  OnboardingController['state'] &
  PermissionController<
    PermissionSpecificationConstraint,
    CaveatSpecificationConstraint
  >['state'] &
  PPOMController['state'] &
  PreferencesController['state'] &
  SmartTransactionsController['state'] &
  SnapController['state'] &
  SnapInsightsController['state'] &
  SnapInterfaceController['state'] &
  TransactionController['state'] &
  SwapsController['state'] &
  UserStorageController['state'] &
  TokenRatesController['state'] &
  NftController['state'] &
  NftDetectionController['state'];
