import {
  RampsService,
  type RampsServiceMessenger,
} from '@metamask/ramps-controller';
import { getRampsEnvironment } from '../../../shared/lib/ramps/environment';
import type { MessengerClientInitFunction } from './types';

/**
 * Initialize the RampsService.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the service.
 * @returns The initialized service.
 */
export const RampsServiceInit: MessengerClientInitFunction<
  RampsService,
  RampsServiceMessenger
> = ({ controllerMessenger }) => {
  const messengerClient = new RampsService({
    messenger: controllerMessenger,
    environment: getRampsEnvironment(),
    context: 'browser',
    fetch: globalThis.fetch.bind(globalThis),
    // Sent as clientProduct/clientVersion query params so the on-ramp API
    // can version-gate features per client. Headers are not used for gating.
    clientProduct: 'metamask-extension',
    clientVersion: process.env.METAMASK_VERSION,
  });

  return { messengerClient, persistedStateKey: null, memStateKey: null };
};
