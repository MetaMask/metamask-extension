import type { SyncBrazeUser } from '../../../shared/lib/braze';
import { isManifestV3 } from '../../../shared/lib/mv3.utils';
import { createBrazeHost } from '../../braze/braze-host';
import { createOffscreenBrazeClient } from '../../offscreen/braze-client';
import { BrazeService, BrazeServiceMessenger } from '../services/braze-service';
import { MessengerClientInitFunction } from './types';

/**
 * Initialize the Braze service.
 *
 * On MV3 the SDK runs in the offscreen document, so the service messages it.
 * On MV2 the background page is a DOM context, so the service calls the host
 * directly. Only registered in builds with Braze configuration.
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
