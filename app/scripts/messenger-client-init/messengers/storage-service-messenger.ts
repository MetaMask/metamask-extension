import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { StorageServiceMessenger as CoreStorageServiceMessenger } from '@metamask/storage-service';
import { RootMessenger } from '../../lib/messenger';

// Re-export the type from core for convenience
export type StorageServiceMessenger = CoreStorageServiceMessenger;

/**
 * Create the messenger for StorageService.
 *
 * StorageService is a stateless service that provides storage actions
 * for other controllers to call.
 *
 * @param messenger - The root messenger
 * @returns The StorageService messenger
 */
export function getStorageServiceMessenger(
  messenger: RootMessenger<
    MessengerActions<StorageServiceMessenger>,
    MessengerEvents<StorageServiceMessenger>
  >,
): StorageServiceMessenger {
  const serviceMessenger: StorageServiceMessenger = new Messenger({
    namespace: 'StorageService',
    parent: messenger,
  });

  return serviceMessenger;
}
