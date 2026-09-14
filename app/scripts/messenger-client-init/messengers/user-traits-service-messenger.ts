import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { RootMessenger } from '../../lib/messenger';
import { UserTraitsServiceMessenger } from '../../services/user-traits-service';

/**
 * Create a messenger restricted to the allowed actions and events of the User
 * Traits Service.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getUserTraitsServiceMessenger(
  messenger: RootMessenger<
    MessengerActions<UserTraitsServiceMessenger>,
    MessengerEvents<UserTraitsServiceMessenger>
  >,
) {
  const userTraitsServiceMessenger: UserTraitsServiceMessenger = new Messenger({
    namespace: 'UserTraitsService',
    parent: messenger,
  });

  messenger.delegate({
    messenger: userTraitsServiceMessenger,
    actions: [
      'MetaMetricsController:getState',
      'SeedlessOnboardingController:getState',
    ],
  });

  return userTraitsServiceMessenger;
}
