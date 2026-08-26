import {
  MoneyAccountUpgradeService,
  type MoneyAccountUpgradeServiceMessenger,
} from '../lib/money/money-account-upgrade-service';
import type { MessengerClientInitFunction } from './types';

/**
 * Initialize the MoneyAccountUpgradeService.
 *
 * Must run after the MoneyAccountUpgradeController, which it drives.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the service.
 * @param request.getMessengerClient - Retrieves the upgrade controller.
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
