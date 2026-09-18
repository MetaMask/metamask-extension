import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { SnapInterfaceControllerMessenger } from '@metamask/snaps-controllers';
import { RootMessenger } from '../../../lib/messenger';

/**
 * Get a restricted messenger for the Snap interface controller. This is scoped
 * to the actions and events that the Snap interface controller is allowed to
 * handle.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getSnapInterfaceControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<SnapInterfaceControllerMessenger>,
    MessengerEvents<SnapInterfaceControllerMessenger>
  >,
) {
  const controllerMessenger: SnapInterfaceControllerMessenger = new Messenger({
    namespace: 'SnapInterfaceController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'PhishingController:testOrigin',
      'ApprovalController:hasRequest',
      'ApprovalController:acceptRequest',
      'SnapController:getSnap',
      'MultichainAssetsController:getState',
      'AccountsController:getSelectedMultichainAccount',
      'AccountsController:getAccountByAddress',
      'AccountsController:listMultichainAccounts',
      'PermissionController:hasPermission',
    ],
    events: ['NotificationServicesController:notificationsListUpdated'],
  });
  return controllerMessenger;
}
