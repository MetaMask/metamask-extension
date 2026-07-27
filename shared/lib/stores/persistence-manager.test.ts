// PersistenceManager.test.ts
// node is missing the navigator.locks API so we polyfill it for the tests
import 'navigator.locks';
import log from 'loglevel';

import { captureException, captureMessage } from '../sentry';
import { getManifestFlags } from '../manifestFlags';
import { MISSING_VAULT_ERROR } from '../../constants/errors';
import {
  PersistenceManager,
  PERSISTENCE_MANAGER_OPERATION_SAFENER_DEBOUNCE_MS,
  ShutdownTrigger,
} from './persistence-manager';
import { IndexedDBStore } from './indexeddb-store';
import ExtensionStore from './extension-store';
import { MetaMaskStateType } from './base-store';

const MOCK_DATA = { config: { foo: 'bar' } };
const WRITE_RETRY_DELAY_MS =
  PERSISTENCE_MANAGER_OPERATION_SAFENER_DEBOUNCE_MS / 2;

const mockStoreSet = jest.fn();
const mockStoreSetKeyValues = jest.fn();
const mockStoreGet = jest.fn();
const mockStoreReset = jest.fn();

jest.mock('./extension-store', () => {
  return jest.fn().mockImplementation(() => {
    return {
      set: mockStoreSet,
      setKeyValues: mockStoreSetKeyValues,
      get: mockStoreGet,
      reset: mockStoreReset,
    };
  });
});
jest.mock('loglevel', () => ({
  error: jest.fn(),
  info: jest.fn(),
}));
jest.mock('../sentry', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}));
jest.mock('../manifestFlags', () => ({
  getManifestFlags: jest.fn(() => ({})),
}));
jest.mock('../trace', () => ({
  trace: jest.fn(),
  endTrace: jest.fn(),
  TraceName: {},
}));
const mockedCaptureException = jest.mocked(captureException);
const mockedCaptureMessage = jest.mocked(captureMessage);
const mockedGetManifestFlags = jest.mocked(getManifestFlags);

describe('PersistenceManager', () => {
  let manager: PersistenceManager;
  const originalInTest = process.env.IN_TEST;

  function prepareForWriteRetry(): void {
    jest.useFakeTimers();
    jest.spyOn(manager, 'open').mockResolvedValue(undefined);
  }

  beforeEach(() => {
    process.env.IN_TEST = 'true';
    jest.clearAllMocks();
    mockedGetManifestFlags.mockReturnValue({});
    manager = new PersistenceManager({ localStore: new ExtensionStore() });
  });

  afterEach(() => {
    // Disabling also cancels any pending shutdown-recovery probe, so a timer
    // scheduled by a suspension does not outlive the test.
    manager.setShutdownSuspensionEnabled(false);
    jest.useRealTimers();
  });

  afterAll(() => {
    if (originalInTest === undefined) {
      delete process.env.IN_TEST;
    } else {
      process.env.IN_TEST = originalInTest;
    }
  });

  describe('open', () => {
    it('serializes concurrent open calls so the backup IndexedDB open runs once', async () => {
      const openSpy = jest.spyOn(IndexedDBStore.prototype, 'open');
      await Promise.all([manager.open(), manager.open(), manager.open()]);
      expect(openSpy).toHaveBeenCalledTimes(1);
      openSpy.mockRestore();
    });
  });

  describe('events', () => {
    it('supports EventEmitter on and off without throwing', () => {
      const listener = jest.fn();
      expect(() => {
        manager.on('splitStateMigrationSucceeded', listener);
        manager.on('writeRetryRecovered', listener);
        manager.off('splitStateMigrationSucceeded', listener);
        manager.off('vaultCorruptionDetected', listener);
        manager.off('writeRetryRecovered', listener);
      }).not.toThrow();
    });
  });

  describe('set', () => {
    beforeEach(() => {
      manager.storageKind = 'data';
    });
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

      const [result, error] = await manager.set({ appState: { test: true } });

      expect(mockStoreSet).toHaveBeenCalledTimes(1);
      expect(mockStoreSet).toHaveBeenCalledWith({
        data: { appState: { test: true } },
        meta: { version: 10 },
      });
      expect(result).toBe(true);
      expect(error).toBeUndefined();
    });

    it('retries store.set once before reporting success', async () => {
      prepareForWriteRetry();
      manager.setMetadata({ version: 10 });

      const error = new Error('store.set error');
      const writeRetryRecoveredListener = jest.fn();
      manager.on('writeRetryRecovered', writeRetryRecoveredListener);
      mockStoreSet
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(undefined);

      const setPromise = manager.set({ appState: { restored: true } });

      await jest.advanceTimersByTimeAsync(0);
      expect(mockStoreSet).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(WRITE_RETRY_DELAY_MS);

      const [result, persistError] = await setPromise;

      expect(mockStoreSet).toHaveBeenCalledTimes(2);
      expect(result).toBe(true);
      expect(persistError).toBeUndefined();
      expect(mockedCaptureException).not.toHaveBeenCalled();
      expect(mockedCaptureMessage).not.toHaveBeenCalled();
      expect(writeRetryRecoveredListener).toHaveBeenCalledWith({
        event: 'set-retry-recovered',
        firstErrorMessage: 'store.set error',
        firstErrorName: 'Error',
        retryDelayMs: WRITE_RETRY_DELAY_MS,
      });
      expect(log.error).not.toHaveBeenCalled();
    });

    it('recovers after a simulated one-time storage failure', async () => {
      prepareForWriteRetry();
      manager.setMetadata({ version: 10 });
      mockedGetManifestFlags.mockReturnValue({
        testing: { simulateStorageSetFailure: 'once' },
      });
      mockStoreSet.mockResolvedValue(undefined);
      const writeRetryRecoveredListener = jest.fn();
      manager.on('writeRetryRecovered', writeRetryRecoveredListener);

      const setPromise = manager.set({ appState: { restored: true } });

      await jest.advanceTimersByTimeAsync(0);
      expect(mockStoreSet).not.toHaveBeenCalled();

      await jest.advanceTimersByTimeAsync(WRITE_RETRY_DELAY_MS);

      const [result, persistError] = await setPromise;

      expect(mockStoreSet).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);
      expect(persistError).toBeUndefined();
      expect(writeRetryRecoveredListener).toHaveBeenCalledWith({
        event: 'set-retry-recovered',
        firstErrorMessage: 'Simulated storage.local.set failure for testing',
        firstErrorName: 'Error',
        retryDelayMs: WRITE_RETRY_DELAY_MS,
      });
    });

    it('reports the original store.set error when a newer set supersedes the retry', async () => {
      prepareForWriteRetry();
      manager.setMetadata({ version: 10 });

      const error = new Error('store.set error');
      const writeRetryRecoveredListener = jest.fn();
      manager.on('writeRetryRecovered', writeRetryRecoveredListener);
      mockStoreSet
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(undefined);

      const firstSetPromise = manager.set({ appState: { stale: true } });

      await jest.advanceTimersByTimeAsync(0);
      expect(mockStoreSet).toHaveBeenCalledTimes(1);

      const secondSetPromise = manager.set({ appState: { fresh: true } });

      const [
        [firstResult, firstPersistError],
        [secondResult, secondPersistError],
      ] = await Promise.all([firstSetPromise, secondSetPromise]);

      expect(mockStoreSet).toHaveBeenCalledTimes(2);
      expect(mockStoreSet).toHaveBeenNthCalledWith(2, {
        data: { appState: { fresh: true } },
        meta: { version: 10 },
      });
      expect(firstResult).toBe(false);
      expect(firstPersistError).toBe(error);
      expect(secondResult).toBe(true);
      expect(secondPersistError).toBeUndefined();
      expect(mockedCaptureException).toHaveBeenCalledWith(error, {
        tags: { 'persistence.error': 'set-failed' },
        fingerprint: ['persistence-error', 'set-failed'],
      });
      expect(mockedCaptureMessage).toHaveBeenCalledWith(
        'Data persistence recovered after temporary failure',
        {
          level: 'info',
          tags: { 'persistence.event': 'set-recovered' },
          fingerprint: ['persistence-event', 'set-recovered'],
        },
      );
      expect(writeRetryRecoveredListener).not.toHaveBeenCalled();
      expect(log.error).toHaveBeenCalledWith(
        'error setting state in local store:',
        error,
      );
    });

    it('does not supersede a backup store.set retry with a newer set', async () => {
      await manager.open();
      jest.useFakeTimers();
      manager.setMetadata({ version: 10 });

      const backupError = new Error('backup store.set error');
      const backupSetSpy = jest
        .spyOn(IndexedDBStore.prototype, 'set')
        .mockRejectedValueOnce(backupError)
        .mockResolvedValueOnce(undefined);
      const writeRetryRecoveredListener = jest.fn();
      manager.on('writeRetryRecovered', writeRetryRecoveredListener);
      mockStoreSet.mockResolvedValue(undefined);

      const firstSetPromise = manager.set({
        KeyringController: {
          vault: 'encrypted-vault',
        },
      } as unknown as MetaMaskStateType);

      await jest.advanceTimersByTimeAsync(0);
      expect(mockStoreSet).toHaveBeenCalledTimes(1);
      expect(backupSetSpy).toHaveBeenCalledTimes(1);

      const secondSetPromise = manager.set({ appState: { fresh: true } });

      await jest.advanceTimersByTimeAsync(0);
      expect(mockStoreSet).toHaveBeenCalledTimes(1);
      expect(backupSetSpy).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(WRITE_RETRY_DELAY_MS);

      const [
        [firstResult, firstPersistError],
        [secondResult, secondPersistError],
      ] = await Promise.all([firstSetPromise, secondSetPromise]);

      expect(mockStoreSet).toHaveBeenCalledTimes(2);
      expect(backupSetSpy).toHaveBeenCalledTimes(2);
      expect(firstResult).toBe(true);
      expect(firstPersistError).toBeUndefined();
      expect(secondResult).toBe(true);
      expect(secondPersistError).toBeUndefined();
      expect(mockedCaptureException).not.toHaveBeenCalled();
      expect(writeRetryRecoveredListener).toHaveBeenCalledWith({
        event: 'set-backup-retry-recovered',
        firstErrorMessage: 'backup store.set error',
        firstErrorName: 'Error',
        retryDelayMs: WRITE_RETRY_DELAY_MS,
      });
      expect(log.error).not.toHaveBeenCalled();

      backupSetSpy.mockRestore();
    });

    it('logs error and captures exception if store.set throws after retry', async () => {
      prepareForWriteRetry();
      manager.setMetadata({ version: 10 });

      const error = new Error('store.set error');
      mockStoreSet.mockRejectedValueOnce(error).mockRejectedValueOnce(error);

      const setPromise = manager.set({
        appState: { broken: true },
      });
      await jest.advanceTimersByTimeAsync(WRITE_RETRY_DELAY_MS);

      const [result, persistError] = await setPromise;
      expect(mockedCaptureException).toHaveBeenCalledWith(error, {
        tags: { 'persistence.error': 'set-failed' },
        fingerprint: ['persistence-error', 'set-failed'],
      });
      expect(mockStoreSet).toHaveBeenCalledTimes(2);
      expect(result).toBe(false);
      expect(persistError).toBe(error);
      expect(log.error).toHaveBeenCalledWith(
        'error setting state in local store:',
        error,
      );
    });

    it('captures exception only once if store.set is called and throws multiple times', async () => {
      prepareForWriteRetry();
      manager.setMetadata({ version: 10 });

      const error = new Error('store.set error');
      mockStoreSet.mockRejectedValue(error);

      const firstSetPromise = manager.set({ appState: { broken: true } });
      await jest.advanceTimersByTimeAsync(WRITE_RETRY_DELAY_MS);
      await firstSetPromise;

      const secondSetPromise = manager.set({ appState: { broken: true } });
      await jest.advanceTimersByTimeAsync(WRITE_RETRY_DELAY_MS);
      await secondSetPromise;

      expect(mockedCaptureException).toHaveBeenCalledTimes(1);
    });

    it('captures exception twice if store.set fails, then succeeds and then fails again', async () => {
      prepareForWriteRetry();
      manager.setMetadata({ version: 17 });

      const error = new Error('store.set error');
      mockStoreSet.mockRejectedValueOnce(error).mockRejectedValueOnce(error);

      const firstSetPromise = manager.set({ appState: { broken: true } });
      await jest.advanceTimersByTimeAsync(WRITE_RETRY_DELAY_MS);
      await firstSetPromise;

      mockStoreSet.mockResolvedValueOnce(undefined);
      await manager.set({ appState: { broken: true } });

      mockStoreSet.mockRejectedValueOnce(error).mockRejectedValueOnce(error);

      const thirdSetPromise = manager.set({ appState: { broken: true } });
      await jest.advanceTimersByTimeAsync(WRITE_RETRY_DELAY_MS);
      await thirdSetPromise;

      expect(mockedCaptureException).toHaveBeenCalledTimes(2);
    });

    it('tracks recovery with captureMessage when store.set fails then succeeds', async () => {
      prepareForWriteRetry();
      manager.setMetadata({ version: 17 });

      const error = new Error('store.set error');
      mockStoreSet.mockRejectedValueOnce(error).mockRejectedValueOnce(error);

      // First set fails
      const firstSetPromise = manager.set({ appState: { broken: true } });
      await jest.advanceTimersByTimeAsync(WRITE_RETRY_DELAY_MS);
      await firstSetPromise;

      expect(mockedCaptureException).toHaveBeenCalledTimes(1);
      expect(mockedCaptureMessage).not.toHaveBeenCalled();

      // Second set succeeds - should trigger recovery tracking
      mockStoreSet.mockResolvedValueOnce(undefined);
      await manager.set({ appState: { fixed: true } });

      expect(mockedCaptureMessage).toHaveBeenCalledTimes(1);
      expect(mockedCaptureMessage).toHaveBeenCalledWith(
        'Data persistence recovered after temporary failure',
        {
          level: 'info',
          tags: { 'persistence.event': 'set-recovered' },
          fingerprint: ['persistence-event', 'set-recovered'],
        },
      );
    });

    it('does not track recovery if set never failed', async () => {
      manager.setMetadata({ version: 17 });

      // Set succeeds without prior failure
      mockStoreSet.mockResolvedValueOnce(undefined);
      await manager.set({ appState: { working: true } });

      expect(mockedCaptureMessage).not.toHaveBeenCalled();
    });
  });

  describe('get', () => {
    it('returns undefined and clears mostRecentRetrievedState if store returns empty', async () => {
      mockStoreGet.mockResolvedValueOnce({});
      const result = await manager.get({ validateVault: false });
      expect(result).toBeUndefined();
      expect(manager.mostRecentRetrievedState).toBeNull();
    });

    it('returns undefined if store returns null', async () => {
      mockStoreGet.mockResolvedValueOnce(null);
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

    it('does not capture exception if reporting is disabled and store.get throws', async () => {
      const error = new Error('store.get error');
      mockStoreGet.mockRejectedValueOnce(error);

      await expect(
        manager.get({ validateVault: false, reportErrors: false }),
      ).rejects.toThrow(error);

      expect(mockedCaptureException).not.toHaveBeenCalled();
      expect(log.error).toHaveBeenCalledWith(
        'Error retrieving the current state of the local store:',
        error,
      );
    });

    it('does not overwrite mostRecentRetrievedState if already initialized', async () => {
      manager.storageKind = 'data';
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
      jest.spyOn(manager, 'getBackup').mockResolvedValueOnce({
        KeyringController: {
          vault: 'vault',
        },
      });

      await expect(manager.get({ validateVault: true })).rejects.toThrow(
        MISSING_VAULT_ERROR,
      );
    });
  });

  describe('getBackup', () => {
    it('returns all backed up controller state', async () => {
      await manager.open();
      await manager.reset();
      manager.storageKind = 'data';
      manager.setMetadata({ version: 10 });

      mockStoreSet.mockResolvedValueOnce(undefined);

      const [result, error] = await manager.set({
        KeyringController: {
          vault: 'encrypted-vault',
        },
        AppMetadataController: {
          currentAppVersion: '13.34.0',
        },
        MetaMetricsController: {
          completedMetaMetricsOnboarding: true,
        },
        AnalyticsController: {
          analyticsId: '0xabc123',
          optedIn: true,
        },
      } as unknown as MetaMaskStateType);

      expect(result).toBe(true);
      expect(error).toBeUndefined();
      /* eslint-disable-next-line jest/prefer-strict-equal -- IndexedDB structuredClone can change object prototypes */
      expect(await manager.getBackup()).toEqual({
        KeyringController: {
          vault: 'encrypted-vault',
        },
        AppMetadataController: {
          currentAppVersion: '13.34.0',
        },
        MetaMetricsController: {
          completedMetaMetricsOnboarding: true,
        },
        AnalyticsController: {
          analyticsId: '0xabc123',
          optedIn: true,
        },
        meta: {
          version: 10,
        },
      });
    });
  });

  describe('persist', () => {
    it('throws if storageKind is not split', async () => {
      manager.storageKind = 'data';

      await expect(manager.persist()).rejects.toThrow(
        'MetaMask - cannot use `persist` when storageKind is not "split"',
      );
    });

    it('throws if metadata has not been set', async () => {
      await expect(manager.persist()).rejects.toThrow(
        'MetaMask - metadata must be set before calling "persist"',
      );
    });

    it('calls localStore.setKeyValues with pending pairs', async () => {
      manager.setMetadata({ version: 10, storageKind: 'split' });
      manager.update('FooController', { foo: 'bar' });
      manager.update('BarController', undefined);

      const [result, error] = await manager.persist();

      expect(mockStoreSetKeyValues).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);
      expect(error).toBeUndefined();
      const passedMap = mockStoreSetKeyValues.mock.calls[0][0] as Map<
        string,
        unknown
      >;
      /* eslint-disable jest/prefer-strict-equal -- persist() uses structuredClone for map values; toEqual matches deep shape (stricter than toMatchObject); toStrictEqual fails on prototype */
      expect(passedMap.get('meta')).toEqual({
        version: 10,
        storageKind: 'split',
      });
      expect(passedMap.get('FooController')).toEqual({ foo: 'bar' });
      /* eslint-enable jest/prefer-strict-equal */
      expect(passedMap.has('BarController')).toBe(true);
      expect(passedMap.get('BarController')).toBeUndefined();
    });

    it('retries store.setKeyValues once before reporting success', async () => {
      prepareForWriteRetry();
      manager.setMetadata({ version: 10 });
      manager.update('FooController', { foo: 'bar' });

      const error = new Error('store.setKeyValues error');
      const writeRetryRecoveredListener = jest.fn();
      manager.on('writeRetryRecovered', writeRetryRecoveredListener);
      mockStoreSetKeyValues
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(undefined);

      const persistPromise = manager.persist();

      await jest.advanceTimersByTimeAsync(0);
      expect(mockStoreSetKeyValues).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(WRITE_RETRY_DELAY_MS);

      const [result, persistError] = await persistPromise;

      expect(mockStoreSetKeyValues).toHaveBeenCalledTimes(2);
      expect(result).toBe(true);
      expect(persistError).toBeUndefined();
      expect(mockedCaptureException).not.toHaveBeenCalled();
      expect(mockedCaptureMessage).not.toHaveBeenCalled();
      expect(writeRetryRecoveredListener).toHaveBeenCalledWith({
        event: 'persist-retry-recovered',
        firstErrorMessage: 'store.setKeyValues error',
        firstErrorName: 'Error',
        retryDelayMs: WRITE_RETRY_DELAY_MS,
      });
      expect(log.error).not.toHaveBeenCalled();
    });

    it('reports the original store.setKeyValues error when a newer persist supersedes the retry', async () => {
      prepareForWriteRetry();
      manager.setMetadata({ version: 10 });
      manager.update('FooController', { foo: 'old' });
      manager.update('BazController', { baz: 'old' });

      const error = new Error('store.setKeyValues error');
      const writeRetryRecoveredListener = jest.fn();
      manager.on('writeRetryRecovered', writeRetryRecoveredListener);
      mockStoreSetKeyValues
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(undefined);

      const firstPersistPromise = manager.persist();

      await jest.advanceTimersByTimeAsync(0);
      expect(mockStoreSetKeyValues).toHaveBeenCalledTimes(1);

      manager.update('FooController', { foo: 'new' });
      manager.update('BarController', { bar: 'new' });
      const secondPersistPromise = manager.persist();

      const [
        [firstResult, firstPersistError],
        [secondResult, secondPersistError],
      ] = await Promise.all([firstPersistPromise, secondPersistPromise]);

      expect(mockStoreSetKeyValues).toHaveBeenCalledTimes(2);
      const secondMap = mockStoreSetKeyValues.mock.calls[1][0] as Map<
        string,
        unknown
      >;
      /* eslint-disable jest/prefer-strict-equal -- persist() uses structuredClone for map values; toEqual matches deep shape (stricter than toMatchObject); toStrictEqual fails on prototype */
      expect(secondMap.get('meta')).toEqual({ version: 10 });
      expect(secondMap.get('FooController')).toEqual({ foo: 'new' });
      expect(secondMap.get('BazController')).toEqual({ baz: 'old' });
      expect(secondMap.get('BarController')).toEqual({ bar: 'new' });
      /* eslint-enable jest/prefer-strict-equal */
      expect(firstResult).toBe(false);
      expect(firstPersistError).toBe(error);
      expect(secondResult).toBe(true);
      expect(secondPersistError).toBeUndefined();
      expect(mockedCaptureException).toHaveBeenCalledWith(error, {
        tags: { 'persistence.error': 'persist-failed' },
        fingerprint: ['persistence-error', 'persist-failed'],
      });
      expect(mockedCaptureMessage).toHaveBeenCalledWith(
        'Data persistence recovered after temporary failure',
        {
          level: 'info',
          tags: { 'persistence.event': 'persist-recovered' },
          fingerprint: ['persistence-event', 'persist-recovered'],
        },
      );
      expect(writeRetryRecoveredListener).not.toHaveBeenCalled();
      expect(log.error).toHaveBeenCalledWith(
        'error setting state in local store:',
        error,
      );
    });

    it('does not supersede a backup store.set retry with a newer persist', async () => {
      await manager.open();
      jest.useFakeTimers();
      manager.setMetadata({ version: 10 });
      manager.update('KeyringController', {
        vault: 'encrypted-vault',
      });

      const backupError = new Error('backup store.set error');
      const backupSetSpy = jest
        .spyOn(IndexedDBStore.prototype, 'set')
        .mockRejectedValueOnce(backupError)
        .mockResolvedValueOnce(undefined);
      const writeRetryRecoveredListener = jest.fn();
      manager.on('writeRetryRecovered', writeRetryRecoveredListener);
      mockStoreSetKeyValues.mockResolvedValue(undefined);

      const firstPersistPromise = manager.persist();

      await jest.advanceTimersByTimeAsync(0);
      expect(mockStoreSetKeyValues).toHaveBeenCalledTimes(1);
      expect(backupSetSpy).toHaveBeenCalledTimes(1);

      manager.update('FooController', { foo: 'new' });
      const secondPersistPromise = manager.persist();

      await jest.advanceTimersByTimeAsync(0);
      expect(mockStoreSetKeyValues).toHaveBeenCalledTimes(1);
      expect(backupSetSpy).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(WRITE_RETRY_DELAY_MS);

      const [
        [firstResult, firstPersistError],
        [secondResult, secondPersistError],
      ] = await Promise.all([firstPersistPromise, secondPersistPromise]);

      expect(mockStoreSetKeyValues).toHaveBeenCalledTimes(2);
      expect(backupSetSpy).toHaveBeenCalledTimes(2);
      const secondMap = mockStoreSetKeyValues.mock.calls[1][0] as Map<
        string,
        unknown
      >;
      /* eslint-disable-next-line jest/prefer-strict-equal -- persist() uses structuredClone for map values; toEqual matches deep shape (stricter than toMatchObject); toStrictEqual fails on prototype */
      expect(secondMap.get('FooController')).toEqual({ foo: 'new' });
      expect(firstResult).toBe(true);
      expect(firstPersistError).toBeUndefined();
      expect(secondResult).toBe(true);
      expect(secondPersistError).toBeUndefined();
      expect(mockedCaptureException).not.toHaveBeenCalled();
      expect(writeRetryRecoveredListener).toHaveBeenCalledWith({
        event: 'persist-backup-retry-recovered',
        firstErrorMessage: 'backup store.set error',
        firstErrorName: 'Error',
        retryDelayMs: WRITE_RETRY_DELAY_MS,
      });
      expect(log.error).not.toHaveBeenCalled();

      backupSetSpy.mockRestore();
    });

    it('logs error and captures exception if store.setKeyValues throws after retry', async () => {
      prepareForWriteRetry();
      manager.setMetadata({ version: 10 });
      manager.update('FooController', { foo: 'bar' });

      const error = new Error('store.setKeyValues error');
      mockStoreSetKeyValues
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error);

      const persistPromise = manager.persist();
      await jest.advanceTimersByTimeAsync(WRITE_RETRY_DELAY_MS);

      const [result, persistError] = await persistPromise;

      expect(mockedCaptureException).toHaveBeenCalledWith(error, {
        tags: { 'persistence.error': 'persist-failed' },
        fingerprint: ['persistence-error', 'persist-failed'],
      });
      expect(mockStoreSetKeyValues).toHaveBeenCalledTimes(2);
      expect(result).toBe(false);
      expect(persistError).toBe(error);
      expect(log.error).toHaveBeenCalledWith(
        'error setting state in local store:',
        error,
      );
    });

    it('retries pending updates when store.setKeyValues throws after retry', async () => {
      prepareForWriteRetry();
      manager.setMetadata({ version: 10 });
      manager.update('FooController', { foo: 'bar' });

      const error = new Error('store.setKeyValues error');
      mockStoreSetKeyValues
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error);

      const firstPersistPromise = manager.persist();
      await jest.advanceTimersByTimeAsync(WRITE_RETRY_DELAY_MS);
      const [firstResult, firstError] = await firstPersistPromise;

      mockStoreSetKeyValues.mockResolvedValueOnce(undefined);

      const [secondResult, secondError] = await manager.persist();

      expect(mockStoreSetKeyValues).toHaveBeenCalledTimes(3);
      expect(firstResult).toBe(false);
      expect(firstError).toBe(error);
      expect(secondResult).toBe(true);
      expect(secondError).toBeUndefined();
      const retryMap = mockStoreSetKeyValues.mock.calls[2][0] as Map<
        string,
        unknown
      >;

      /* eslint-disable jest/prefer-strict-equal -- persist() uses structuredClone for map values; toEqual matches deep shape (stricter than toMatchObject); toStrictEqual fails on prototype */
      expect(retryMap.get('meta')).toEqual({ version: 10 });
      expect(retryMap.get('FooController')).toEqual({ foo: 'bar' });
      /* eslint-enable jest/prefer-strict-equal */
    });

    it('captures exception only once if store.setKeyValues throws multiple times', async () => {
      prepareForWriteRetry();
      manager.setMetadata({ version: 10 });
      manager.update('FooController', { foo: 'bar' });

      const error = new Error('store.setKeyValues error');
      mockStoreSetKeyValues.mockRejectedValue(error);

      const firstPersistPromise = manager.persist();
      await jest.advanceTimersByTimeAsync(WRITE_RETRY_DELAY_MS);
      await firstPersistPromise;

      const secondPersistPromise = manager.persist();
      await jest.advanceTimersByTimeAsync(WRITE_RETRY_DELAY_MS);
      await secondPersistPromise;

      expect(mockedCaptureException).toHaveBeenCalledTimes(1);
    });

    it('captures exception twice if store.setKeyValues fails, then succeeds and then fails again', async () => {
      prepareForWriteRetry();
      manager.setMetadata({ version: 17 });
      manager.update('FooController', { foo: 'bar' });

      const error = new Error('store.setKeyValues error');
      mockStoreSetKeyValues
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error);

      const firstPersistPromise = manager.persist();
      await jest.advanceTimersByTimeAsync(WRITE_RETRY_DELAY_MS);
      await firstPersistPromise;

      mockStoreSetKeyValues.mockResolvedValueOnce(undefined);
      await manager.persist();

      mockStoreSetKeyValues
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error);
      const thirdPersistPromise = manager.persist();
      await jest.advanceTimersByTimeAsync(WRITE_RETRY_DELAY_MS);
      await thirdPersistPromise;

      expect(mockedCaptureException).toHaveBeenCalledTimes(2);
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

  describe('shutdown write suspension', () => {
    describe('suspendWrites / resumeWrites / writesSuspended', () => {
      it('is a no-op while the feature flag is disabled', () => {
        manager.suspendWrites();
        expect(manager.writesSuspended()).toBe(false);
      });

      it('suspends and resumes writes when enabled', () => {
        manager.setShutdownSuspensionEnabled(true);

        manager.suspendWrites();
        expect(manager.writesSuspended()).toBe(true);

        manager.resumeWrites();
        expect(manager.writesSuspended()).toBe(false);
      });

      it('flushes pending split-storage pairs when writes resume', async () => {
        manager.setShutdownSuspensionEnabled(true);
        manager.storageKind = 'split';
        manager.setMetadata({ version: 10, storageKind: 'split' });
        manager.update('FooController', { foo: 'bar' });
        manager.suspendWrites(ShutdownTrigger.OnSuspend);

        // Short-circuit leaves the pending pair queued.
        const [shortCircuitResult, shortCircuitError] = await manager.persist();
        expect(shortCircuitResult).toBe(false);
        expect(shortCircuitError).toBeUndefined();
        expect(mockStoreSetKeyValues).not.toHaveBeenCalled();

        mockStoreSetKeyValues.mockResolvedValue(undefined);
        manager.resumeWrites();

        // resumeWrites kicks off a fire-and-forget persist; wait for it.
        await new Promise<void>((resolve) => {
          setImmediate(resolve);
        });

        expect(mockStoreSetKeyValues).toHaveBeenCalledTimes(1);
        const passedMap = mockStoreSetKeyValues.mock.calls[0][0] as Map<
          string,
          unknown
        >;
        /* eslint-disable jest/prefer-strict-equal -- persist() uses structuredClone for map values; toEqual matches deep shape (stricter than toMatchObject); toStrictEqual fails on prototype */
        expect(passedMap.get('FooController')).toEqual({ foo: 'bar' });
        /* eslint-enable jest/prefer-strict-equal */
      });

      it('clears suspended state when the feature flag is disabled', () => {
        manager.setShutdownSuspensionEnabled(true);
        manager.suspendWrites(ShutdownTrigger.OnSuspend);
        expect(manager.writesSuspended()).toBe(true);

        manager.setShutdownSuspensionEnabled(false);

        expect(manager.writesSuspended()).toBe(false);

        // Re-enabling must not inherit the previous suspension.
        manager.setShutdownSuspensionEnabled(true);
        expect(manager.writesSuspended()).toBe(false);
      });

      it('reports a single low-volume telemetry message per suspension', () => {
        manager.setShutdownSuspensionEnabled(true);

        manager.suspendWrites(ShutdownTrigger.OnSuspend);
        manager.suspendWrites(ShutdownTrigger.OnSuspend);

        expect(mockedCaptureMessage).toHaveBeenCalledTimes(1);
        expect(mockedCaptureMessage).toHaveBeenCalledWith(
          'MetaMask - writes suspended: browser shutting down',
          expect.objectContaining({
            tags: expect.objectContaining({
              'persistence.event': 'writes-suspended-shutdown',
              'persistence.shutdownTrigger': ShutdownTrigger.OnSuspend,
            }),
          }),
        );
      });

      it('emits promotion telemetry when OnSuspend takes ownership after an inferred trigger', () => {
        manager.setShutdownSuspensionEnabled(true);

        manager.suspendWrites(ShutdownTrigger.Reactive);
        manager.suspendWrites(ShutdownTrigger.OnSuspend);

        expect(mockedCaptureMessage).toHaveBeenCalledTimes(2);
        expect(mockedCaptureMessage).toHaveBeenNthCalledWith(
          1,
          'MetaMask - writes suspended: browser shutting down',
          expect.objectContaining({
            tags: expect.objectContaining({
              'persistence.event': 'writes-suspended-shutdown',
              'persistence.shutdownTrigger': ShutdownTrigger.Reactive,
            }),
          }),
        );
        expect(mockedCaptureMessage).toHaveBeenNthCalledWith(
          2,
          'MetaMask - writes suspended: shutdown ownership promoted',
          expect.objectContaining({
            tags: expect.objectContaining({
              'persistence.event': 'writes-suspended-promoted',
              'persistence.shutdownTrigger': ShutdownTrigger.OnSuspend,
              'persistence.previousShutdownTrigger': ShutdownTrigger.Reactive,
            }),
          }),
        );
      });

      it('does not emit promotion telemetry when OnSuspend was already the owner', () => {
        manager.setShutdownSuspensionEnabled(true);

        manager.suspendWrites(ShutdownTrigger.OnSuspend);
        manager.suspendWrites(ShutdownTrigger.Reactive);
        manager.suspendWrites(ShutdownTrigger.OnSuspend);

        expect(mockedCaptureMessage).toHaveBeenCalledTimes(1);
        expect(mockedCaptureMessage).toHaveBeenCalledWith(
          'MetaMask - writes suspended: browser shutting down',
          expect.objectContaining({
            tags: expect.objectContaining({
              'persistence.shutdownTrigger': ShutdownTrigger.OnSuspend,
            }),
          }),
        );
      });

      it('defaults the telemetry trigger to unknown when omitted', () => {
        manager.setShutdownSuspensionEnabled(true);

        manager.suspendWrites();

        expect(mockedCaptureMessage).toHaveBeenCalledWith(
          'MetaMask - writes suspended: browser shutting down',
          expect.objectContaining({
            tags: expect.objectContaining({
              'persistence.shutdownTrigger': ShutdownTrigger.Unknown,
            }),
          }),
        );
      });

      it('honors a shutdown signal that arrived before the feature flag was enabled', () => {
        manager.suspendWrites(ShutdownTrigger.OnSuspend);
        expect(manager.writesSuspended()).toBe(false);

        manager.setShutdownSuspensionEnabled(true);

        expect(manager.writesSuspended()).toBe(true);
        expect(mockedCaptureMessage).toHaveBeenCalledWith(
          'MetaMask - writes suspended: browser shutting down',
          expect.objectContaining({
            tags: expect.objectContaining({
              'persistence.shutdownTrigger': ShutdownTrigger.OnSuspend,
            }),
          }),
        );
      });

      it('does not honor a pending shutdown signal that was cancelled before the flag was enabled', () => {
        manager.suspendWrites(ShutdownTrigger.OnSuspend);
        manager.resumeWrites();

        manager.setShutdownSuspensionEnabled(true);

        expect(manager.writesSuspended()).toBe(false);
        expect(mockedCaptureMessage).not.toHaveBeenCalled();
      });

      it('preserves a pending shutdown across a no-op disable sync', () => {
        manager.suspendWrites(ShutdownTrigger.OnSuspend);
        // Startup often re-applies `false` while the flag is still default-off.
        manager.setShutdownSuspensionEnabled(false);

        manager.setShutdownSuspensionEnabled(true);

        expect(manager.writesSuspended()).toBe(true);
        expect(mockedCaptureMessage).toHaveBeenCalledWith(
          'MetaMask - writes suspended: browser shutting down',
          expect.objectContaining({
            tags: expect.objectContaining({
              'persistence.shutdownTrigger': ShutdownTrigger.OnSuspend,
            }),
          }),
        );
      });

      it('does not let a later inferred trigger demote a pending onSuspend', () => {
        manager.suspendWrites(ShutdownTrigger.OnSuspend);
        manager.suspendWrites(ShutdownTrigger.IdbClose);

        manager.setShutdownSuspensionEnabled(true);

        expect(manager.writesSuspended()).toBe(true);
        expect(mockedCaptureMessage).toHaveBeenCalledWith(
          'MetaMask - writes suspended: browser shutting down',
          expect.objectContaining({
            tags: expect.objectContaining({
              'persistence.shutdownTrigger': ShutdownTrigger.OnSuspend,
            }),
          }),
        );
      });

      it('drops pending when the feature is turned off after having been enabled', () => {
        manager.setShutdownSuspensionEnabled(true);
        manager.suspendWrites(ShutdownTrigger.OnSuspend);
        manager.setShutdownSuspensionEnabled(false);

        // Re-enable must not inherit the previous suspension or a pending signal.
        manager.setShutdownSuspensionEnabled(true);

        expect(manager.writesSuspended()).toBe(false);
        expect(mockedCaptureMessage).toHaveBeenCalledTimes(1);
        expect(mockedCaptureMessage).toHaveBeenCalledWith(
          'MetaMask - writes suspended: browser shutting down',
          expect.objectContaining({
            tags: expect.objectContaining({
              'persistence.event': 'writes-suspended-shutdown',
              'persistence.shutdownTrigger': ShutdownTrigger.OnSuspend,
            }),
          }),
        );
      });
    });

    describe('reactive detection (data storageKind / set)', () => {
      beforeEach(() => {
        manager.storageKind = 'data';
        manager.setMetadata({ version: 10 });
      });

      it('suspends silently when the write reports the browser is shutting down', async () => {
        manager.setShutdownSuspensionEnabled(true);
        const onSetFailed = jest.fn();
        manager.setOnSetFailed(onSetFailed);
        mockStoreSet.mockRejectedValueOnce(
          new Error('The browser is shutting down.'),
        );

        const [result, error] = await manager.set({ appState: { test: 1 } });

        expect(result).toBe(false);
        expect(error).toBeUndefined();
        expect(manager.writesSuspended()).toBe(true);
        // Shutdown errors skip the write-retry delay; only one attempt.
        expect(mockStoreSet).toHaveBeenCalledTimes(1);
        // no failure toast and no error report
        expect(onSetFailed).not.toHaveBeenCalled();
        expect(mockedCaptureException).not.toHaveBeenCalled();
      });

      it('short-circuits subsequent writes once suspended', async () => {
        manager.setShutdownSuspensionEnabled(true);
        mockStoreSet.mockRejectedValueOnce(
          new Error('The browser is shutting down.'),
        );

        await manager.set({ appState: { test: 1 } });
        expect(mockStoreSet).toHaveBeenCalledTimes(1);

        const [result, error] = await manager.set({ appState: { test: 2 } });

        // the second write never reaches the store
        expect(mockStoreSet).toHaveBeenCalledTimes(1);
        expect(result).toBe(false);
        expect(error).toBeUndefined();
      });

      it('does not start a write when suspension begins while opening storage', async () => {
        manager.setShutdownSuspensionEnabled(true);
        let resolveOpen: (() => void) | undefined;
        const openPromise = new Promise<void>((resolve) => {
          resolveOpen = resolve;
        });
        const openSpy = jest
          .spyOn(manager, 'open')
          .mockReturnValue(openPromise);

        const setPromise = manager.set({ appState: { test: 1 } });
        manager.suspendWrites(ShutdownTrigger.OnSuspend);
        resolveOpen?.();

        const [result, error] = await setPromise;

        expect(mockStoreSet).not.toHaveBeenCalled();
        expect(result).toBe(false);
        expect(error).toBeUndefined();

        openSpy.mockRestore();
      });

      it('reports the error normally when the feature flag is disabled', async () => {
        prepareForWriteRetry();
        const onSetFailed = jest.fn();
        manager.setOnSetFailed(onSetFailed);
        const error = new Error('The browser is shutting down.');
        // Flag off: the write-retry path still runs, so both attempts must fail.
        mockStoreSet.mockRejectedValueOnce(error).mockRejectedValueOnce(error);

        const setPromise = manager.set({
          appState: { test: 1 },
        });
        await jest.advanceTimersByTimeAsync(0);
        await jest.advanceTimersByTimeAsync(WRITE_RETRY_DELAY_MS);
        const [result, persistError] = await setPromise;

        expect(result).toBe(false);
        expect(persistError).toBe(error);
        expect(manager.writesSuspended()).toBe(false);
        expect(mockStoreSet).toHaveBeenCalledTimes(2);
        expect(onSetFailed).toHaveBeenCalledTimes(1);
        expect(mockedCaptureException).toHaveBeenCalledWith(error, {
          tags: { 'persistence.error': 'set-failed' },
          fingerprint: ['persistence-error', 'set-failed'],
        });
      });
    });

    describe('reactive detection (split storageKind / persist)', () => {
      beforeEach(() => {
        manager.storageKind = 'split';
        manager.setMetadata({ version: 10 });
      });

      it('suspends silently when the write reports the browser is shutting down', async () => {
        manager.setShutdownSuspensionEnabled(true);
        const onSetFailed = jest.fn();
        manager.setOnSetFailed(onSetFailed);
        mockStoreSetKeyValues.mockRejectedValueOnce(
          new Error('The browser is shutting down.'),
        );

        const [result, error] = await manager.persist();

        expect(result).toBe(false);
        expect(error).toBeUndefined();
        expect(manager.writesSuspended()).toBe(true);
        expect(mockStoreSetKeyValues).toHaveBeenCalledTimes(1);
        expect(onSetFailed).not.toHaveBeenCalled();
        expect(mockedCaptureException).not.toHaveBeenCalled();
      });

      it('short-circuits subsequent persists once suspended', async () => {
        manager.setShutdownSuspensionEnabled(true);
        mockStoreSetKeyValues.mockRejectedValueOnce(
          new Error('The browser is shutting down.'),
        );

        await manager.persist();
        expect(mockStoreSetKeyValues).toHaveBeenCalledTimes(1);

        const [result, error] = await manager.persist();

        expect(mockStoreSetKeyValues).toHaveBeenCalledTimes(1);
        expect(result).toBe(false);
        expect(error).toBeUndefined();
      });

      it('does not start a persist when suspension begins while opening storage', async () => {
        manager.setShutdownSuspensionEnabled(true);
        manager.update('FooController', { foo: 'bar' });
        let resolveOpen: (() => void) | undefined;
        const openPromise = new Promise<void>((resolve) => {
          resolveOpen = resolve;
        });
        const openSpy = jest
          .spyOn(manager, 'open')
          .mockReturnValue(openPromise);

        const persistPromise = manager.persist();
        manager.suspendWrites(ShutdownTrigger.OnSuspend);
        resolveOpen?.();

        const [result, error] = await persistPromise;

        expect(mockStoreSetKeyValues).not.toHaveBeenCalled();
        expect(result).toBe(false);
        expect(error).toBeUndefined();

        manager.resumeWrites();
        await new Promise<void>((resolve) => {
          setImmediate(resolve);
        });
        expect(mockStoreSetKeyValues).toHaveBeenCalledTimes(1);

        openSpy.mockRestore();
      });
    });

    describe('reset', () => {
      it('clears the suspended state', async () => {
        manager.setShutdownSuspensionEnabled(true);
        manager.suspendWrites();
        expect(manager.writesSuspended()).toBe(true);

        await manager.reset();

        expect(manager.writesSuspended()).toBe(false);
      });
    });

    describe('backup IndexedDB force-close telemetry', () => {
      // Captures the IndexedDBStore instance created inside #openBackupDatabase
      // so we can invoke the wired `onForcedClose` handler directly.
      async function openAndCaptureBackupStore(): Promise<IndexedDBStore> {
        const created: IndexedDBStore[] = [];
        const openSpy = jest
          .spyOn(IndexedDBStore.prototype, 'open')
          .mockImplementation(async function (this: IndexedDBStore) {
            created.push(this);
          });
        // open() is mocked without a live handle; stub isOpen so the manager
        // records `#open = true` the same way a real successful open would.
        const isOpenSpy = jest
          .spyOn(IndexedDBStore.prototype, 'isOpen')
          .mockReturnValue(true);
        await manager.open();
        openSpy.mockRestore();
        isOpenSpy.mockRestore();
        const [backupStore] = created;
        if (!backupStore) {
          throw new Error('backup store was not created');
        }
        return backupStore;
      }

      it('reports a versionchange force-close even while the feature flag is disabled', async () => {
        const backupStore = await openAndCaptureBackupStore();

        backupStore.onForcedClose?.('versionchange');

        expect(mockedCaptureMessage).toHaveBeenCalledWith(
          'MetaMask - backup IndexedDB force-closed',
          expect.objectContaining({
            level: 'info',
            tags: expect.objectContaining({
              'persistence.event': 'backup-idb-forced-close',
              'persistence.idbCloseReason': 'versionchange',
            }),
          }),
        );
        // Telemetry is emitted at the source, so suspension stays flag-gated.
        expect(manager.writesSuspended()).toBe(false);
      });

      it('reports a close force-close and suspends writes when the feature flag is enabled', async () => {
        manager.setShutdownSuspensionEnabled(true);
        const backupStore = await openAndCaptureBackupStore();

        backupStore.onForcedClose?.('close');

        expect(mockedCaptureMessage).toHaveBeenCalledWith(
          'MetaMask - backup IndexedDB force-closed',
          expect.objectContaining({
            level: 'info',
            tags: expect.objectContaining({
              'persistence.event': 'backup-idb-forced-close',
              'persistence.idbCloseReason': 'close',
            }),
          }),
        );
        expect(manager.writesSuspended()).toBe(true);

        // Clear the recovery timer scheduled by the idb-close suspension.
        manager.resumeWrites();
      });

      it('reconnects the backup database after a force-close so later opens are not no-ops', async () => {
        manager.setShutdownSuspensionEnabled(true);
        const backupStore = await openAndCaptureBackupStore();

        // OnSuspend owns the suspension; a later force-close must still clear
        // `#open` so resume + the next write can reconnect the backup handle.
        manager.suspendWrites(ShutdownTrigger.OnSuspend);
        backupStore.onForcedClose?.('close');
        manager.resumeWrites();

        const openSpy = jest
          .spyOn(IndexedDBStore.prototype, 'open')
          .mockResolvedValue(undefined);
        const setSpy = jest
          .spyOn(IndexedDBStore.prototype, 'set')
          .mockResolvedValue(undefined);
        mockStoreSet.mockResolvedValue(undefined);

        manager.storageKind = 'data';
        manager.setMetadata({ version: 10 });
        const [ok, error] = await manager.set({
          KeyringController: { vault: 'encrypted-vault' },
        } as unknown as MetaMaskStateType);

        expect(ok).toBe(true);
        expect(error).toBeUndefined();
        expect(openSpy).toHaveBeenCalledTimes(1);
        expect(setSpy).toHaveBeenCalled();
        openSpy.mockRestore();
        setSpy.mockRestore();
      });

      it('does not leave the backup marked open when a force-close races open completion', async () => {
        manager.setShutdownSuspensionEnabled(true);

        let openCalls = 0;
        const openSpy = jest
          .spyOn(IndexedDBStore.prototype, 'open')
          .mockImplementation(async function (this: IndexedDBStore) {
            openCalls += 1;
            if (openCalls === 1) {
              // onForcedClose is wired before open(); simulate a close that
              // finishes during the open turn and leaves the handle dead.
              this.onForcedClose?.('close');
            }
          });
        const isOpenSpy = jest
          .spyOn(IndexedDBStore.prototype, 'isOpen')
          .mockImplementation(() => openCalls >= 2);

        await manager.open();
        expect(manager.writesSuspended()).toBe(true);
        expect(openCalls).toBe(1);

        manager.resumeWrites();
        await manager.open();

        expect(openCalls).toBe(2);
        openSpy.mockRestore();
        isOpenSpy.mockRestore();
      });

      it('stays silent when backup IDB is force-closed mid-write after storage.local succeeds', async () => {
        manager.setShutdownSuspensionEnabled(true);
        const onSetFailed = jest.fn();
        manager.setOnSetFailed(onSetFailed);
        const backupStore = await openAndCaptureBackupStore();

        // storage.local succeeds; during the backup write the IDB is force-closed
        // (suspends writes) and then throws a generic disconnected-handle error.
        mockStoreSet.mockResolvedValue(undefined);
        const setSpy = jest
          .spyOn(IndexedDBStore.prototype, 'set')
          .mockImplementation(async () => {
            backupStore.onForcedClose?.('close');
            throw new Error('Database is not open');
          });

        manager.storageKind = 'data';
        manager.setMetadata({ version: 10 });
        const [result, error] = await manager.set({
          KeyringController: { vault: 'encrypted-vault' },
        } as unknown as MetaMaskStateType);

        expect(result).toBe(false);
        expect(error).toBeUndefined();
        expect(manager.writesSuspended()).toBe(true);
        expect(onSetFailed).not.toHaveBeenCalled();
        expect(mockedCaptureException).not.toHaveBeenCalled();
        setSpy.mockRestore();
      });
    });

    describe('recovery', () => {
      // How long the recovery probe waits; mirrors
      // SHUTDOWN_RECOVERY_INFERRED_MS in the implementation.
      const INFERRED_MS = 250;
      // How long the recovery probe waits; mirrors
      // SHUTDOWN_RECOVERY_ON_SUSPEND_MS in the implementation.
      const ON_SUSPEND_MS = 10_000;

      beforeEach(() => {
        jest.useFakeTimers();
        manager.setShutdownSuspensionEnabled(true);
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      it('resumes writes after a reactive suspension once storage is responsive again', async () => {
        // No backup DB was opened, so the probe falls back to storage.local.
        mockStoreGet.mockResolvedValue(MOCK_DATA);

        manager.suspendWrites(ShutdownTrigger.Reactive);
        expect(manager.writesSuspended()).toBe(true);

        await jest.advanceTimersByTimeAsync(INFERRED_MS);

        expect(mockStoreGet).toHaveBeenCalled();
        expect(manager.writesSuspended()).toBe(false);
        expect(mockedCaptureMessage).toHaveBeenCalledWith(
          'MetaMask - writes resumed: shutdown recovered',
          expect.objectContaining({
            level: 'info',
            tags: expect.objectContaining({
              'persistence.event': 'writes-resumed-recovery',
              'persistence.shutdownTrigger': ShutdownTrigger.Reactive,
            }),
          }),
        );
      });

      it('resumes writes after an idb-close suspension once both the backup database and storage.local respond', async () => {
        const openSpy = jest
          .spyOn(IndexedDBStore.prototype, 'open')
          .mockResolvedValue(undefined);
        const getSpy = jest
          .spyOn(IndexedDBStore.prototype, 'get')
          .mockResolvedValue([undefined]);
        mockStoreGet.mockResolvedValue(MOCK_DATA);
        // Populate #backupDb so the probe exercises the IndexedDB path.
        await manager.open();

        manager.suspendWrites(ShutdownTrigger.IdbClose);
        expect(manager.writesSuspended()).toBe(true);

        await jest.advanceTimersByTimeAsync(INFERRED_MS);

        // Both stores are probed before resuming.
        expect(openSpy).toHaveBeenCalledWith('metamask-backup', 1);
        expect(getSpy).toHaveBeenCalledWith(['meta']);
        expect(mockStoreGet).toHaveBeenCalled();
        expect(manager.writesSuspended()).toBe(false);

        openSpy.mockRestore();
        getSpy.mockRestore();
      });

      it('stays suspended while the backup database is healthy but storage.local still fails', async () => {
        const openSpy = jest
          .spyOn(IndexedDBStore.prototype, 'open')
          .mockResolvedValue(undefined);
        const getSpy = jest
          .spyOn(IndexedDBStore.prototype, 'get')
          .mockResolvedValue([undefined]);
        // The backup DB always responds, but storage.local fails once then
        // recovers. Writes must not resume until storage.local is responsive.
        mockStoreGet
          .mockRejectedValueOnce(new Error('The browser is shutting down.'))
          .mockResolvedValueOnce(MOCK_DATA);
        await manager.open();

        manager.suspendWrites(ShutdownTrigger.IdbClose);

        await jest.advanceTimersByTimeAsync(INFERRED_MS);
        // storage.local still failing: stay suspended despite a healthy backup DB.
        expect(manager.writesSuspended()).toBe(true);

        await jest.advanceTimersByTimeAsync(INFERRED_MS);
        // storage.local recovered: now writes resume.
        expect(manager.writesSuspended()).toBe(false);

        openSpy.mockRestore();
        getSpy.mockRestore();
      });

      it('keeps retrying while storage stays unresponsive and resumes on the first success', async () => {
        mockStoreGet
          .mockRejectedValueOnce(new Error('still shutting down'))
          .mockResolvedValueOnce(MOCK_DATA);

        manager.suspendWrites(ShutdownTrigger.Reactive);

        await jest.advanceTimersByTimeAsync(INFERRED_MS);
        // First probe failed: still suspended and scheduled again.
        expect(manager.writesSuspended()).toBe(true);

        await jest.advanceTimersByTimeAsync(INFERRED_MS);
        // Second probe succeeded: writes resume.
        expect(manager.writesSuspended()).toBe(false);
        expect(mockStoreGet).toHaveBeenCalledTimes(2);
      });

      it('resumes writes after an onSuspend suspension whose cancellation never arrives', async () => {
        mockStoreGet.mockResolvedValue(MOCK_DATA);

        manager.suspendWrites(ShutdownTrigger.OnSuspend);

        // The lifecycle signal gets a much longer grace period than an
        // inferred trigger, so nothing happens on the inferred schedule.
        await jest.advanceTimersByTimeAsync(INFERRED_MS * 4);
        expect(mockStoreGet).not.toHaveBeenCalled();
        expect(manager.writesSuspended()).toBe(true);

        await jest.advanceTimersByTimeAsync(ON_SUSPEND_MS);

        expect(mockStoreGet).toHaveBeenCalled();
        expect(manager.writesSuspended()).toBe(false);
        expect(mockedCaptureMessage).toHaveBeenCalledWith(
          'MetaMask - writes resumed: shutdown recovered',
          expect.objectContaining({
            level: 'info',
            tags: expect.objectContaining({
              'persistence.event': 'writes-resumed-recovery',
              'persistence.shutdownTrigger': ShutdownTrigger.OnSuspend,
            }),
          }),
        );
      });

      it('keeps writes suspended while storage stays unresponsive after onSuspend', async () => {
        mockStoreGet.mockRejectedValue(
          new Error('The browser is shutting down.'),
        );

        manager.suspendWrites(ShutdownTrigger.OnSuspend);

        await jest.advanceTimersByTimeAsync(ON_SUSPEND_MS * 3);

        expect(manager.writesSuspended()).toBe(true);
      });

      it('replaces a pending inferred recovery with the longer window when onSuspend takes ownership', async () => {
        mockStoreGet.mockResolvedValue(MOCK_DATA);
        manager.suspendWrites(ShutdownTrigger.Reactive);
        manager.suspendWrites(ShutdownTrigger.OnSuspend);

        await jest.advanceTimersByTimeAsync(INFERRED_MS * 4);
        expect(mockStoreGet).not.toHaveBeenCalled();
        expect(manager.writesSuspended()).toBe(true);

        await jest.advanceTimersByTimeAsync(ON_SUSPEND_MS);
        expect(manager.writesSuspended()).toBe(false);
      });

      it('does not let a later inferred trigger shorten an onSuspend suspension', async () => {
        mockStoreGet.mockResolvedValue(MOCK_DATA);
        manager.suspendWrites(ShutdownTrigger.OnSuspend);
        manager.suspendWrites(ShutdownTrigger.Reactive);
        manager.suspendWrites(ShutdownTrigger.IdbClose);

        await jest.advanceTimersByTimeAsync(INFERRED_MS * 4);

        expect(mockStoreGet).not.toHaveBeenCalled();
        expect(manager.writesSuspended()).toBe(true);
      });

      it('allows inferred recovery again after onSuspendCanceled resumes writes', async () => {
        mockStoreGet.mockResolvedValue(MOCK_DATA);
        manager.suspendWrites(ShutdownTrigger.OnSuspend);
        manager.resumeWrites();

        manager.suspendWrites(ShutdownTrigger.Reactive);
        await jest.advanceTimersByTimeAsync(INFERRED_MS);

        expect(mockStoreGet).toHaveBeenCalled();
        expect(manager.writesSuspended()).toBe(false);
      });

      it('cancels a pending recovery probe when writes resume', async () => {
        manager.suspendWrites(ShutdownTrigger.Reactive);
        manager.resumeWrites();

        await jest.advanceTimersByTimeAsync(INFERRED_MS);

        expect(mockStoreGet).not.toHaveBeenCalled();
      });

      it('cancels a pending recovery probe on reset', async () => {
        manager.suspendWrites(ShutdownTrigger.Reactive);
        await manager.reset();

        await jest.advanceTimersByTimeAsync(INFERRED_MS);

        expect(mockStoreGet).not.toHaveBeenCalled();
      });

      it('cancels a pending recovery probe when suspension is disabled', async () => {
        manager.suspendWrites(ShutdownTrigger.Reactive);
        manager.setShutdownSuspensionEnabled(false);

        await jest.advanceTimersByTimeAsync(INFERRED_MS);

        expect(mockStoreGet).not.toHaveBeenCalled();
      });
    });
  });

  describe('Locks', () => {
    it('should acquire a lock when setting state', async () => {
      manager.storageKind = 'data';
      manager.setMetadata({ version: 10 });

      jest
        .spyOn(manager, 'open')
        .mockImplementation()
        .mockResolvedValue(undefined);

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

    it('resolves silently when a queued write is aborted (superseded or shutting down)', async () => {
      manager.storageKind = 'data';
      manager.setMetadata({ version: 10 });
      manager.setShutdownSuspensionEnabled(true);
      jest.spyOn(manager, 'open').mockResolvedValue(undefined);

      const onSetFailed = jest.fn();
      manager.setOnSetFailed(onSetFailed);

      // Simulate a real browser rejecting a queued lock request with an
      // AbortError once its signal is aborted (the `navigator.locks` polyfill
      // resolves instead of rejecting, so we mock the rejection here).
      const originalRequest = navigator.locks.request;
      navigator.locks.request = jest
        .fn()
        .mockImplementation((_name, options: { signal: AbortSignal }) => {
          return new Promise((_resolve, reject) => {
            options.signal.addEventListener('abort', () => {
              reject(
                new DOMException('The request was aborted.', 'AbortError'),
              );
            });
          });
        }) as typeof navigator.locks.request;

      try {
        const write = manager.set({ appState: { test: 1 } });
        await Promise.resolve();

        // A browser shutdown aborts the still-queued write.
        manager.suspendWrites(ShutdownTrigger.OnSuspend);

        const [result, error] = await write;
        expect(result).toBe(false);
        expect(error).toBeUndefined();
        // The aborted write is not reported as a failure.
        expect(onSetFailed).not.toHaveBeenCalled();
        expect(mockedCaptureException).not.toHaveBeenCalled();
      } finally {
        navigator.locks.request = originalRequest;
      }
    });

    it('rethrows non-abort errors from the lock request', async () => {
      manager.storageKind = 'data';
      manager.setMetadata({ version: 10 });
      jest.spyOn(manager, 'open').mockResolvedValue(undefined);

      const originalRequest = navigator.locks.request;
      navigator.locks.request = jest
        .fn()
        .mockRejectedValue(
          new Error('unexpected lock failure'),
        ) as typeof navigator.locks.request;

      try {
        await expect(manager.set({ appState: { test: 1 } })).rejects.toThrow(
          'unexpected lock failure',
        );
      } finally {
        navigator.locks.request = originalRequest;
      }
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

    it('handles DOMException InvalidStateError: A mutation operation was attempted on a database that did not allow mutations.', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

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

      expect(mockedCaptureException).toHaveBeenCalledWith(domException, {
        tags: { 'persistence.error': 'backup-db-open-failed' },
        fingerprint: ['persistence-error', 'backup-db-open-failed'],
      });
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Could not open backup database; automatic vault recovery will not be available.',
      );
    });

    it('bubbles up IndexedDB error on initialization', async () => {
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
