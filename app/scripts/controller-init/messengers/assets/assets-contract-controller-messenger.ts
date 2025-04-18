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
