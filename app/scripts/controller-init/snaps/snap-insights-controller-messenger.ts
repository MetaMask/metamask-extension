import { ControllerMessenger } from '@metamask/base-controller';
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

export function getSnapInsightsControllerMessenger(
  controllerMessenger: ControllerMessenger<Actions, Events>,
) {
  return controllerMessenger.getRestricted({
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
