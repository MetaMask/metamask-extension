import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import type { GeolocationApiServiceMessenger } from '@metamask/geolocation-controller';
import { RootMessenger } from '../../lib/messenger';

/**
 * Get the messenger for the GeolocationApiService. This is scoped to the
 * actions and events that the geolocation API service is allowed to handle.
 *
 * @param messenger - The root messenger.
 * @returns The GeolocationApiServiceMessenger.
 */
export function getGeolocationApiServiceMessenger(
  messenger: RootMessenger<
    MessengerActions<GeolocationApiServiceMessenger>,
    MessengerEvents<GeolocationApiServiceMessenger>
  >,
): GeolocationApiServiceMessenger {
  const serviceMessenger: GeolocationApiServiceMessenger = new Messenger({
    namespace: 'GeolocationApiService',
    parent: messenger,
  });
  return serviceMessenger;
}
