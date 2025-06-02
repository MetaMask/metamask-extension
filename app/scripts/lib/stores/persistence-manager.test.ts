// PersistenceManager.test.ts
// node is missing the navigator.locks API so we polyfill it for the tests
import 'navigator.locks';
import { captureException } from '@sentry/browser';
import log from 'loglevel';

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
jest.mock('@sentry/browser', () => ({
  captureException: jest.fn(),
}));
jest.mock('loglevel', () => ({
  error: jest.fn(),
}));

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
      expect(captureException).toHaveBeenCalledWith(error);
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

      expect(captureException).toHaveBeenCalledTimes(1);
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

      expect(captureException).toHaveBeenCalledTimes(2);
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
});
