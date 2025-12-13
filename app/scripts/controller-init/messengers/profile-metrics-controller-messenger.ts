import { ProfileMetricsControllerMessenger } from '@metamask/profile-metrics-controller';
import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { RootMessenger } from '../../lib/messenger';

type AllowedActions = MessengerActions<ProfileMetricsControllerMessenger>;

type AllowedEvents = MessengerEvents<ProfileMetricsControllerMessenger>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * accounts controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getProfileMetricsControllerMessenger(
  messenger: RootMessenger<AllowedActions, AllowedEvents>,
) {
  const controllerMessenger = new Messenger<
    'ProfileMetricsController',
    AllowedActions,
    AllowedEvents,
    typeof messenger
  >({
    namespace: 'ProfileMetricsController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'AccountsController:getState',
      'ProfileMetricsService:submitMetrics',
    ],
    events: [
      'AccountsController:accountAdded',
      'AccountsController:accountRemoved',
      'KeyringController:lock',
      'KeyringController:unlock',
    ],
  });
  return controllerMessenger;
}
