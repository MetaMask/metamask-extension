import { StorageService } from '@metamask/storage-service';
import { browserStorageAdapter } from '../lib/stores/browser-storage-adapter';
import { ControllerInitFunction } from './types';
import { StorageServiceMessenger } from './messengers';

/**
 * Initialize the StorageService.
 *
 * StorageService is a stateless service that provides storage actions
 * for other controllers to use for large, infrequently accessed data.
 *
 * @param request - The initialization request
 * @param request.controllerMessenger - The messenger for the service
 * @returns The initialized service with null state keys (stateless)
 */
export const StorageServiceInit: ControllerInitFunction<
  StorageService,
  StorageServiceMessenger
> = ({ controllerMessenger }) => {
  const controller = new StorageService({
    messenger: controllerMessenger,
    storage: browserStorageAdapter,
  });

  return {
    controller,
    // StorageService is stateless - no persisted or mem state
    persistedStateKey: null,
    memStateKey: null,
  };
};

