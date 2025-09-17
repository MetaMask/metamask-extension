import { Messenger } from '@metamask/base-controller';
import {
  AllowedActions,
  AllowedEvents,
} from '../../controllers/app-state-controller';

export type AppStateControllerMessenger = ReturnType<
  typeof getAppStateControllerMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * app state controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getAppStateControllerMessenger(
  messenger: Messenger<AllowedActions, AllowedEvents>,
) {
  return messenger.getRestricted({
    name: 'AppStateController',
    allowedActions: [
      'ApprovalController:addRequest',
      'ApprovalController:acceptRequest',
      'KeyringController:getState',
      'PreferencesController:getState',
    ],
    allowedEvents: [
      'KeyringController:unlock',
      'PreferencesController:stateChange',
    ],
  });
}
