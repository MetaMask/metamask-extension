import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { GatorPermissionsControllerMessenger } from '@metamask/gator-permissions-controller';
import { RootMessenger } from '../../../lib/messenger';

/**
 * Get a restricted messenger for the Gator Permissions controller. This is scoped to the
 * actions and events that the Gator Permissions controller is allowed to handle.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getGatorPermissionsControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<GatorPermissionsControllerMessenger>,
    MessengerEvents<GatorPermissionsControllerMessenger>
  >,
) {
  const controllerMessenger: GatorPermissionsControllerMessenger =
    new Messenger({
      namespace: 'GatorPermissionsController',
      parent: messenger,
    });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'SnapController:handleRequest',
      'SnapController:hasSnap',
      'NetworkController:findNetworkClientIdByChainId',
      'NetworkController:getNetworkClientById',
    ],
    events: [
      'TransactionController:transactionApproved',
      'TransactionController:transactionRejected',
      'TransactionController:transactionConfirmed',
      'TransactionController:transactionFailed',
      'TransactionController:transactionDropped',
    ],
  });
  return controllerMessenger;
}
