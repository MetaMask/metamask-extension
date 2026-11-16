import type { SyncBrazeUser } from '../../../shared/lib/braze';
import { isManifestV3 } from '../../../shared/lib/mv3.utils';
import { createBrazeHost } from '../../braze/braze-host';
import { createOffscreenBrazeClient } from '../../offscreen/braze-client';
import { BrazeService, BrazeServiceMessenger } from '../services/braze-service';
import { MessengerClientInitFunction } from './types';

/**
 * Initialize the Braze service.
 *
 * Both platforms run the SDK in a dedicated worker. On MV3 the offscreen
 * document owns the worker; on MV2 the background page owns it. Only registered
 * in builds with Braze configuration.
 *
 * @param request - The init request.
 * @param request.controllerMessenger - The service messenger.
 * @param request.offscreenPromise - Resolves when the offscreen document is
 * ready. Only used on MV3.
 * @returns The initialized service.
 */
export const BrazeServiceInit: MessengerClientInitFunction<
  BrazeService,
  BrazeServiceMessenger
> = ({ controllerMessenger, offscreenPromise }) => {
  const syncUser: SyncBrazeUser = isManifestV3
    ? createOffscreenBrazeClient(offscreenPromise)
    : createBrazeHost();

  const messengerClient = new BrazeService({
    messenger: controllerMessenger,
    syncUser,
  });

  return {
    messengerClient,
    memStateKey: null,
    persistedStateKey: null,
  };
};
