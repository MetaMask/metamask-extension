import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { SnapInsightsControllerMessenger } from '@metamask/snaps-controllers';
import { RootMessenger } from '../../../lib/messenger';

/**
 * Get a restricted messenger for the Snap insights controller. This is scoped
 * to the actions and events that the Snap insights controller is allowed to
 * handle.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getSnapInsightsControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<SnapInsightsControllerMessenger>,
    MessengerEvents<SnapInsightsControllerMessenger>
  >,
) {
  const controllerMessenger: SnapInsightsControllerMessenger = new Messenger({
    namespace: 'SnapInsightsController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'SnapController:handleRequest',
      'SnapController:getRunnableSnaps',
      'PermissionController:getPermissions',
      'SnapInterfaceController:deleteInterface',
    ],
    events: [
      'TransactionController:unapprovedTransactionAdded',
      'TransactionController:transactionStatusUpdated',
      'SignatureController:stateChange',
    ],
  });
  return controllerMessenger;
}
