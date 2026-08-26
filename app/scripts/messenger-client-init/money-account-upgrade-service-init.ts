import {
  MoneyAccountUpgradeService,
  type MoneyAccountUpgradeServiceMessenger,
} from '../lib/money/money-account-upgrade-service';
import type { MessengerClientInitFunction } from './types';

/**
 * Initialize the MoneyAccountUpgradeService.
 *
 * The service drives the `MoneyAccountUpgradeController` bootstrap, so it
 * receives the controller instance directly — `init()` is not exposed as a
 * messenger action — and must be initialized after it.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the service.
 * @param request.getMessengerClient - Getter for initialized messenger clients.
 * @returns The initialized service.
 */
export const MoneyAccountUpgradeServiceInit: MessengerClientInitFunction<
  MoneyAccountUpgradeService,
  MoneyAccountUpgradeServiceMessenger
> = ({ controllerMessenger, getMessengerClient }) => {
  const messengerClient = new MoneyAccountUpgradeService({
    messenger: controllerMessenger,
    upgradeController: getMessengerClient('MoneyAccountUpgradeController'),
  });

  return {
    messengerClient,
    memStateKey: null,
    persistedStateKey: null,
  };
};
