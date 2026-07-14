import {
  SentinelApiService,
  type SentinelApiServiceMessenger,
} from '@metamask-previews/sentinel-api-service';
import type { MessengerClientInitFunction } from './types';

/**
 * Initialize the SentinelApiService.
 *
 * The `environment` option is intentionally omitted so the service defaults to
 * production (its default). The extension does not expose a Sentinel
 * environment toggle, so this preserves the previous behaviour.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the service.
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
