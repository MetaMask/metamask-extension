import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import type { SentinelApiServiceMessenger } from '@metamask-previews/sentinel-api-service';
import { RootMessenger } from '../../lib/messenger';

/**
 * Get the messenger for the SentinelApiService. This is scoped to the actions
 * and events that the Sentinel API service is allowed to handle.
 *
 * The service authenticates its requests best-effort via the
 * `AuthenticationController:getBearerToken` action, so that action is delegated
 * to the service's messenger from the root messenger.
 *
 * @param messenger - The root messenger.
 * @returns The SentinelApiServiceMessenger.
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
