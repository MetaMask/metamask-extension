import { BrazeService, BrazeServiceMessenger } from '../services/braze-service';
import { MessengerClientInitFunction } from './types';

/**
 * Initialize the Braze service. Only registered in MV3 builds with Braze
 * configuration; the SDK runs in the offscreen document.
 *
 * @param request - The init request.
 * @param request.controllerMessenger - The service messenger.
 * @param request.offscreenPromise - Resolves when the offscreen document is
 * ready.
 * @returns The initialized service.
 */
export const BrazeServiceInit: MessengerClientInitFunction<
  BrazeService,
  BrazeServiceMessenger
> = ({ controllerMessenger, offscreenPromise }) => {
  const messengerClient = new BrazeService({
    messenger: controllerMessenger,
    offscreenReady: offscreenPromise,
  });

  return {
    messengerClient,
    memStateKey: null,
    persistedStateKey: null,
  };
};
