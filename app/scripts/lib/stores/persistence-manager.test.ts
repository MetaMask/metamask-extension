// PersistanceManager.test.ts
import { captureException } from '@sentry/browser';
import log from 'loglevel';

import { PersistanceManager } from './persistence-manager';
import ExtensionStore from './extension-store';
import { IntermediaryStateType } from './base-store';

jest.mock('./extension-store', () => {
  return jest.fn().mockImplementation(() => {
    return { set: jest.fn(), get: jest.fn() };
  });
});
jest.mock('./read-only-network-store');
jest.mock('@sentry/browser', () => ({
  captureException: jest.fn(),
}));
jest.mock('loglevel', () => ({
  error: jest.fn(),
}));

describe('PersistanceManager', () => {
  let manager: PersistanceManager;

  beforeEach(() => {
    jest.clearAllMocks();
    manager = new PersistanceManager({ localStore: new ExtensionStore() });
  });

  describe('constructor', () => {
    it('initializes with the expected default properties', () => {
      expect(manager.dataPersistenceFailing).toBe(false);
      expect(manager.mostRecentRetrievedState).toBeNull();
      expect(manager.isExtensionInitialized).toBe(false);
      expect(manager.localStore).toBeDefined();
    });
  });

  describe('metadata setter/getter', () => {
    it('sets and retrieves metadata correctly', () => {
      manager.metadata = { version: 42 };
      expect(manager.metadata).toStrictEqual({ version: 42 });
    });
  });

  describe('set', () => {
    let mockStoreSet: jest.Mock;

    beforeEach(() => {
      // By default, we create a manager with ExtensionStore mocked
      mockStoreSet = manager.localStore.set as jest.Mock;
    });

    it('throws if state is missing', async () => {
      await expect(
        manager.set(undefined as unknown as IntermediaryStateType),
      ).rejects.toThrow('MetaMask - updated state is missing');
    });

    it('throws if metadata has not been set', async () => {
      await expect(manager.set({ appState: { test: true } })).rejects.toThrow(
        'MetaMask - metadata must be set before calling "set"',
      );
    });

    it('calls localStore.set with the correct arguments once metadata is set', async () => {
      manager.metadata = { version: 10 };

      await manager.set({ appState: { test: true } });

      expect(mockStoreSet).toHaveBeenCalledTimes(1);
      expect(mockStoreSet).toHaveBeenCalledWith({
        data: { appState: { test: true } },
        meta: { version: 10 },
      });
      expect(manager.dataPersistenceFailing).toBe(false);
      expect(manager.isExtensionInitialized).toBe(true);
    });

    it('sets dataPersistenceFailing to true and logs error if store.set throws', async () => {
      manager.metadata = { version: 10 };

      const error = new Error('store.set error');
      mockStoreSet.mockRejectedValueOnce(error);

      await manager.set({ appState: { broken: true } });
      expect(captureException).toHaveBeenCalledWith(error);
      expect(log.error).toHaveBeenCalledWith(
        'error setting state in local store:',
        error,
      );
      expect(manager.dataPersistenceFailing).toBe(true);
      expect(manager.isExtensionInitialized).toBe(true);
    });

    it('resets dataPersistenceFailing to false if a second call to set succeeds', async () => {
      manager.metadata = { version: 10 };

      // First call fails
      const error = new Error('store.set error');
      mockStoreSet.mockRejectedValueOnce(error);

      await manager.set({ appState: { broken: true } });
      expect(manager.dataPersistenceFailing).toBe(true);

      // Next call succeeds
      await manager.set({ appState: { works: true } });
      expect(manager.dataPersistenceFailing).toBe(false);
    });
  });

  describe('get', () => {
    let mockStoreGet: jest.Mock;

    beforeEach(() => {
      mockStoreGet = manager.localStore.get as jest.Mock;
    });

    it('returns undefined and clears mostRecentRetrievedState if store returns empty', async () => {
      mockStoreGet.mockReturnValueOnce({});
      const result = await manager.get();
      expect(result).toBeUndefined();
      expect(manager.mostRecentRetrievedState).toBeNull();
    });

    it('returns undefined if store returns null', async () => {
      mockStoreGet.mockReturnValueOnce(null);
      const result = await manager.get();
      expect(result).toBeUndefined();
      expect(manager.mostRecentRetrievedState).toBeNull();
    });

    it('updates mostRecentRetrievedState if manager is not initialized yet', async () => {
      mockStoreGet.mockResolvedValueOnce({ data: { config: { foo: 'bar' } } });

      expect(manager.isExtensionInitialized).toBe(false);
      await manager.get();
      expect(manager.mostRecentRetrievedState).toStrictEqual({
        data: { config: { foo: 'bar' } },
      });
    });

    it('does not overwrite mostRecentRetrievedState if already initialized', async () => {
      mockStoreGet.mockResolvedValueOnce({ data: { config: { foo: 'bar' } } });
      // First call to get -> sets isExtensionInitialized = false -> sets mostRecentRetrievedState
      await manager.get();
      expect(manager.isExtensionInitialized).toBe(false);
      // The act of calling set will set isExtensionInitialized to true
      manager.metadata = { version: 10 };
      await manager.set({ appState: { test: true } });
      expect(manager.isExtensionInitialized).toBe(true);

      // Now call get() again; it should not change mostRecentRetrievedState
      mockStoreGet.mockResolvedValueOnce({
        data: { config: { newData: true } },
      });
      await manager.get();
      expect(manager.mostRecentRetrievedState).toStrictEqual({
        data: { config: { foo: 'bar' } },
      });
    });
  });

  describe('cleanUpMostRecentRetrievedState', () => {
    it('sets mostRecentRetrievedState to null if previously set', async () => {
      manager.mostRecentRetrievedState = {
        data: { config: { foo: 'bar' } },
      };
      manager.cleanUpMostRecentRetrievedState();
      expect(manager.mostRecentRetrievedState).toBeNull();
    });

    it('leaves mostRecentRetrievedState as null if already null', async () => {
      expect(manager.mostRecentRetrievedState).toBeNull();
      manager.cleanUpMostRecentRetrievedState();
      expect(manager.mostRecentRetrievedState).toBeNull();
    });
  });
});
