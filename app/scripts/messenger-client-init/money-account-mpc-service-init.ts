import {
  MoneyAccountMpcService,
  type MoneyAccountMpcMessenger,
} from '../lib/money/money-account-mpc-service';
import type { MessengerClientInitFunction } from './types';

/**
 * Initialize the MoneyAccountMpcService.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the service.
 * @returns The initialized service.
 */
export const MoneyAccountMpcServiceInit: MessengerClientInitFunction<
  MoneyAccountMpcService,
  MoneyAccountMpcMessenger
> = ({ controllerMessenger }) => {
  const messengerClient = new MoneyAccountMpcService({
    messenger: controllerMessenger,
  });

  return {
    messengerClient,
    memStateKey: null,
    persistedStateKey: null,
  };
};
