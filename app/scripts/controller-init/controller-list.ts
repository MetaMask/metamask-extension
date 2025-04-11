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
import { TransactionUpdateController } from '@metamask-institutional/transaction-update';
import { AccountsController } from '@metamask/accounts-controller';
import {
  AssetsContractController,
  DeFiPositionsController,
  MultichainAssetsController,
  MultichainAssetsRatesController,
  MultichainBalancesController,
  NftController,
  NftDetectionController,
  TokenRatesController,
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
} from '@metamask/snaps-controllers';
import {
  RateLimitController,
  RateLimitedApiMap,
} from '@metamask/rate-limit-controller';
import { Controller as AuthenticationController } from '@metamask/profile-sync-controller/auth';
import { Controller as UserStorageController } from '@metamask/profile-sync-controller/user-storage';
import { Controller as NotificationServicesController } from '@metamask/notification-services-controller/notification-services';
import { Controller as NotificationServicesPushController } from '@metamask/notification-services-controller/push-services';

import OnboardingController from '../controllers/onboarding';
import { PreferencesController } from '../controllers/preferences-controller';
import SwapsController from '../controllers/swaps';
import { InstitutionalSnapController } from '../controllers/institutional-snap/InstitutionalSnapController';

/**
 * Union of all controllers supporting or required by modular initialization.
 */
export type Controller =
  | AuthenticationController
  | CronjobController
  | DeFiPositionsController
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
  DeFiPositionsController['state'] &
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
