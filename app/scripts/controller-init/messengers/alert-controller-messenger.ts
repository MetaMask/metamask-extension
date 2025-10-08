import { Messenger } from '@metamask/base-controller';
import {
  AllowedActions,
  AllowedEvents,
} from '../../controllers/alert-controller';

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
export function getAlertControllerMessenger(
  messenger: Messenger<AllowedActions, AllowedEvents>,
) {
  return messenger.getRestricted({
    name: 'AlertController',
    allowedActions: ['AccountsController:getSelectedAccount'],
    allowedEvents: ['AccountsController:selectedAccountChange'],
  });
}
