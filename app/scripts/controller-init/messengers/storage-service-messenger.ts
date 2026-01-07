import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { StorageServiceMessenger as CoreStorageServiceMessenger } from '@metamask/storage-service';
import { RootMessenger } from '../../lib/messenger';

// Re-export the type from core for convenience
export type StorageServiceMessenger = CoreStorageServiceMessenger;

type AllowedActions = MessengerActions<StorageServiceMessenger>;
type AllowedEvents = MessengerEvents<StorageServiceMessenger>;

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
  messenger: RootMessenger<AllowedActions, AllowedEvents>,
): StorageServiceMessenger {
  const serviceMessenger = new Messenger<
    'StorageService',
    AllowedActions,
    AllowedEvents,
    typeof messenger
  >({
    namespace: 'StorageService',
    parent: messenger,
  });

  return serviceMessenger;
}

