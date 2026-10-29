import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import type { RampsServiceMessenger } from '@metamask/ramps-controller';
import { RootMessenger } from '../../lib/messenger';

/**
 * Get the messenger for the RampsService. Delegates the
 * AuthenticationController:getBearerToken action so the service can
 * authenticate API requests via the messenger.
 *
 * @param messenger - The root messenger.
 * @returns The RampsServiceMessenger.
 */
export function getRampsServiceMessenger(
  messenger: RootMessenger<
    MessengerActions<RampsServiceMessenger>,
    MessengerEvents<RampsServiceMessenger>
  >,
): RampsServiceMessenger {
  const serviceMessenger: RampsServiceMessenger = new Messenger({
    namespace: 'RampsService',
    parent: messenger,
  });

  messenger.delegate({
    messenger: serviceMessenger,
    actions: ['AuthenticationController:getBearerToken'],
    events: [],
  });

  return serviceMessenger;
}
