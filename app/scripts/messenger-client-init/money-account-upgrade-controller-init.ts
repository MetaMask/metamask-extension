import {
  MoneyAccountUpgradeController,
  type MoneyAccountUpgradeControllerMessenger,
} from '@metamask/money-account-upgrade-controller';
import type { MessengerClientInitFunction } from './types';

/**
 * Initialize the MoneyAccountUpgradeController.
 *
 * Construction only restores the persisted upgrade records; the controller is
 * inert until `MoneyAccountUpgradeService` runs its `init()` bootstrap once
 * the feature flags and an unlocked wallet allow it.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state to restore.
 * @returns The initialized controller.
 */
export const MoneyAccountUpgradeControllerInit: MessengerClientInitFunction<
  MoneyAccountUpgradeController,
  MoneyAccountUpgradeControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const messengerClient = new MoneyAccountUpgradeController({
    messenger: controllerMessenger,
    state: persistedState.MoneyAccountUpgradeController,
  });

  return { messengerClient };
};
