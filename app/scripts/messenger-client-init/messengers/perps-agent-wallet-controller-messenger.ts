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
 * keyring access by the controller is observable; the controller must never
 * register agent keys as keyring accounts. Two actions are used deliberately
 * by the agent setup flow: `KeyringController:signTypedMessage` (the MASTER
 * account signs the approveAgent typed data) and
 * `KeyringController:verifyPassword` (the password gates encryption of the
 * agent key). The `KeyringController:lock` event drives clearing of
 * in-memory plaintext, and `KeyringController:accountRemoved` drives the
 * per-account agent cleanup when an account is removed from the wallet.
 *
 * `PerpsController:prepareTradingWallet` is used by the agent setup flow to
 * run the trading-readiness steps (unified account enablement, builder fee
 * approval) immediately after activation.
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
      'KeyringController:verifyPassword',
      'PerpsController:prepareTradingWallet',
    ],
    events: ['KeyringController:lock', 'KeyringController:accountRemoved'],
  });

  return perpsAgentWalletControllerMessenger;
}
