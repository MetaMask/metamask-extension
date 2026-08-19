import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import type { MoneyAccountAvailabilityMessenger } from '../../lib/money/money-account-availability';
import type { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger for the MoneyAccountAvailabilityService, scoped to the
 * actions and events the service is allowed to use.
 *
 * @param messenger - The root messenger.
 * @returns The MoneyAccountAvailabilityService messenger.
 */
export function getMoneyAccountAvailabilityServiceMessenger(
  messenger: RootMessenger<
    MessengerActions<MoneyAccountAvailabilityMessenger>,
    MessengerEvents<MoneyAccountAvailabilityMessenger>
  >,
): MoneyAccountAvailabilityMessenger {
  const serviceMessenger: MoneyAccountAvailabilityMessenger = new Messenger({
    namespace: 'MoneyAccountAvailabilityService',
    parent: messenger,
  });

  messenger.delegate({
    messenger: serviceMessenger,
    actions: [
      'KeyringController:withKeyringUnsafe',
      'RemoteFeatureFlagController:getState',
      'GeolocationController:getGeolocation',
    ],
    events: ['KeyringController:unlock', 'KeyringController:lock'],
  });

  return serviceMessenger;
}
