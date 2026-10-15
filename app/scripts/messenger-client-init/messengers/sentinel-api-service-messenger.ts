import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import type { SentinelApiServiceMessenger } from '@metamask/sentinel-api-service';
import type { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger for the SentinelApiService, rooted directly at the root
 * messenger so that action-handler registrations propagate to root.
 *
 * @param messenger - The root messenger.
 * @returns The SentinelApiService messenger.
 */
export function getSentinelApiServiceMessenger(
  messenger: RootMessenger<
    MessengerActions<SentinelApiServiceMessenger>,
    MessengerEvents<SentinelApiServiceMessenger>
  >,
): SentinelApiServiceMessenger {
  const serviceMessenger: SentinelApiServiceMessenger = new Messenger({
    namespace: 'SentinelApiService',
    parent: messenger,
  });

  messenger.delegate({
    messenger: serviceMessenger,
    actions: ['AuthenticationController:getBearerToken'],
  });

  return serviceMessenger;
}
