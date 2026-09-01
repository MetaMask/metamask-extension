import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';

import type { PerpsAgentWalletControllerMessenger } from '../../controllers/perps/agent-wallet/types';
import type { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger restricted to the allowed actions and events of the
 * PerpsAgentWalletController.
 *
 * The KeyringController action allowances exist so that any accidental
 * keyring access by the controller is observable (tests assert zero keyring
 * calls); the controller must never register agent keys as keyring accounts.
 * The `KeyringController:lock` event drives clearing of in-memory plaintext.
 *
 * @param messenger - The root messenger used to create the restricted
 * messenger.
 * @returns A restricted messenger for the PerpsAgentWalletController.
 */
export function getPerpsAgentWalletControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<PerpsAgentWalletControllerMessenger>,
    MessengerEvents<PerpsAgentWalletControllerMessenger>
  >,
): PerpsAgentWalletControllerMessenger {
  const perpsAgentWalletControllerMessenger: PerpsAgentWalletControllerMessenger =
    new Messenger({
      namespace: 'PerpsAgentWalletController',
      parent: messenger,
    });

  messenger.delegate({
    messenger: perpsAgentWalletControllerMessenger,
    actions: [
      'KeyringController:addNewKeyring',
      'KeyringController:getKeyringsByType',
      'KeyringController:getState',
      'KeyringController:signTypedMessage',
    ],
    events: ['KeyringController:lock'],
  });

  return perpsAgentWalletControllerMessenger;
}
