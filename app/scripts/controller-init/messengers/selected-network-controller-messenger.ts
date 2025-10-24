import { Messenger } from '@metamask/messenger';
import {
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetSelectedNetworkClientAction,
  NetworkControllerGetStateAction,
  NetworkControllerStateChangeEvent,
} from '@metamask/network-controller';
import {
  HasPermissions,
  GetSubjects,
  PermissionControllerStateChange,
} from '@metamask/permission-controller';
import { RootMessenger } from '../../lib/messenger';

type AllowedActions =
  | NetworkControllerGetNetworkClientByIdAction
  | NetworkControllerGetSelectedNetworkClientAction
  | NetworkControllerGetStateAction
  | GetSubjects
  | HasPermissions;

type AllowedEvents =
  | NetworkControllerStateChangeEvent
  | PermissionControllerStateChange;

export type SelectedNetworkControllerMessenger = ReturnType<
  typeof getSelectedNetworkControllerMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * selected network controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getSelectedNetworkControllerMessenger(
  messenger: RootMessenger<AllowedActions, AllowedEvents>,
) {
  const controllerMessenger = new Messenger<
    'SelectedNetworkController',
    AllowedActions,
    AllowedEvents,
    typeof messenger
  >({
    namespace: 'SelectedNetworkController',
    parent: messenger,
  });
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
