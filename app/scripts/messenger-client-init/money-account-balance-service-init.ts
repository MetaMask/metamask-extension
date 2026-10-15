import {
  MoneyAccountBalanceService,
  type MoneyAccountBalanceServiceMessenger,
} from '@metamask/money-account-balance-service';
import type { MessengerClientInitFunction } from './types';

/**
 * Initialize the MoneyAccountBalanceService.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the service.
 * @returns The initialized service.
 */
export const MoneyAccountBalanceServiceInit: MessengerClientInitFunction<
  MoneyAccountBalanceService,
  MoneyAccountBalanceServiceMessenger
> = ({ controllerMessenger }) => {
  const messengerClient = new MoneyAccountBalanceService({
    messenger: controllerMessenger,
  });

  messengerClient.init();

  return { messengerClient, persistedStateKey: null, memStateKey: null };
};
