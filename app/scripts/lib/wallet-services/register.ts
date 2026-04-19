/**
 * Registers all wallet-services modules as Messenger action handlers.
 *
 * Call once at background startup (before MetamaskController constructor).
 * After this runs, callers invoke module actions directly via the Messenger
 * without going through MetamaskController.
 *
 * Extension-specific glue: passes the extension's RootMessenger to each
 * platform-agnostic module. Each module defines its own minimal structural
 * messenger type — RootMessenger satisfies all of them at runtime, but the
 * TypeScript types diverge because some new action names are not yet in
 * RootMessenger's allowed-actions union. The `as never` cast here is the
 * single centralised acknowledgement of that gap; it does not affect runtime
 * behaviour. Remove it once the module action names are added to RootMessenger.
 *
 * TODO: Add VaultManagement/AccountManagement/etc. action names to
 * RootMessenger's AllowedActions union so the cast is no longer needed.
 */
import type { RootMessenger } from '../messenger';
import { registerActions as registerVaultActions } from './vault-management';
import { registerActions as registerAccountActions } from './account-management';
import { registerActions as registerPermissionActions } from './permission-management';
import { registerActions as registerTransactionActions } from './transaction-lifecycle';
import { registerActions as registerTokenActions } from './token-resolution';
import { registerActions as registerSnapActions } from './snap-management';

export function registerWalletServices(messenger: RootMessenger): void {
  // Cast: RootMessenger satisfies each module's structural messenger type at
  // runtime. The TypeScript types diverge only because the new module action
  // names have not yet been added to RootMessenger's allowed-actions union.
  const m = messenger as never;
  registerVaultActions(m);
  registerAccountActions(m);
  registerPermissionActions(m);
  registerTransactionActions(m);
  registerTokenActions(m);
  registerSnapActions(m);
}
