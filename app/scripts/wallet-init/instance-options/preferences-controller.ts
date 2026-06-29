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
} from '../../controllers/preferences-controller';

/**
 * Overrides `@metamask/wallet`'s default `PreferencesController` with the
 * extension's diverging superset instead of converging to the package
 * controller: a config whose `name` matches a default replaces it.
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
      // The wallet types the root from its own `PreferencesController`, so the
      // superset's extra `PreferencesController:*` method actions aren't on the
      // parent and its `Parent` constraint rejects the child. (The delegated
      // `AccountsController` actions below already exist on the parent.)
      // TODO(MetaMask/core#9232): drop once the wallet types the root from the configured controller.
      parent: parent as unknown as RootMessenger<
        MessengerActions<PreferencesControllerMessenger>,
        MessengerEvents<PreferencesControllerMessenger>
      >,
    });

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
