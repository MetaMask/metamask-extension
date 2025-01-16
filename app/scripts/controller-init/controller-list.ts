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
import OnboardingController from '../controllers/onboarding';
import { PreferencesController } from '../controllers/preferences-controller';
import SwapsController from '../controllers/swaps';

/**
 * Union of all controllers.
 */
export type Controller =
  | GasFeeController
  | KeyringController
  | NetworkController
  | OnboardingController
  | PermissionController<
      PermissionSpecificationConstraint,
      CaveatSpecificationConstraint
    >
  | PPOMController
  | PreferencesController
  | SmartTransactionsController
  | TransactionController
  | (TransactionUpdateController & {
      name: 'TransactionUpdateController';
      state: Record<string, unknown>;
    });

/**
 * Flat state object for all controllers.
 * e.g. `{ transactions: [] }`.
 */
export type ControllerFlatState = AccountsController['state'] &
  GasFeeController['state'] &
  KeyringController['state'] &
  NetworkController['state'] &
  OnboardingController['state'] &
  PermissionController<
    PermissionSpecificationConstraint,
    CaveatSpecificationConstraint
  >['state'] &
  PPOMController['state'] &
  PreferencesController['state'] &
  SmartTransactionsController['state'] &
  TransactionController['state'] &
  SwapsController['state'];
