import browser from 'webextension-polyfill';
import { awaitOffscreenDocumentCreation } from '../../offscreen';
import { OffscreenCommunicationTarget } from '../../../../shared/constants/offscreen-communication';

jest.mock('../../offscreen', () => ({
  awaitOffscreenDocumentCreation: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../../shared/modules/mv3.utils', () => ({
  isOffscreenAvailable: true,
}));

jest.mock('webextension-polyfill', () => ({
  runtime: {
    sendMessage: jest
      .fn()
      .mockResolvedValue({ value: { testKey: 'testValue' } }),
  },
}));

describe('LocalStorageWithOffScreenStore', () => {
  let LocalStorageWithOffScreenStore;
  let localStorageMock: Record<string, string>;

  beforeEach(() => {
    localStorageMock = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key) => localStorageMock[key] || null),
        setItem: jest.fn((key, value) => {
          localStorageMock[key] = value;
        }),
        removeItem: jest.fn((key) => {
          delete localStorageMock[key];
        }),
      },
      writable: true,
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
  });

  describe('get', () => {
    it('retrieves data from offscreen when offscreen is available', async () => {
      jest.doMock('../../../../shared/modules/mv3.utils', () => ({
        isOffscreenAvailable: true,
      }));

      const module = await import('./local-storage-with-offscreen-store');
      LocalStorageWithOffScreenStore = module.default;

      const store = new LocalStorageWithOffScreenStore();
      const result = await store.get();

      expect(awaitOffscreenDocumentCreation).toHaveBeenCalled();
      expect(browser.runtime.sendMessage).toHaveBeenCalledWith(undefined, {
        target: OffscreenCommunicationTarget.localStorageOffScreen,
        action: 'getItem',
      });
      expect(result).toEqual({ testKey: 'testValue' });
    });

    it('retrieves data from localStorage when offscreen is unavailable', async () => {
      jest.doMock('../../../../shared/modules/mv3.utils', () => ({
        isOffscreenAvailable: false,
      }));

      const module = await import('./local-storage-with-offscreen-store');
      LocalStorageWithOffScreenStore = module.default;

      localStorageMock.state = JSON.stringify({ testKey: 'testValue' });

      const store = new LocalStorageWithOffScreenStore();
      const result = await store.get();

      expect(window.localStorage.getItem).toHaveBeenCalledWith('state');
      expect(result).toEqual({ testKey: 'testValue' });
    });

    it('returns null if no data is found in localStorage', async () => {
      jest.doMock('../../../../shared/modules/mv3.utils', () => ({
        isOffscreenAvailable: false,
      }));

      const module = await import('./local-storage-with-offscreen-store');
      LocalStorageWithOffScreenStore = module.default;

      const store = new LocalStorageWithOffScreenStore();
      const result = await store.get();

      expect(window.localStorage.getItem).toHaveBeenCalledWith('state');
      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('stores data using offscreen when offscreen is available', async () => {
      jest.resetModules();

      jest.doMock('webextension-polyfill', () => ({
        runtime: {
          sendMessage: jest
            .fn()
            .mockResolvedValue({ value: { testKey: 'testValue' } }),
        },
      }));

      jest.doMock('../../../../shared/modules/mv3.utils', () => ({
        isOffscreenAvailable: true,
      }));

      const module = await import('./local-storage-with-offscreen-store');
      LocalStorageWithOffScreenStore = module.default;

      const { runtime } = await import('webextension-polyfill');

      const store = new LocalStorageWithOffScreenStore();
      const state = { data: { testKey: 'testValue' } };

      await store.set(state);

      expect(runtime.sendMessage).toHaveBeenCalledTimes(1);
      expect(runtime.sendMessage).toHaveBeenCalledWith(undefined, {
        target: OffscreenCommunicationTarget.localStorageOffScreen,
        action: 'setItem',
        key: 'state',
        value: JSON.stringify(state),
      });
    });

    it('stores data in localStorage when offscreen is unavailable', async () => {
      jest.doMock('../../../../shared/modules/mv3.utils', () => ({
        isOffscreenAvailable: false,
      }));

      const module = await import('./local-storage-with-offscreen-store');
      LocalStorageWithOffScreenStore = module.default;

      const state = { data: { testKey: 'testValue' } };

      const store = new LocalStorageWithOffScreenStore();
      await store.set(state);

      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'state',
        JSON.stringify(state),
      );
    });
  });
});
