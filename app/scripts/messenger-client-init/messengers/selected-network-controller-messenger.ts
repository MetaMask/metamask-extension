import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import { SelectedNetworkControllerMessenger } from '@metamask/selected-network-controller';
import { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger restricted to the allowed actions and events of the
 * selected network controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getSelectedNetworkControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<SelectedNetworkControllerMessenger>,
    MessengerEvents<SelectedNetworkControllerMessenger>
  >,
): SelectedNetworkControllerMessenger {
  const controllerMessenger: SelectedNetworkControllerMessenger = new Messenger(
    {
      namespace: 'SelectedNetworkController',
      parent: messenger,
    },
  );
  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'NetworkController:getNetworkClientById',
      'NetworkController:getState',
      'NetworkController:getSelectedNetworkClient',
      'PermissionController:hasPermissions',
      'PermissionController:getSubjectNames',
    ],
    events: [
      'NetworkController:stateChange',
      'PermissionController:stateChange',
    ],
  });
  return controllerMessenger;
}
