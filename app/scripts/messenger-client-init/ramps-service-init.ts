import {
  RampsService,
  type RampsServiceMessenger,
} from '@metamask/ramps-controller';
import type { MessengerClientInitFunction } from './types';
import { getRampsEnvironment } from './ramps-environment';

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
    context: 'extension',
    fetch: globalThis.fetch.bind(globalThis),
  });

  return { messengerClient, persistedStateKey: null, memStateKey: null };
};
