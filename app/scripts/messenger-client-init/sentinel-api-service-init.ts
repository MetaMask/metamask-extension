import { Messenger } from '@metamask/messenger';
import {
  SentinelApiService,
  type SentinelApiServiceMessenger,
} from '@metamask-previews/sentinel-api-service';
import type { TransactionControllerInitMessenger } from '../wallet-init/messengers/transaction-controller-messenger';
import type { MessengerClientInitFunction } from './types';

/**
 * Initialize the SentinelApiService.
 *
 * The service messenger is derived from the `transactionControllerInitMessenger`
 * rather than a dedicated sentinel messenger, since the transaction controller
 * init messenger already has all required `SentinelApiService:*` actions
 * delegated to it.
 *
 * The `environment` option is intentionally omitted so the service defaults to
 * production (its default). The extension does not expose a Sentinel
 * environment toggle, so this preserves the previous behaviour.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The transaction controller init messenger.
 * @returns The initialized service.
 */
export const SentinelApiServiceInit: MessengerClientInitFunction<
  SentinelApiService,
  TransactionControllerInitMessenger
> = ({ controllerMessenger }) => {
  const serviceMessenger: SentinelApiServiceMessenger = new Messenger({
    namespace: 'SentinelApiService',
    parent: controllerMessenger,
  });

  const messengerClient = new SentinelApiService({
    messenger: serviceMessenger,
    fetch: fetch.bind(globalThis),
    clientId: 'extension',
    clientVersion: process.env.METAMASK_VERSION,
  });

  return { messengerClient, persistedStateKey: null, memStateKey: null };
};
