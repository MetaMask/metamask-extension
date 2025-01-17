import browser from 'webextension-polyfill';
import { awaitOffscreenDocumentCreation } from '../../offscreen';
import { OffscreenCommunicationTarget } from '../../../../shared/constants/offscreen-communication';
import { LocalStorageWithOffScreenStore } from './LocalStorageWithOffScreenStore';

describe('LocalStorageWithOffScreenStore', () => {
  let localStorageMock: Record<string, string>;

  beforeEach(() => {
    // Mock localStorage
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

    // Mock offscreen utilities
    jest.mock('../../offscreen', () => ({
      awaitOffscreenDocumentCreation: jest.fn().mockResolvedValue(undefined),
    }));
    jest.mock('../../../../shared/modules/mv3.utils', () => ({
      isOffscreenAvailable: true,
    }));

    // Mock browser.runtime
    browser.runtime.sendMessage = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('get', () => {
    it('retrieves data from offscreen when offscreen is available', async () => {
      (browser.runtime.sendMessage as jest.Mock).mockImplementation(
        (params, callback) => {
          if (
            params.target ===
              OffscreenCommunicationTarget.localStorageOffScreen &&
            params.action === 'getItem'
          ) {
            callback({ value: { testKey: 'testValue' } });
          }
        },
      );

      const store = new LocalStorageWithOffScreenStore();
      const result = await store.get();

      expect(awaitOffscreenDocumentCreation).toHaveBeenCalled();
      expect(browser.runtime.sendMessage).toHaveBeenCalledWith(
        {
          target: OffscreenCommunicationTarget.localStorageOffScreen,
          action: 'getItem',
        },
        expect.any(Function),
      );
      expect(result).toEqual({ testKey: 'testValue' });
    });

    it('retrieves data from localStorage when offscreen is unavailable', async () => {
      jest.mock('../../../../shared/modules/mv3.utils', () => ({
        isOffscreenAvailable: false,
      }));
      localStorageMock.state = JSON.stringify({ testKey: 'testValue' });

      const store = new LocalStorageWithOffScreenStore();
      const result = await store.get();

      expect(window.localStorage.getItem).toHaveBeenCalledWith('state');
      expect(result).toEqual({ testKey: 'testValue' });
    });

    it('returns null if no data is found in localStorage', async () => {
      jest.mock('../../../../shared/modules/mv3.utils', () => ({
        isOffscreenAvailable: false,
      }));

      const store = new LocalStorageWithOffScreenStore();
      const result = await store.get();

      expect(window.localStorage.getItem).toHaveBeenCalledWith('state');
      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('stores data using offscreen when offscreen is available', async () => {
      const state = { testKey: 'testValue' };

      const store = new LocalStorageWithOffScreenStore();
      await store.set(state);

      expect(awaitOffscreenDocumentCreation).toHaveBeenCalled();
      expect(browser.runtime.sendMessage).toHaveBeenCalledWith(
        {
          target: OffscreenCommunicationTarget.localStorageOffScreen,
          action: 'setItem',
          key: 'state',
          state,
        },
        expect.any(Function),
      );
    });

    it('stores data in localStorage when offscreen is unavailable', async () => {
      jest.mock('../../../../shared/modules/mv3.utils', () => ({
        isOffscreenAvailable: false,
      }));
      const state = { testKey: 'testValue' };

      const store = new LocalStorageWithOffScreenStore();
      await store.set(state);

      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'state',
        JSON.stringify(state),
      );
    });
  });
});
