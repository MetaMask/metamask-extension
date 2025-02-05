import { Messenger } from '@metamask/base-controller';
import {
  DeleteInterface,
  GetAllSnaps,
  HandleSnapRequest,
} from '@metamask/snaps-controllers';
import { GetPermissions } from '@metamask/permission-controller';
import {
  TransactionControllerUnapprovedTransactionAddedEvent,
  TransactionControllerTransactionStatusUpdatedEvent,
} from '@metamask/transaction-controller';
import { SignatureStateChange } from '@metamask/signature-controller';

type Actions =
  | HandleSnapRequest
  | GetAllSnaps
  | GetPermissions
  | DeleteInterface;

type Events =
  | TransactionControllerUnapprovedTransactionAddedEvent
  | TransactionControllerTransactionStatusUpdatedEvent
  | SignatureStateChange;

export type SnapInsightsControllerMessenger = ReturnType<
  typeof getSnapInsightsControllerMessenger
>;

/**
 * Get a restricted messenger for the Snap insights controller. This is scoped
 * to the actions and events that the Snap insights controller is allowed to
 * handle.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getSnapInsightsControllerMessenger(
  messenger: Messenger<Actions, Events>,
) {
  return messenger.getRestricted({
    name: 'SnapInsightsController',
    allowedActions: [
      'SnapController:handleRequest',
      'SnapController:getAll',
      'PermissionController:getPermissions',
      'SnapInterfaceController:deleteInterface',
    ],
    allowedEvents: [
      'TransactionController:unapprovedTransactionAdded',
      'TransactionController:transactionStatusUpdated',
      'SignatureController:stateChange',
    ],
  });
}
