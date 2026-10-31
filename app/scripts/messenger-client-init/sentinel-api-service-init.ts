import {
  SentinelApiService,
  type SentinelApiServiceMessenger,
} from '@metamask/sentinel-api-service';
import { setSentinelApiMessenger } from '../lib/transaction/sentinel-api';
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

  // Legacy Sentinel utils query the service via its messenger.
  setSentinelApiMessenger(controllerMessenger);

  return { messengerClient, persistedStateKey: null, memStateKey: null };
};
