import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import type { MoneyAccountMpcMessenger } from '../../lib/money/money-account-mpc-service';
import type { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger for {@link MoneyAccountMpcService}.
 *
 * @param messenger - The root messenger.
 * @returns The MoneyAccountMpcService messenger.
 */
export function getMoneyAccountMpcServiceMessenger(
  messenger: RootMessenger<
    MessengerActions<MoneyAccountMpcMessenger>,
    MessengerEvents<MoneyAccountMpcMessenger>
  >,
): MoneyAccountMpcMessenger {
  const serviceMessenger: MoneyAccountMpcMessenger = new Messenger({
    namespace: 'MoneyAccountMpcService',
    parent: messenger,
  });

  messenger.delegate({
    messenger: serviceMessenger,
    actions: [
      'KeyringController:getState',
      'KeyringController:addNewKeyring',
      'KeyringController:withKeyring',
      'MoneyAccountController:init',
      'MoneyAccountController:migrateMoneyAccountAddress',
    ],
    events: [],
  });

  return serviceMessenger;
}
