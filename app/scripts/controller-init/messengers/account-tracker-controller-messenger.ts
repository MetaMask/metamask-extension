import { Messenger } from '@metamask/messenger';
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
import { RootMessenger } from '.';

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
export function getAccountTrackerControllerMessenger(messenger: RootMessenger) {
  const accountTrackerControllerMessenger = new Messenger<
    'AccountTrackerController',
    AllowedActions,
    AllowedEvents,
    RootMessenger
  >({
    namespace: 'AccountTrackerController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: accountTrackerControllerMessenger,
    actions: [
      'AccountsController:getSelectedAccount',
      'NetworkController:getState',
      'NetworkController:getNetworkClientById',
      'OnboardingController:getState',
      'PreferencesController:getState',
      'RemoteFeatureFlagController:getState',
    ],
    events: [
      'AccountsController:selectedEvmAccountChange',
      'OnboardingController:stateChange',
      'KeyringController:accountRemoved',
    ],
  });
  return accountTrackerControllerMessenger;
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
  messenger: RootMessenger<
    AllowedInitializationActions,
    AllowedInitializationEvents
  >,
) {
  const accountTrackerControllerInitMessenger = new Messenger<
    'AccountTrackerControllerInit',
    AllowedInitializationActions,
    AllowedInitializationEvents,
    RootMessenger
  >({
    namespace: 'AccountTrackerControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: accountTrackerControllerInitMessenger,
    actions: [
      'NetworkController:getSelectedNetworkClient',
      'NetworkController:getState',
      'RemoteFeatureFlagController:getState',
      'PreferencesController:getState',
    ],
    events: ['NetworkController:networkDidChange'],
  });
  return accountTrackerControllerInitMessenger;
}
