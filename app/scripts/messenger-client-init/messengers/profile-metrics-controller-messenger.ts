import { ProfileMetricsControllerMessenger } from '@metamask/profile-metrics-controller';
import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger restricted to the allowed actions and events of the
 * profile metrics controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getProfileMetricsControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<ProfileMetricsControllerMessenger>,
    MessengerEvents<ProfileMetricsControllerMessenger>
  >,
) {
  const controllerMessenger: ProfileMetricsControllerMessenger = new Messenger({
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
      'TransactionController:transactionSubmitted',
    ],
  });
  return controllerMessenger;
}
