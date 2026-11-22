import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import { MultichainTransactionsControllerMessenger } from '@metamask/multichain-transactions-controller';
import { RootMessenger } from '../../../lib/messenger';

/**
 * Get a restricted messenger for the Multichain Transactions controller. This is scoped to the
 * actions and events that the Multichain Transactions controller is allowed to handle.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getMultichainTransactionsControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<MultichainTransactionsControllerMessenger>,
    MessengerEvents<MultichainTransactionsControllerMessenger>
  >,
): MultichainTransactionsControllerMessenger {
  const controllerMessenger: MultichainTransactionsControllerMessenger =
    new Messenger({
      namespace: 'MultichainTransactionsController',
      parent: messenger,
    });
  messenger.delegate({
    messenger: controllerMessenger,
    events: [
      'AccountsController:accountAdded',
      'AccountsController:accountRemoved',
      'AccountsController:accountTransactionsUpdated',
    ],
    actions: [
      'AccountsController:listMultichainAccounts',
      'SnapController:handleRequest',
      'KeyringController:getState',
    ],
  });
  return controllerMessenger;
}
