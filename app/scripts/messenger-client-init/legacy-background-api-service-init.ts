import {
  LegacyBackgroundApiService,
  LegacyBackgroundApiServiceMessenger,
} from '../services/legacy-background-api-service';
import { MessengerClientInitFunction } from './types';

/**
 * Initializes the background API service.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the service.
 * @returns The initialized service.
 */
export const LegacyBackgroundApiServiceInit: MessengerClientInitFunction<
  LegacyBackgroundApiService,
  LegacyBackgroundApiServiceMessenger
> = ({ controllerMessenger }) => {
  const messengerClient = new LegacyBackgroundApiService({
    messenger: controllerMessenger,
  });

  return {
    messengerClient,
    persistedStateKey: null,
    memStateKey: null,
  };
};
