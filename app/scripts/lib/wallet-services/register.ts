/**
 * Registers all wallet-services modules as Messenger action handlers.
 *
 * Call once at background startup (before MetamaskController constructor).
 * After this runs, callers invoke module actions directly via the Messenger
 * without going through MetamaskController.
 */
import type { RootMessenger } from '../messenger';
import { registerActions as registerVaultActions } from './vault-management';
import { registerActions as registerAccountActions } from './account-management';
import { registerActions as registerPermissionActions } from './permission-management';
import { registerActions as registerTransactionActions } from './transaction-lifecycle';
import { registerActions as registerTokenActions } from './token-resolution';
import { registerActions as registerSnapActions } from './snap-management';

export function registerWalletServices(messenger: RootMessenger): void {
  registerVaultActions(messenger);
  registerAccountActions(messenger);
  registerPermissionActions(messenger);
  registerTransactionActions(messenger);
  registerTokenActions(messenger);
  registerSnapActions(messenger);
}
