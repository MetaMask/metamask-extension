import { Messenger } from '@metamask/base-controller';
import {
  NetworkControllerGetSelectedNetworkClientAction,
  NetworkControllerGetStateAction,
  NetworkControllerNetworkDidChangeEvent,
} from '@metamask/network-controller';
import { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import { PreferencesControllerGetStateAction } from '../../controllers/preferences-controller';
import {
  AllowedActions,
  AllowedEvents,
} from '../../controllers/account-tracker-controller';

export type AccountTrackerControllerMessenger = ReturnType<
  typeof getAccountTrackerControllerMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * account tracker controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getAccountTrackerControllerMessenger(
  messenger: Messenger<AllowedActions, AllowedEvents>,
) {
  return messenger.getRestricted({
    name: 'AccountTrackerController',
    allowedActions: [
      'AccountsController:getSelectedAccount',
      'NetworkController:getState',
      'NetworkController:getNetworkClientById',
      'OnboardingController:getState',
      'PreferencesController:getState',
      'RemoteFeatureFlagController:getState',
    ],
    allowedEvents: [
      'AccountsController:selectedEvmAccountChange',
      'OnboardingController:stateChange',
      'KeyringController:accountRemoved',
    ],
  });
}

type AllowedInitializationActions =
  | NetworkControllerGetSelectedNetworkClientAction
  | NetworkControllerGetStateAction
  | RemoteFeatureFlagControllerGetStateAction
  | PreferencesControllerGetStateAction;

type AllowedInitializationEvents = NetworkControllerNetworkDidChangeEvent;

export type AccountTrackerControllerInitMessenger = ReturnType<
  typeof getAccountTrackerControllerInitMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events needed to
 * initialize the account tracker controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getAccountTrackerControllerInitMessenger(
  messenger: Messenger<
    AllowedInitializationActions,
    AllowedInitializationEvents
  >,
) {
  return messenger.getRestricted({
    name: 'AccountTrackerControllerInit',
    allowedActions: [
      'NetworkController:getSelectedNetworkClient',
      'NetworkController:getState',
      'RemoteFeatureFlagController:getState',
      'PreferencesController:getState',
    ],
    allowedEvents: ['NetworkController:networkDidChange'],
  });
}
