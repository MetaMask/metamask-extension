import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import type { GeolocationControllerMessenger } from '@metamask/geolocation-controller';
import { RootMessenger } from '../../lib/messenger';

export type {
  GeolocationControllerActions,
  GeolocationControllerEvents,
} from '@metamask/geolocation-controller';

/**
 * Get the messenger for the GeolocationController. Delegates the
 * GeolocationApiService:fetchGeolocation action so the controller can
 * call the API service via the messenger.
 *
 * @param messenger - The root messenger.
 * @returns The GeolocationControllerMessenger.
 */
export function getGeolocationControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<GeolocationControllerMessenger>,
    MessengerEvents<GeolocationControllerMessenger>
  >,
): GeolocationControllerMessenger {
  const controllerMessenger: GeolocationControllerMessenger = new Messenger({
    namespace: 'GeolocationController',
    parent: messenger,
  });

  messenger.delegate({
    messenger: controllerMessenger,
    actions: ['GeolocationApiService:fetchGeolocation'],
  });

  return controllerMessenger;
}
