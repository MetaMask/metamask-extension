/**
 * Registers all wallet-services modules as Messenger action handlers.
 *
 * Call once at background startup (before MetamaskController constructor).
 * After this runs, callers invoke module actions directly via the Messenger
 * without going through MetamaskController.
 *
 * Each module's `registerActionHandler` calls are routed through a child
 * Messenger with the module's own namespace (e.g. 'VaultManagement'). This
 * satisfies the Messenger's requirement that action names be prefixed by the
 * registering messenger's namespace. The child delegates back to the root so
 * that callers on the root can dispatch module actions normally.
 *
 * `call()` inside each module's handler implementations is routed through the
 * root messenger, which has access to all registered controllers.
 *
 * TODO: Add VaultManagement/AccountManagement/etc. action names to
 * RootMessenger's AllowedActions union so the `as never` casts are no longer
 * needed.
 */
import { Messenger } from '@metamask/messenger';
import type { RootMessenger } from '../messenger';
import { registerActions as registerVaultActions } from './vault-management';
import { registerActions as registerAccountActions } from './account-management';
import { registerActions as registerPermissionActions } from './permission-management';
import { registerActions as registerTransactionActions } from './transaction-lifecycle';
import { registerActions as registerTokenActions } from './token-resolution';
import { registerActions as registerSnapActions } from './snap-management';

/**
 * Creates a hybrid messenger for a wallet-services module.
 *
 * `registerActionHandler` is routed through a child Messenger whose namespace
 * matches the module, satisfying the Messenger's namespace check. The child
 * delegates registered handlers to the root so they are callable from anywhere
 * on the root. `call` is routed through the root messenger, giving handler
 * implementations access to all registered controller actions.
 *
 * @param rootMessenger - The application root messenger.
 * @param namespace - The module namespace (e.g. 'VaultManagement').
 * @returns A messenger-shaped object suitable for passing to `registerActions`.
 */
function makeModuleMessenger(
  rootMessenger: RootMessenger,
  namespace: string,
): never {
  const child = new Messenger({ namespace, parent: rootMessenger as never });
  return {
    call: (...args: unknown[]) =>
      (rootMessenger as unknown as { call: (...a: unknown[]) => unknown }).call(
        ...args,
      ),
    registerActionHandler: (
      name: string,
      handler: (...args: never[]) => unknown,
    ) => child.registerActionHandler(name as never, handler),
  } as never;
}

export function registerWalletServices(messenger: RootMessenger): void {
  registerVaultActions(makeModuleMessenger(messenger, 'VaultManagement'));
  registerAccountActions(makeModuleMessenger(messenger, 'AccountManagement'));
  registerPermissionActions(
    makeModuleMessenger(messenger, 'PermissionManagement'),
  );
  registerTransactionActions(
    makeModuleMessenger(messenger, 'TransactionLifecycle'),
  );
  registerTokenActions(makeModuleMessenger(messenger, 'TokenResolution'));
  registerSnapActions(makeModuleMessenger(messenger, 'SnapManagement'));
}
