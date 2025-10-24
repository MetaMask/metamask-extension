import { Messenger } from '@metamask/messenger';
import {
  AllowedActions,
  AllowedEvents,
} from '../../controllers/preferences-controller';
import { RootMessenger } from '../../lib/messenger';

export type PreferencesControllerMessenger = ReturnType<
  typeof getPreferencesControllerMessenger
>;

/**
 * Create a messenger with delegated actions and events of the
 * preferences controller.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The controller messenger.
 */
export function getPreferencesControllerMessenger(
  messenger: RootMessenger<AllowedActions, AllowedEvents>,
) {
  const preferencesControllerMessenger = new Messenger<
    'PreferencesController',
    AllowedActions,
    AllowedEvents,
    typeof messenger
  >({
    namespace: 'PreferencesController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: preferencesControllerMessenger,
    actions: [
      'AccountsController:setSelectedAccount',
      'AccountsController:getSelectedAccount',
      'AccountsController:getAccountByAddress',
      'AccountsController:setAccountName',
      'NetworkController:getState',
    ],
    events: ['AccountsController:stateChange'],
  });
  return preferencesControllerMessenger;
}
