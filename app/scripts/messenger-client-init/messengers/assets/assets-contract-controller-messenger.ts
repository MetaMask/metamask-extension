import { Messenger } from '@metamask/messenger';
import {
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetNetworkConfigurationByNetworkClientId,
  NetworkControllerGetSelectedNetworkClientAction,
  NetworkControllerGetStateAction,
  NetworkControllerNetworkDidChangeEvent,
} from '@metamask/network-controller';
import { PreferencesControllerStateChangeEvent } from '@metamask/preferences-controller';
import { RootMessenger } from '../../../lib/messenger';

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
  messenger: RootMessenger<Actions, Events>,
) {
  const controllerMessenger = new Messenger<
    'AssetsContractController',
    Actions,
    Events,
    typeof messenger
  >({
    namespace: 'AssetsContractController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'NetworkController:getNetworkClientById',
      'NetworkController:getNetworkConfigurationByNetworkClientId',
      'NetworkController:getSelectedNetworkClient',
      'NetworkController:getState',
    ],
    events: [
      'PreferencesController:stateChange',
      'NetworkController:networkDidChange',
    ],
  });
  return controllerMessenger;
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
  messenger: RootMessenger<AllowedInitializationActions, never>,
) {
  const controllerInitMessenger = new Messenger<
    'AssetsContractControllerInit',
    AllowedInitializationActions,
    never,
    typeof messenger
  >({
    namespace: 'AssetsContractControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: [
      'NetworkController:getNetworkClientById',
      'NetworkController:getState',
    ],
    events: [],
  });
  return controllerInitMessenger;
}
