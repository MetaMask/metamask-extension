import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { BackgroundApiServiceMessenger } from '../../services/background-api-service';
import { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger restricted to the allowed actions and events of the
 * background API service.
 * @param messenger - The base messenger used to create the restricted messenger.
 * @returns The messenger restricted to the allowed actions and events of the background API service.
 */
export function getBackgroundApiServiceMessenger(
  messenger: RootMessenger<
    MessengerActions<BackgroundApiServiceMessenger>,
    MessengerEvents<BackgroundApiServiceMessenger>
  >,
) {
  const serviceMessenger: BackgroundApiServiceMessenger = new Messenger({
    namespace: 'BackgroundApiService',
    parent: messenger,
  });

  return serviceMessenger;
}
