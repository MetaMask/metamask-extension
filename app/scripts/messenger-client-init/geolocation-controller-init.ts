import {
  GeolocationController,
  getDefaultGeolocationControllerState,
  type GeolocationControllerMessenger,
} from '@metamask/geolocation-controller';
import type { MessengerClientInitFunction } from './types';

/**
 * Initialize the GeolocationController.
 *
 * Geolocation is fetched on demand by consumers (e.g. PerpsController, the
 * `getGeolocation` / `refreshGeolocation` background API methods exposed
 * below) via the messenger, so this init does not trigger an eager fetch.
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
  const messengerClient = new GeolocationController({
    messenger: controllerMessenger,
    state:
      persistedState.GeolocationController ??
      getDefaultGeolocationControllerState(),
  });

  return {
    messengerClient,
    api: {
      getGeolocation: messengerClient.getGeolocation.bind(messengerClient),
      refreshGeolocation:
        messengerClient.refreshGeolocation.bind(messengerClient),
    },
  };
};
