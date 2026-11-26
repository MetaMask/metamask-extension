import { BrazeService, BrazeServiceMessenger } from '../services/braze-service';
import { MessengerClientInitFunction } from './types';

/**
 * Initialize the Braze service.
 *
 * The SDK runs in the preinstalled Braze snap, which the service reaches
 * through the `SnapController`. Only registered in builds with Braze
 * configuration.
 *
 * @param request - The init request.
 * @param request.controllerMessenger - The service messenger.
 * @returns The initialized service.
 */
export const BrazeServiceInit: MessengerClientInitFunction<
  BrazeService,
  BrazeServiceMessenger
> = ({ controllerMessenger }) => {
  const messengerClient = new BrazeService({
    messenger: controllerMessenger,
  });

  return {
    messengerClient,
    memStateKey: null,
    persistedStateKey: null,
  };
};
