import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { AppStateControllerMessenger } from '../../controllers/app-state-controller';
import { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger restricted to the allowed actions and events of the
 * app state controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getAppStateControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<AppStateControllerMessenger>,
    MessengerEvents<AppStateControllerMessenger>
  >,
) {
  const appStateControllerMessenger: AppStateControllerMessenger =
    new Messenger({
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
      'ProfileMetricsController:skipInitialDelay',
    ],
    events: ['KeyringController:unlock', 'PreferencesController:stateChange'],
  });
  return appStateControllerMessenger;
}
