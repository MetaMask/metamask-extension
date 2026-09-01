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
      'OnboardingController:getState',
      'PreferencesController:getState',
      'RemoteFeatureFlagController:getState',
    ],
    events: [
      'KeyringController:stateChange',
      'OnboardingController:stateChange',
      'PreferencesController:stateChange',
      'RemoteFeatureFlagController:stateChange',
    ],
  });

  return serviceMessenger;
}
