import {
  BackgroundApiService,
  BackgroundApiServiceMessenger,
} from '../services/background-api-service';
import { MessengerClientInitFunction } from './types';

/**
 * Initializes the background API service.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the service.
 * @returns The initialized service.
 */
export const BackgroundApiServiceInit: MessengerClientInitFunction<
  BackgroundApiService,
  BackgroundApiServiceMessenger
> = ({ controllerMessenger }) => {
  const controller = new BackgroundApiService({
    messenger: controllerMessenger,
  });

  return {
    controller,
    persistedStateKey: null,
  };
};
