import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import { AccountTrackerControllerMessenger } from '@metamask/assets-controllers';
import { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import { NetworkControllerNetworkDidChangeEvent } from '@metamask/network-controller';
import { RootMessenger } from '../../lib/messenger';
import { PreferencesControllerGetStateAction } from '../../controllers/preferences-controller';

/**
 * Create a messenger restricted to the allowed actions and events of the
 * account tracker controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getAccountTrackerControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<AccountTrackerControllerMessenger>,
    MessengerEvents<AccountTrackerControllerMessenger>
  >,
): AccountTrackerControllerMessenger {
  const accountTrackerControllerMessenger: AccountTrackerControllerMessenger =
    new Messenger({
      namespace: 'AccountTrackerController',
      parent: messenger,
    });
  messenger.delegate({
    messenger: accountTrackerControllerMessenger,
    actions: [
      'AccountsController:getSelectedAccount',
      'AccountsController:listAccounts',
      'NetworkController:getNetworkClientById',
      'NetworkController:getState',
      'NetworkEnablementController:getState',
      'NetworkEnablementController:listPopularEvmNetworks',
      'PreferencesController:getState',
      'KeyringController:getState',
    ],
    events: [
      'AccountsController:selectedEvmAccountChange',
      'TransactionController:transactionConfirmed',
      'TransactionController:unapprovedTransactionAdded',
      'NetworkController:networkAdded',
      'KeyringController:lock',
      'KeyringController:unlock',
    ],
  });
  return accountTrackerControllerMessenger;
}

type AllowedInitializationActions =
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
    typeof messenger
  >({
    namespace: 'AccountTrackerControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: accountTrackerControllerInitMessenger,
    actions: [
      'RemoteFeatureFlagController:getState',
      'PreferencesController:getState',
    ],
    events: ['NetworkController:networkDidChange'],
  });
  return accountTrackerControllerInitMessenger;
}
