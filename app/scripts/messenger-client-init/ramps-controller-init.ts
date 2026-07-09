import {
  RampsController,
  getDefaultRampsControllerState,
  type RampsControllerMessenger,
} from '@metamask/ramps-controller';
import type { MessengerClientInitFunction } from './types';
import { getRampsControllerApi } from './ramps-controller-api';

function startRampsControllerLifecycle(messengerClient: RampsController) {
  messengerClient
    .init()
    .then(() => {
      messengerClient.startOrderPolling();
    })
    .catch((error) => {
      console.error('RampsController failed to initialize', error);
    });
}

/**
 * Initialize the RampsController.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state to hydrate from.
 * @returns The initialized controller and background API.
 */
export const RampsControllerInit: MessengerClientInitFunction<
  RampsController,
  RampsControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const messengerClient = new RampsController({
    messenger: controllerMessenger,
    state: persistedState.RampsController ?? getDefaultRampsControllerState(),
  });

  startRampsControllerLifecycle(messengerClient);

  return {
    messengerClient,
    api: getRampsControllerApi(messengerClient),
  };
};
