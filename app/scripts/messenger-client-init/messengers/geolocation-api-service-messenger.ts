import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import type { GeolocationApiServiceMessenger } from '@metamask/geolocation-controller';
import type { RootMessenger } from '../../lib/messenger';

/**
 * Get the messenger for the GeolocationApiService. This is scoped to the
 * actions and events that the geolocation API service is allowed to handle.
 *
 * @param rootMessenger - The root messenger.
 * @returns The GeolocationApiServiceMessenger.
 */
export function getGeolocationApiServiceMessenger(
  rootMessenger: RootMessenger<
    MessengerActions<GeolocationApiServiceMessenger>,
    MessengerEvents<GeolocationApiServiceMessenger>
  >,
): GeolocationApiServiceMessenger {
  const messenger = new Messenger<
    'GeolocationApiService',
    MessengerActions<GeolocationApiServiceMessenger>,
    MessengerEvents<GeolocationApiServiceMessenger>,
    typeof rootMessenger
  >({
    namespace: 'GeolocationApiService',
    parent: rootMessenger,
  });
  return messenger;
}
