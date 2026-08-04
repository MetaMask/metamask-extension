import {
  MoneyAccountBalanceService,
  type MoneyAccountBalanceServiceMessenger,
} from '@metamask/money-account-balance-service';
import type { MessengerClientInitFunction } from './types';

/**
 * Initialize the MoneyAccountBalanceService.
 *
 * The service is not persisted, and `init` must be called once the
 * `RemoteFeatureFlagController:getState` action is registered so the vault
 * config can be read. Until the `moneyAccountVaultConfig` flag is served, the
 * service methods reject with `VaultConfigNotAvailableError`.
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
