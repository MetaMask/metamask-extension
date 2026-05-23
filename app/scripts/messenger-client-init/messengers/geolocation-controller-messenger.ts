import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import type { GeolocationControllerMessenger } from '@metamask/geolocation-controller';
import type { RootMessenger } from '../../lib/messenger';

export type {
  GeolocationControllerActions,
  GeolocationControllerEvents,
} from '@metamask/geolocation-controller';

/**
 * Get the messenger for the GeolocationController. Delegates the
 * GeolocationApiService:fetchGeolocation action so the controller can
 * call the API service via the messenger.
 *
 * @param rootMessenger - The root messenger.
 * @returns The GeolocationControllerMessenger.
 */
export function getGeolocationControllerMessenger(
  rootMessenger: RootMessenger<
    MessengerActions<GeolocationControllerMessenger>,
    MessengerEvents<GeolocationControllerMessenger>
  >,
): GeolocationControllerMessenger {
  const messenger = new Messenger<
    'GeolocationController',
    MessengerActions<GeolocationControllerMessenger>,
    MessengerEvents<GeolocationControllerMessenger>,
    typeof rootMessenger
  >({
    namespace: 'GeolocationController',
    parent: rootMessenger,
  });

  rootMessenger.delegate({
    messenger,
    actions: ['GeolocationApiService:fetchGeolocation'],
    events: [],
  });

  return messenger;
}
