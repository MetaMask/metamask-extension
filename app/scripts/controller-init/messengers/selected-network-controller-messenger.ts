import { Messenger } from '@metamask/base-controller';
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
  messenger: Messenger<AllowedActions, AllowedEvents>,
) {
  return messenger.getRestricted({
    name: 'SelectedNetworkController',
    allowedActions: [
      'NetworkController:getNetworkClientById',
      'NetworkController:getState',
      'NetworkController:getSelectedNetworkClient',
      'PermissionController:hasPermissions',
      'PermissionController:getSubjectNames',
    ],
    allowedEvents: [
      'NetworkController:stateChange',
      'PermissionController:stateChange',
    ],
  });
}
