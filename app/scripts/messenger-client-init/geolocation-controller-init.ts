import {
  GeolocationController,
  getDefaultGeolocationControllerState,
  UNKNOWN_LOCATION,
  type GeolocationControllerMessenger,
} from '@metamask/geolocation-controller';
import type { MessengerClientInitFunction } from './types';

/**
 * Initialize the GeolocationController.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state to hydrate from.
 * @returns The initialized controller.
 */
export const GeolocationControllerInit: MessengerClientInitFunction<
  GeolocationController,
  GeolocationControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const geolocationControllerState =
    persistedState.GeolocationController ??
    getDefaultGeolocationControllerState();

  const messengerClient = new GeolocationController({
    messenger: controllerMessenger,
    state: geolocationControllerState,
  });

  const hasKnownLocation =
    geolocationControllerState.location !== UNKNOWN_LOCATION &&
    geolocationControllerState.location !== '';

  if (!hasKnownLocation) {
    messengerClient.getGeolocation().catch(() => {
      // Best-effort fetch; errors are surfaced via controller state.
    });
  }

  return { messengerClient };
};
