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
  MultichainAssetsController,
  MultichainAssetsRatesController,
  MultichainBalancesController,
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
import OnboardingController from '../controllers/onboarding';
import { PreferencesController } from '../controllers/preferences-controller';
import SwapsController from '../controllers/swaps';

/**
 * Union of all controllers supporting or required by modular initialization.
 */
export type Controller =
  | CronjobController
  | ExecutionService
  | GasFeeController
  | JsonSnapsRegistry
  | KeyringController
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  | MultichainAssetsController
  | MultichainAssetsRatesController
  | MultichainBalancesController
  | MultichainTransactionsController
  ///: END:ONLY_INCLUDE_IF
  | MultichainNetworkController
  | NetworkController
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
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  | (TransactionUpdateController & {
      name: 'TransactionUpdateController';
      state: Record<string, unknown>;
    });
///: END:ONLY_INCLUDE_IF

/**
 * Flat state object for all controllers supporting or required by modular initialization.
 * e.g. `{ transactions: [] }`.
 */
export type ControllerFlatState = AccountsController['state'] &
  CronjobController['state'] &
  GasFeeController['state'] &
  JsonSnapsRegistry['state'] &
  KeyringController['state'] &
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  MultichainAssetsController['state'] &
  MultichainAssetsRatesController['state'] &
  MultichainBalancesController['state'] &
  MultichainTransactionsController['state'] &
  ///: END:ONLY_INCLUDE_IF
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
  SwapsController['state'];
