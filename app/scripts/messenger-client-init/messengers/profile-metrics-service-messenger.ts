import { ProfileMetricsServiceMessenger } from '@metamask/profile-metrics-controller';
import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { RootMessenger } from '../../lib/messenger';

type AllowedActions = MessengerActions<ProfileMetricsServiceMessenger>;

type AllowedEvents = MessengerEvents<ProfileMetricsServiceMessenger>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * accounts controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getProfileMetricsServiceMessenger(
  messenger: RootMessenger<AllowedActions, AllowedEvents>,
): ProfileMetricsServiceMessenger {
  const serviceMessenger = new Messenger<
    'ProfileMetricsService',
    AllowedActions,
    AllowedEvents,
    typeof messenger
  >({
    namespace: 'ProfileMetricsService',
    parent: messenger,
  });
  messenger.delegate({
    messenger: serviceMessenger,
    actions: ['AuthenticationController:getBearerToken'],
  });
  return serviceMessenger;
}
