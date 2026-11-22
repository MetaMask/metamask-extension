import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import { MultichainNetworkControllerMessenger } from '@metamask/multichain-network-controller';
import { RootMessenger } from '../../../lib/messenger';

/**
 * Get a restricted messenger for the Multichain Network controller. This is scoped to the
 * actions and events that the Multichain Network controller is allowed to handle.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getMultichainNetworkControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<MultichainNetworkControllerMessenger>,
    MessengerEvents<MultichainNetworkControllerMessenger>
  >,
): MultichainNetworkControllerMessenger {
  const controllerMessenger: MultichainNetworkControllerMessenger =
    new Messenger({
      namespace: 'MultichainNetworkController',
      parent: messenger,
    });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'NetworkController:setActiveNetwork',
      'NetworkController:getState',
      'NetworkController:removeNetwork',
      'NetworkController:findNetworkClientIdByChainId',
      'NetworkController:getSelectedChainId',
      'AccountsController:listMultichainAccounts',
    ],
    events: ['AccountsController:selectedAccountChange'],
  });
  return controllerMessenger;
}
