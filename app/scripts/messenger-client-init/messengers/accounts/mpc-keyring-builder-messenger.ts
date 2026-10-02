import { Messenger } from '@metamask/messenger';
import {
  type RootMessenger,
  type RootMessengerActions,
  type RootMessengerEvents,
} from '../../../lib/messenger';
import type { MpcKeyringBuilderMessenger } from '../../../lib/money/mpc-keyring-builder';

export type { MpcKeyringBuilderMessenger };

/**
 * Messenger for the MPC keyring builder.
 *
 * The builder reads the primary mnemonic (to encrypt the key-share backup),
 * the MetaMask bearer token (presented to the MPC cloud), and asks for the
 * signing MFA confirmation.
 *
 * @param messenger - The root messenger.
 * @returns The MPC keyring builder messenger.
 */
export function getMpcKeyringBuilderMessenger(
  messenger: RootMessenger<RootMessengerActions, RootMessengerEvents>,
): MpcKeyringBuilderMessenger {
  const mpcKeyringMessenger: MpcKeyringBuilderMessenger = new Messenger({
    namespace: 'MpcKeyringBuilder',
    parent: messenger,
  });

  messenger.delegate({
    messenger: mpcKeyringMessenger,
    actions: [
      'KeyringController:withKeyringUnsafe',
      'AuthenticationController:getBearerToken',
      'MpcSigningMfaController:requestSigningConfirmation',
    ],
  });

  return mpcKeyringMessenger;
}
