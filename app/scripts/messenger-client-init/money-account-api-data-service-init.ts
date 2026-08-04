import {
  Env,
  MoneyAccountApiDataService,
  type MoneyAccountApiDataServiceMessenger,
} from '@metamask/money-account-api-data-service';
import type { MessengerClientInitFunction } from './types';

/**
 * Initialize the MoneyAccountApiDataService.
 *
 * This is the Money API source behind
 * `MoneyAccountBalanceService:fetchBalanceWithFallback`. Without it registered,
 * the balance service's fallback calls an unregistered action and throws
 * instead of falling back.
 *
 * The service registers its own action handlers in its constructor and holds no
 * persisted or in-memory client state, so there is nothing to init.
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
