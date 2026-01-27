//========
// This is how the WalletServiceMessenger could look. It's ultimately dependent
// on the implementation of the service class itself.
//========

import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { RootMessenger } from '../../lib/messenger';
import { WalletServiceMessenger } from '../../services/wallet-service';

type AllowedActions = MessengerActions<WalletServiceMessenger>;

type AllowedEvents = MessengerEvents<WalletServiceMessenger>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * error reporting service.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getWalletServiceMessenger(
  messenger: RootMessenger<AllowedActions, AllowedEvents>,
) {
  const serviceMessenger = new Messenger<
    'WalletService',
    AllowedActions,
    AllowedEvents,
    typeof messenger
  >({
    namespace: 'WalletService',
    parent: messenger,
  });
  messenger.delegate({
    messenger: serviceMessenger,
    actions: [
      'NetworkController:getNetworkClientById',
      'KeyringController:getAccounts',
      'KeyringController:withKeyring',
      'PreferencesController:setSelectedAddress',
    ],
    events: [],
  });
  return serviceMessenger;
}
