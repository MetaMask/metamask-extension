import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { PreferencesControllerMessenger } from '../../controllers/preferences-controller';
import { RootMessenger } from '../../lib/messenger';
/**
 * Create a messenger with delegated actions and events of the
 * preferences controller.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The controller messenger.
 */
export function getPreferencesControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<PreferencesControllerMessenger>,
    MessengerEvents<PreferencesControllerMessenger>
  >,
) {
  const preferencesControllerMessenger: PreferencesControllerMessenger =
    new Messenger({
      namespace: 'PreferencesController',
      parent: messenger,
    });
  messenger.delegate({
    messenger: preferencesControllerMessenger,
    actions: [
      'AccountsController:getAccountByAddress',
      'AccountsController:setAccountName',
    ],
  });
  return preferencesControllerMessenger;
}
