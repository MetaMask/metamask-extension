import { Messenger } from '@metamask/messenger';
import { GatorPermissionsControllerStateChangeEvent } from '@metamask/gator-permissions-controller';
import {
  SnapControllerHandleRequestAction,
  SnapControllerHasSnapAction,
} from '@metamask/snaps-controllers';
import {
  TransactionControllerTransactionApprovedEvent,
  TransactionControllerTransactionRejectedEvent,
  TransactionControllerTransactionConfirmedEvent,
  TransactionControllerTransactionFailedEvent,
  TransactionControllerTransactionDroppedEvent,
} from '@metamask/transaction-controller';
import {
  NetworkControllerFindNetworkClientIdByChainIdAction,
  NetworkControllerGetNetworkClientByIdAction,
} from '@metamask/network-controller';
import { RootMessenger } from '../../../lib/messenger';

export type GatorPermissionsControllerMessenger = ReturnType<
  typeof getGatorPermissionsControllerMessenger
>;

type MessengerActions =
  | SnapControllerHandleRequestAction
  | SnapControllerHasSnapAction
  | NetworkControllerFindNetworkClientIdByChainIdAction
  | NetworkControllerGetNetworkClientByIdAction;

type MessengerEvents =
  | GatorPermissionsControllerStateChangeEvent
  | TransactionControllerTransactionApprovedEvent
  | TransactionControllerTransactionRejectedEvent
  | TransactionControllerTransactionConfirmedEvent
  | TransactionControllerTransactionFailedEvent
  | TransactionControllerTransactionDroppedEvent;

/**
 * Get a restricted messenger for the Gator Permissions controller. This is scoped to the
 * actions and events that the Gator Permissions controller is allowed to handle.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getGatorPermissionsControllerMessenger(
  messenger: RootMessenger<MessengerActions, MessengerEvents>,
) {
  const controllerMessenger = new Messenger<
    'GatorPermissionsController',
    MessengerActions,
    MessengerEvents,
    typeof messenger
  >({
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
