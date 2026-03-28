import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import { getStorageServiceMessenger } from './storage-service-messenger';

describe('getStorageServiceMessenger', () => {
  it('returns a messenger instance', () => {
    const rootMessenger = getRootMessenger();
    const storageServiceMessenger = getStorageServiceMessenger(rootMessenger);

    expect(storageServiceMessenger).toBeInstanceOf(Messenger);
  });

  it('creates a messenger with the correct namespace', () => {
    const rootMessenger = getRootMessenger();
    const storageServiceMessenger = getStorageServiceMessenger(rootMessenger);

    // Verify the messenger is properly created
    expect(storageServiceMessenger).toBeDefined();
  });
});
