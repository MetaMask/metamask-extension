// PersistenceManager.test.ts
// node is missing the navigator.locks API so we polyfill it for the tests
import 'navigator.locks';
import log from 'loglevel';

import { captureException } from '../../../../shared/lib/sentry';
import { MISSING_VAULT_ERROR } from '../../../../shared/constants/errors';
import { PersistenceManager } from './persistence-manager';
import ExtensionStore from './extension-store';
import { MetaMaskStateType } from './base-store';

const MOCK_DATA = { config: { foo: 'bar' } };

const mockStoreSet = jest.fn();
const mockStoreGet = jest.fn();

jest.mock('./extension-store', () => {
  return jest.fn().mockImplementation(() => {
    return { set: mockStoreSet, get: mockStoreGet };
  });
});
jest.mock('./read-only-network-store');
jest.mock('loglevel', () => ({
  error: jest.fn(),
}));
jest.mock('../../../../shared/lib/sentry', () => ({
  captureException: jest.fn(),
}));
const mockedCaptureException = jest.mocked(captureException);

describe('PersistenceManager', () => {
  let manager: PersistenceManager;

  beforeEach(() => {
    jest.clearAllMocks();
    manager = new PersistenceManager({ localStore: new ExtensionStore() });
  });

  describe('set', () => {
    it('throws if state is missing', async () => {
      await expect(
        manager.set(undefined as unknown as MetaMaskStateType),
      ).rejects.toThrow('MetaMask - updated state is missing');
    });

    it('throws if metadata has not been set', async () => {
      await expect(manager.set({ appState: { test: true } })).rejects.toThrow(
        'MetaMask - metadata must be set before calling "set"',
      );
    });

    it('calls localStore.set with the correct arguments once metadata is set', async () => {
      manager.setMetadata({ version: 10 });

      await manager.set({ appState: { test: true } });

      expect(mockStoreSet).toHaveBeenCalledTimes(1);
      expect(mockStoreSet).toHaveBeenCalledWith({
        data: { appState: { test: true } },
        meta: { version: 10 },
      });
    });

    it('logs error and captures exception if store.set throws', async () => {
      manager.setMetadata({ version: 10 });

      const error = new Error('store.set error');
      mockStoreSet.mockRejectedValueOnce(error);

      await manager.set({ appState: { broken: true } });
      expect(mockedCaptureException).toHaveBeenCalledWith(error);
      expect(log.error).toHaveBeenCalledWith(
        'error setting state in local store:',
        error,
      );
    });

    it('captures exception only once if store.set is called and throws multiple times', async () => {
      manager.setMetadata({ version: 10 });

      const error = new Error('store.set error');
      mockStoreSet.mockRejectedValue(error);

      await manager.set({ appState: { broken: true } });
      await manager.set({ appState: { broken: true } });

      expect(mockedCaptureException).toHaveBeenCalledTimes(1);
    });

    it('captures exception twice if store.set fails, then succeeds and then fails again', async () => {
      manager.setMetadata({ version: 17 });

      const error = new Error('store.set error');
      mockStoreSet.mockRejectedValueOnce(error);

      await manager.set({ appState: { broken: true } });

      mockStoreSet.mockReturnValueOnce({
        data: { appState: { broken: true } },
      });
      await manager.set({ appState: { broken: true } });

      mockStoreSet.mockRejectedValueOnce(error);

      await manager.set({ appState: { broken: true } });

      expect(mockedCaptureException).toHaveBeenCalledTimes(2);
    });
  });

  describe('get', () => {
    it('returns undefined and clears mostRecentRetrievedState if store returns empty', async () => {
      mockStoreGet.mockReturnValueOnce({});
      const result = await manager.get({ validateVault: false });
      expect(result).toBeUndefined();
      expect(manager.mostRecentRetrievedState).toBeNull();
    });

    it('returns undefined if store returns null', async () => {
      mockStoreGet.mockReturnValueOnce(null);
      const result = await manager.get({ validateVault: false });
      expect(result).toBeUndefined();
      expect(manager.mostRecentRetrievedState).toBeNull();
    });

    it('updates mostRecentRetrievedState if extension has not been initialized', async () => {
      mockStoreGet.mockResolvedValueOnce({ data: MOCK_DATA });

      const result = await manager.get({ validateVault: false });
      expect(result).toStrictEqual({ data: MOCK_DATA });
      expect(manager.mostRecentRetrievedState).toStrictEqual({
        data: MOCK_DATA,
      });
    });

    it('does not overwrite mostRecentRetrievedState if already initialized', async () => {
      mockStoreGet.mockResolvedValueOnce({ data: MOCK_DATA });
      // First call to get -> sets isExtensionInitialized = false -> sets mostRecentRetrievedState
      await manager.get({ validateVault: false });
      // The act of calling set will set isExtensionInitialized to true
      manager.setMetadata({ version: 10 });
      await manager.set({ appState: { test: true } });

      // Now call get() again; it should not change mostRecentRetrievedState
      mockStoreGet.mockResolvedValueOnce({
        data: { config: { newData: true } },
      });
      await manager.get({ validateVault: false });
      expect(manager.mostRecentRetrievedState).toStrictEqual({
        data: MOCK_DATA,
      });
    });

    it('does not throw when validating state with a *missing vault* and no backup', async () => {
      // the reason this does NOT throw is because this could be an initial
      // state; we have no good evidence that this isn't the first time
      // state is being initialized, so we just assume it is fine.
      const mockData = {
        data: {
          KeyringController: {
            vault: undefined, // vault is missing on purpose
          },
        },
      };
      mockStoreGet.mockResolvedValueOnce({ data: mockData });

      const result = await manager.get({ validateVault: true });
      expect(result).toStrictEqual({ data: mockData });
      expect(manager.mostRecentRetrievedState).toStrictEqual({
        data: mockData,
      });
    });

    it('does not throw when validating a valid vault', async () => {
      const mockData = {
        data: {
          KeyringController: {
            vault: 'vault',
          },
        },
      };
      mockStoreGet.mockResolvedValueOnce({ data: mockData });

      const result = await manager.get({ validateVault: true });
      expect(result).toStrictEqual({ data: mockData });
      expect(manager.mostRecentRetrievedState).toStrictEqual({
        data: mockData,
      });
    });

    it('does throw when validating state with a *missing vault* but has a backup', async () => {
      const mockData = {
        data: {
          KeyringController: {
            vault: undefined, // vault is missing on purpose
          },
        },
      };
      mockStoreGet.mockResolvedValueOnce({ data: mockData });
      manager.getBackup = jest.fn().mockResolvedValueOnce({
        KeyringController: {
          vault: 'vault',
        },
      });

      await expect(manager.get({ validateVault: true })).rejects.toThrow(
        MISSING_VAULT_ERROR,
      );
    });
  });

  describe('cleanUpMostRecentRetrievedState', () => {
    it('sets mostRecentRetrievedState to null if previously set', async () => {
      mockStoreGet.mockResolvedValueOnce({ data: MOCK_DATA });

      await manager.get({ validateVault: false });
      manager.cleanUpMostRecentRetrievedState();
      expect(manager.mostRecentRetrievedState).toBeNull();
    });

    it('leaves mostRecentRetrievedState as null if already null', async () => {
      expect(manager.mostRecentRetrievedState).toBeNull();
      manager.cleanUpMostRecentRetrievedState();
      expect(manager.mostRecentRetrievedState).toBeNull();
    });
  });

  describe('Locks', () => {
    it('should acquire a lock when setting state', async () => {
      manager.setMetadata({ version: 10 });

      manager.open = jest.fn().mockResolvedValue(undefined);

      const { request } = navigator.locks;
      const mockCallback = jest.fn();
      const mockLocksRequest = jest
        .fn()
        .mockImplementation((name, options, _) => {
          return request.call(navigator.locks, name, options, mockCallback);
        });
      navigator.locks.request = mockLocksRequest;

      // should be saved
      const one = manager.set({ appState: { test: 1 } });
      // should be tossed
      const two = manager.set({ appState: { test: 2 } });
      // should be saved
      const three = manager.set({ appState: { test: 3 } });

      await Promise.race([one, two, three]);

      // lock should be requested 3 times
      expect(mockLocksRequest).toHaveBeenCalledTimes(3);
      // but the mockCallback should only be called twice!
      expect(mockCallback).toHaveBeenCalledTimes(2);
    });
  });

  describe('Broken indexedDb', () => {
    const originalOpen = indexedDB.open.bind(indexedDB);
    let brokenManager: PersistenceManager;

    /**
     * Breaks the indexedDB open request with a specific error.
     *
     * @param error - The error to throw when opening the database.
     */
    function breakIndexedDbWithError(error: Error) {
      // make indexedDb throw the FF DOMException `InvalidStateError`:
      // "A mutation operation was attempted on a database that did not allow mutations."
      indexedDB.open = (name: string, version?: number) => {
        const request = {} as unknown as IDBOpenDBRequest;
        if (name === 'metamask-backup' && version === 1) {
          // @ts-expect-error - we're intentionally mocking the error here
          request.error = error;
          setTimeout(() => {
            request.onerror?.({ target: request } as unknown as Event);
          }, 0);
        }
        return request;
      };
    }

    afterEach(() => {
      // restore indexedDB.open back to its original function
      indexedDB.open = originalOpen;
    });

    it('Fails as expected', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const domException = new DOMException(
        'A mutation operation was attempted on a database that did not allow mutations.',
        'InvalidStateError',
      );
      breakIndexedDbWithError(domException);

      brokenManager = new PersistenceManager({
        localStore: new ExtensionStore(),
      });
      await brokenManager.open();

      // We don't have a valid indexedDB database to use, so `getBackup` now
      // returns `undefined`
      expect(await brokenManager.getBackup()).toBeUndefined();

      expect(mockedCaptureException).toHaveBeenCalledWith(domException);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Could not open backup database; automatic vault recovery will not be available.',
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(domException);
    });

    it('Fails as expected', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const randomError = new Error('Random Error');
      breakIndexedDbWithError(randomError);

      brokenManager = new PersistenceManager({
        localStore: new ExtensionStore(),
      });
      await expect(brokenManager.open()).rejects.toThrow(randomError);
      // in the application any other start up errors would be handled
      // further up the stack. Logging them here would be redundant.
      expect(mockedCaptureException).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });
});
