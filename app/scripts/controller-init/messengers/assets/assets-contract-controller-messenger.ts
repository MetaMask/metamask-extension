import { Messenger } from '@metamask/base-controller';
import {
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetNetworkConfigurationByNetworkClientId,
  NetworkControllerGetSelectedNetworkClientAction,
  NetworkControllerGetStateAction,
  NetworkControllerNetworkDidChangeEvent,
} from '@metamask/network-controller';
import { PreferencesControllerStateChangeEvent } from '@metamask/preferences-controller';

type Actions =
  | NetworkControllerGetNetworkClientByIdAction
  | NetworkControllerGetNetworkConfigurationByNetworkClientId
  | NetworkControllerGetSelectedNetworkClientAction
  | NetworkControllerGetStateAction;

type Events =
  | PreferencesControllerStateChangeEvent
  | NetworkControllerNetworkDidChangeEvent;

export type AssetsContractControllerMessenger = ReturnType<
  typeof getAssetsContractControllerMessenger
>;

/**
 * Get a restricted messenger for the AssetsContractController. This is scoped to the
 * actions and events that the AssetsContractController is allowed to handle.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getAssetsContractControllerMessenger(
  messenger: Messenger<Actions, Events>,
) {
  return messenger.getRestricted({
    name: 'AssetsContractController',
    allowedActions: [
      'NetworkController:getNetworkClientById',
      'NetworkController:getNetworkConfigurationByNetworkClientId',
      'NetworkController:getSelectedNetworkClient',
      'NetworkController:getState',
    ],
    allowedEvents: [
      'PreferencesController:stateChange',
      'NetworkController:networkDidChange',
    ],
  });
}

type AllowedInitializationActions =
  | NetworkControllerGetNetworkClientByIdAction
  | NetworkControllerGetStateAction;

export type AssetsContractControllerInitMessenger = ReturnType<
  typeof getAssetsContractControllerInitMessenger
>;

/**
 * Get a restricted messenger for initializing the AssetsContractController.
 * This is scoped to the actions and events that are needed during initialization.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger for initialization.
 */
export function getAssetsContractControllerInitMessenger(
  messenger: Messenger<AllowedInitializationActions, never>,
) {
  return messenger.getRestricted({
    name: 'AssetsContractControllerInit',
    allowedActions: [
      'NetworkController:getNetworkClientById',
      'NetworkController:getState',
    ],
    allowedEvents: [],
  });
}
