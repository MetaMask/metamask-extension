import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { LegacyBackgroundApiServiceMessenger } from '../../services/legacy-background-api-service';
import { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger restricted to the allowed actions and events of the
 * background API service.
 * @param messenger - The base messenger used to create the restricted messenger.
 * @returns The messenger restricted to the allowed actions and events of the background API service.
 */
export function getLegacyBackgroundApiServiceMessenger(
  messenger: RootMessenger<
    MessengerActions<LegacyBackgroundApiServiceMessenger>,
    MessengerEvents<LegacyBackgroundApiServiceMessenger>
  >,
) {
  const serviceMessenger: LegacyBackgroundApiServiceMessenger = new Messenger({
    namespace: 'LegacyBackgroundApiService',
    parent: messenger,
  });

  return serviceMessenger;
}
