import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import type { MoneyAccountUpgradeServiceMessenger } from '../../lib/money/money-account-upgrade-service';
import type { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger for the MoneyAccountUpgradeService.
 *
 * `withKeyringUnsafe` serves the upgrade trigger, which derives the money
 * account address from the primary seed rather than trusting one from the UI.
 *
 * @param messenger - The root messenger.
 * @returns The MoneyAccountUpgradeService messenger.
 */
export function getMoneyAccountUpgradeServiceMessenger(
  messenger: RootMessenger<
    MessengerActions<MoneyAccountUpgradeServiceMessenger>,
    MessengerEvents<MoneyAccountUpgradeServiceMessenger>
  >,
): MoneyAccountUpgradeServiceMessenger {
  const serviceMessenger: MoneyAccountUpgradeServiceMessenger = new Messenger({
    namespace: 'MoneyAccountUpgradeService',
    parent: messenger,
  });

  messenger.delegate({
    messenger: serviceMessenger,
    actions: ['KeyringController:withKeyringUnsafe'],
  });

  return serviceMessenger;
}
