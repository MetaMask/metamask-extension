import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import type { MoneyAccountUpgradeServiceMessenger } from '../../lib/money/money-account-upgrade-service';
import type { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger for the MoneyAccountUpgradeService, scoped to the actions
 * and events the service is allowed to use.
 *
 * The service gates the upgrade-controller bootstrap on the remote flags and
 * on an unlocked wallet with its keyrings loaded, and configures the Money
 * chain before the bootstrap — hence the network and legacy-API actions.
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
    actions: [
      'KeyringController:getState',
      'LegacyBackgroundApiService:addNetwork',
      'NetworkController:getState',
      'RemoteFeatureFlagController:getState',
    ],
    events: [
      'KeyringController:stateChange',
      'RemoteFeatureFlagController:stateChange',
    ],
  });

  return serviceMessenger;
}
