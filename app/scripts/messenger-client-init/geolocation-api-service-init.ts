import {
  GeolocationApiService,
  Env,
  type GeolocationApiServiceMessenger,
} from '@metamask/geolocation-controller';
import { isProduction } from '../../../shared/lib/environment';
import type { MessengerClientInitFunction } from './types';

/**
 * Initialize the GeolocationApiService.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the service.
 * @returns The initialized service.
 */
export const GeolocationApiServiceInit: MessengerClientInitFunction<
  GeolocationApiService,
  GeolocationApiServiceMessenger
> = ({ controllerMessenger }) => {
  const env = isProduction() ? Env.PRD : Env.DEV;

  const messengerClient = new GeolocationApiService({
    messenger: controllerMessenger,
    env,
    fetch: fetch.bind(globalThis),
  });

  return { messengerClient, persistedStateKey: null, memStateKey: null };
};
