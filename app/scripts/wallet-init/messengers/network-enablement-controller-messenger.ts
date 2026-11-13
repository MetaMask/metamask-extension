import { Messenger } from '@metamask/messenger';
import type { AccountsControllerSelectedAccountChangeEvent } from '@metamask/accounts-controller';
import type {
  AccountTreeControllerGetAccountsFromSelectedAccountGroupAction,
  AccountTreeControllerSelectedAccountGroupChangeEvent,
} from '@metamask/account-tree-controller';
import type { ConfigRegistryControllerGetStateAction } from '@metamask/config-registry-controller';
import type {
  NetworkControllerGetStateAction,
  NetworkControllerNetworkAddedEvent,
} from '@metamask/network-controller';
import type { NetworkEnablementControllerStateChangeEvent } from '@metamask/network-enablement-controller';
import type { RootMessenger } from '../../lib/messenger';
import type {
  OnboardingControllerGetStateAction,
  OnboardingControllerStateChangeEvent,
} from '../../controllers/onboarding';
import type {
  PreferencesControllerGetStateAction,
  PreferencesControllerStateChangeEvent,
} from '../../controllers/preferences-controller';

export type NetworkEnablementControllerInitMessengerActions =
  | AccountTreeControllerGetAccountsFromSelectedAccountGroupAction
  | ConfigRegistryControllerGetStateAction
  | NetworkControllerGetStateAction
  | OnboardingControllerGetStateAction
  | PreferencesControllerGetStateAction;

export type NetworkEnablementControllerInitMessengerEvents =
  | AccountsControllerSelectedAccountChangeEvent
  | AccountTreeControllerSelectedAccountGroupChangeEvent
  | NetworkControllerNetworkAddedEvent
  | NetworkEnablementControllerStateChangeEvent
  | OnboardingControllerStateChangeEvent
  | PreferencesControllerStateChangeEvent;

export type NetworkEnablementControllerInitMessenger = ReturnType<
  typeof getNetworkEnablementControllerInitMessenger
>;

/**
 * Create a messenger restricted to the actions and events the extension-side
 * `NetworkEnablementController` setup needs. The wallet-owned
 * `NetworkEnablementController` builds its own controller messenger; this
 * init messenger is only for the extension's network-selection behavior.
 *
 * @param messenger - The root messenger used to create the restricted messenger.
 * @returns The restricted network enablement init messenger.
 */
export function getNetworkEnablementControllerInitMessenger(
  messenger: RootMessenger<
    NetworkEnablementControllerInitMessengerActions,
    NetworkEnablementControllerInitMessengerEvents
  >,
) {
  const networkEnablementControllerInitMessenger = new Messenger<
    'NetworkEnablementControllerInit',
    NetworkEnablementControllerInitMessengerActions,
    NetworkEnablementControllerInitMessengerEvents,
    typeof messenger
  >({
    namespace: 'NetworkEnablementControllerInit',
    parent: messenger,
  });

  messenger.delegate({
    messenger: networkEnablementControllerInitMessenger,
    actions: [
      'AccountTreeController:getAccountsFromSelectedAccountGroup',
      'ConfigRegistryController:getState',
      'NetworkController:getState',
      'OnboardingController:getState',
      'PreferencesController:getState',
    ],
    events: [
      'AccountsController:selectedAccountChange',
      'AccountTreeController:selectedAccountGroupChange',
      'NetworkController:networkAdded',
      'NetworkEnablementController:stateChange',
      'OnboardingController:stateChange',
      'PreferencesController:stateChange',
    ],
  });

  return networkEnablementControllerInitMessenger;
}
