import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import type { MoneyAccountUpgradeControllerMessenger } from '@metamask/money-account-upgrade-controller';
import type { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger for the MoneyAccountUpgradeController
 *
 * @param messenger - The root messenger.
 * @returns The MoneyAccountUpgradeController messenger.
 */
export function getMoneyAccountUpgradeControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<MoneyAccountUpgradeControllerMessenger>,
    MessengerEvents<MoneyAccountUpgradeControllerMessenger>
  >,
): MoneyAccountUpgradeControllerMessenger {
  const controllerMessenger: MoneyAccountUpgradeControllerMessenger =
    new Messenger({
      namespace: 'MoneyAccountUpgradeController',
      parent: messenger,
    });

  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'AuthenticatedUserStorageService:createDelegation',
      'AuthenticatedUserStorageService:listDelegations',
      'ChompApiService:associateAddress',
      'ChompApiService:createIntents',
      'ChompApiService:createUpgrade',
      'ChompApiService:getAssociatedAddresses',
      'ChompApiService:getIntentsByAddress',
      'ChompApiService:getServiceDetails',
      'ChompApiService:verifyDelegation',
      'DelegationController:signDelegation',
      'KeyringController:signEip7702Authorization',
      'KeyringController:signPersonalMessage',
      'NetworkController:findNetworkClientIdByChainId',
      'NetworkController:getNetworkClientById',
    ],
    events: [],
  });

  return controllerMessenger;
}
