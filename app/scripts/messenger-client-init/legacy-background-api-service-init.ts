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
 * @param request.infuraProjectId - The Infura project ID.
 * @param request.getRequestAccountTabIds - A function that returns a record of account tab IDs.
 * @param request.getOpenMetamaskTabsIds - A function that returns a record of open MetaMask tab IDs.
 * @param request.sendUpdate - A function to send updates to the UI.
 * @param request.seedlessOperationMutex - A mutex to use for seedless operations.
 * @param request.offscreenPromise - A promise that resolves when the offscreen document is ready.
 * @returns The initialized service.
 */
export const LegacyBackgroundApiServiceInit: MessengerClientInitFunction<
  LegacyBackgroundApiService,
  LegacyBackgroundApiServiceMessenger
> = ({
  controllerMessenger,
  infuraProjectId,
  getRequestAccountTabIds,
  getOpenMetamaskTabsIds,
  sendUpdate,
  seedlessOperationMutex,
  offscreenPromise,
}) => {
  const messengerClient = new LegacyBackgroundApiService({
    messenger: controllerMessenger,
    infuraProjectId,
    getRequestAccountTabIds,
    getOpenMetamaskTabsIds,
    sendUpdate,
    seedlessOperationMutex,
    offscreenPromise,
  });

  return {
    messengerClient,
    persistedStateKey: null,
    memStateKey: null,
  };
};
