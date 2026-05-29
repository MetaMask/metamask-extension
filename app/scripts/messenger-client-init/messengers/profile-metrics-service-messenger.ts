import { ProfileMetricsServiceMessenger } from '@metamask/profile-metrics-controller';
import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger restricted to the allowed actions and events of the
 * profile metrics service.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getProfileMetricsServiceMessenger(
  messenger: RootMessenger<
    MessengerActions<ProfileMetricsServiceMessenger>,
    MessengerEvents<ProfileMetricsServiceMessenger>
  >,
): ProfileMetricsServiceMessenger {
  const serviceMessenger: ProfileMetricsServiceMessenger = new Messenger({
    namespace: 'ProfileMetricsService',
    parent: messenger,
  });
  messenger.delegate({
    messenger: serviceMessenger,
    actions: ['AuthenticationController:getBearerToken'],
  });
  return serviceMessenger;
}
