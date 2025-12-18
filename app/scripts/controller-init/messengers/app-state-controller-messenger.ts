import { Messenger } from '@metamask/messenger';
import {
  AllowedActions,
  AllowedEvents,
} from '../../controllers/app-state-controller';
import { RootMessenger } from '../../lib/messenger';

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
export function getAppStateControllerMessenger(messenger: RootMessenger) {
  const appStateControllerMessenger = new Messenger<
    'AppStateController',
    AllowedActions,
    AllowedEvents,
    RootMessenger
  >({
    namespace: 'AppStateController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: appStateControllerMessenger,
    actions: [
      'ApprovalController:addRequest',
      'ApprovalController:acceptRequest',
      'KeyringController:getState',
      'PreferencesController:getState',
    ],
    events: ['KeyringController:unlock', 'PreferencesController:stateChange'],
  });
  return appStateControllerMessenger;
}
