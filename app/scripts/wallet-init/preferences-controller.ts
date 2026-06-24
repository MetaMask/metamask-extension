import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import type {
  InitializationConfiguration,
  RootMessenger,
} from '@metamask/wallet';
import {
  PreferencesController,
  type PreferencesControllerMessenger,
} from '../controllers/preferences-controller';

/**
 * Initialization configuration that overrides `@metamask/wallet`'s default
 * `PreferencesController` with the extension's diverging superset controller
 * (see MetaMask/core#9232).
 *
 * The wallet wires the package `@metamask/preferences-controller` by default.
 * The extension instead runs a superset at
 * `app/scripts/controllers/preferences-controller.ts` (extra top-level fields, a
 * nested `preferences` object, a `referrals` map, extra messenger actions, and
 * two `AccountsController` dependencies). A configuration whose `name` matches a
 * default controller replaces that default, so the wallet constructs the
 * superset instead of the package controller without any state convergence.
 *
 * Initial state (the `currentLocale` default plus persisted state) is seeded via
 * `WalletOptions.state.PreferencesController` in `initializeWallet`, mirroring
 * the prior standalone init.
 */
export const preferencesControllerConfiguration: InitializationConfiguration<
  PreferencesController,
  PreferencesControllerMessenger
> = {
  name: 'PreferencesController',
  init: ({ state, messenger }) =>
    new PreferencesController({ state, messenger }),
  getMessenger: (parent) => {
    const messenger: PreferencesControllerMessenger = new Messenger({
      namespace: 'PreferencesController',
      // The wallet types its root `PreferencesController` actions from the
      // package controller, but the shared root routes the superset's actions at
      // runtime. Cast so the child can auto-delegate its (superset) namespace
      // actions to the root, mirroring the prior standalone messenger factory.
      parent: parent as unknown as RootMessenger<
        MessengerActions<PreferencesControllerMessenger>,
        MessengerEvents<PreferencesControllerMessenger>
      >,
    });

    // The superset controller calls these `AccountsController` actions; keep the
    // allowlist exactly what it uses. `AccountsController` is a wallet default,
    // so these actions are available on the shared root messenger.
    parent.delegate({
      messenger,
      actions: [
        'AccountsController:getAccountByAddress',
        'AccountsController:setAccountName',
      ],
    });

    return messenger;
  },
};
