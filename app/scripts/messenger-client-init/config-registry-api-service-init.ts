import {
  ConfigRegistryApiService,
  ConfigRegistryApiServiceMessenger,
} from '@metamask/config-registry-controller';
import { loadAuthenticationConfig } from '../../../shared/lib/authentication';
import { MessengerClientInitFunction } from './types';

/**
 * Initialize ConfigRegistryAPIService.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the service.
 * @returns The initialized controller.
 */
export const ConfigRegistryApiServiceInit: MessengerClientInitFunction<
  ConfigRegistryApiService,
  ConfigRegistryApiServiceMessenger
> = ({ controllerMessenger }) => {
  // The environment must be the same used by AuthenticationController.
  const env = loadAuthenticationConfig();

  const messengerClient = new ConfigRegistryApiService({
    messenger: controllerMessenger,
    fetch: fetch.bind(globalThis),
    env,
  });

  return {
    persistedStateKey: null,
    memStateKey: null,
    messengerClient,
  };
};
