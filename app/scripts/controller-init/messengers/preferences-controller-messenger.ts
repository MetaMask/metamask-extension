import { Messenger } from '@metamask/base-controller';
import {
  AllowedActions,
  AllowedEvents,
} from '../../controllers/preferences-controller';

export type PreferencesControllerMessenger = ReturnType<
  typeof getPreferencesControllerMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * preferences controller.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getPreferencesControllerMessenger(
  messenger: Messenger<AllowedActions, AllowedEvents>,
) {
  return messenger.getRestricted({
    name: 'PreferencesController',
    allowedActions: [
      'AccountsController:setSelectedAccount',
      'AccountsController:getSelectedAccount',
      'AccountsController:getAccountByAddress',
      'AccountsController:setAccountName',
      'NetworkController:getState',
    ],
    allowedEvents: ['AccountsController:stateChange'],
  });
}
