import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import type { RootMessenger } from '../../lib/messenger';
import type { AlertControllerMessenger } from '../../controllers/alert-controller';

/**
 * Create a messenger restricted to the allowed actions and events of the
 * alert controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getAlertControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<AlertControllerMessenger>,
    MessengerEvents<AlertControllerMessenger>
  >,
) {
  const alertControlerMessenger: AlertControllerMessenger = new Messenger({
    namespace: 'AlertController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: alertControlerMessenger,
    actions: ['AccountsController:getSelectedAccount'],
    events: ['AccountsController:selectedAccountChange'],
  });
  return alertControlerMessenger;
}
