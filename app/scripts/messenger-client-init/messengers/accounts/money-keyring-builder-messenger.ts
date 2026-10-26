import { Messenger } from '@metamask/messenger';
import {
  RootMessenger,
  RootMessengerActions,
  RootMessengerEvents,
} from '../../../lib/messenger';
import type { MoneyKeyringBuilderMessenger } from '../../../lib/money/money-keyring-builder';

export type { MoneyKeyringBuilderMessenger };

/**
 * Gets the messenger for the Money keyring builder, scoped to the single
 * action the keyring needs: reading the mnemonic of its entropy source
 * through `KeyringController:withKeyringUnsafe`.
 *
 * @param messenger - The root messenger instance, used to create a child messenger for the Money keyring and to delegate the necessary action to it.
 * @returns The Money keyring builder messenger instance.
 */
export function getMoneyKeyringBuilderMessenger(
  messenger: RootMessenger<RootMessengerActions, RootMessengerEvents>,
): MoneyKeyringBuilderMessenger {
  const moneyKeyringMessenger: MoneyKeyringBuilderMessenger = new Messenger({
    namespace: 'MoneyKeyringBuilder',
    parent: messenger,
  });

  messenger.delegate({
    messenger: moneyKeyringMessenger,
    actions: ['KeyringController:withKeyringUnsafe'],
  });

  return moneyKeyringMessenger;
}
