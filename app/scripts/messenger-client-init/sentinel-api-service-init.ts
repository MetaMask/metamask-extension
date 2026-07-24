import {
  SentinelApiService,
  type SentinelApiServiceMessenger,
} from '@metamask/sentinel-api-service';
import type { MessengerClientInitFunction } from './types';

/**
 * Initialize the SentinelApiService.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The SentinelApiService messenger.
 * @returns The initialized service.
 */
export const SentinelApiServiceInit: MessengerClientInitFunction<
  SentinelApiService,
  SentinelApiServiceMessenger
> = ({ controllerMessenger }) => {
  const messengerClient = new SentinelApiService({
    messenger: controllerMessenger,
    fetch: fetch.bind(globalThis),
    clientId: 'extension',
    clientVersion: process.env.METAMASK_VERSION,
  });

  return { messengerClient, persistedStateKey: null, memStateKey: null };
};
