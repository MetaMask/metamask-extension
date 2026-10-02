import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import type { MpcSigningMfaControllerMessenger } from '../../controllers/mpc-signing-mfa/mpc-signing-mfa-controller';
import type { RootMessenger } from '../../lib/messenger';

/**
 * Messenger for {@link MpcSigningMfaController}.
 *
 * The controller does not call other controllers. The keyring builder calls
 * into it.
 *
 * @param messenger - The root messenger.
 * @returns The restricted controller messenger.
 */
export function getMpcSigningMfaControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<MpcSigningMfaControllerMessenger>,
    MessengerEvents<MpcSigningMfaControllerMessenger>
  >,
): MpcSigningMfaControllerMessenger {
  const controllerMessenger: MpcSigningMfaControllerMessenger = new Messenger({
    namespace: 'MpcSigningMfaController',
    parent: messenger,
  });
  return controllerMessenger;
}
