import { Messenger } from '@metamask/messenger';
import {
  AllowedActions,
  AllowedEvents,
} from '../../controllers/alert-controller';
import { RootMessenger } from '../../lib/messenger';

export type AlertControllerMessenger = ReturnType<
  typeof getAlertControllerMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * alert controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getAlertControllerMessenger(messenger: RootMessenger) {
  const alertControlerMessenger = new Messenger<
    'AlertController',
    AllowedActions,
    AllowedEvents,
    typeof messenger
  >({
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
