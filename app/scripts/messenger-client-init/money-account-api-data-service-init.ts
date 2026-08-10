import {
  Env,
  MoneyAccountApiDataService,
  type MoneyAccountApiDataServiceMessenger,
} from '@metamask/money-account-api-data-service';
import type { MessengerClientInitFunction } from './types';

/**
 * Initialize the MoneyAccountApiDataService.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the service.
 * @returns The initialized service.
 */
export const MoneyAccountApiDataServiceInit: MessengerClientInitFunction<
  MoneyAccountApiDataService,
  MoneyAccountApiDataServiceMessenger
> = ({ controllerMessenger }) => {
  const messengerClient = new MoneyAccountApiDataService({
    messenger: controllerMessenger,
    env: Env.PRD,
  });

  return { messengerClient, persistedStateKey: null, memStateKey: null };
};
