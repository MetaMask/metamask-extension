import browser from 'webextension-polyfill';
import {
  CronjobControllerStorageManager,
  CronjobControllerStorageKey,
} from './CronjobControllerStorageManager';

jest.mock('webextension-polyfill', () => {
  return {
    storage: {
      local: {
        get: jest.fn(),
        set: jest.fn(),
      },
    },
  };
});
const mockedBrowser = jest.mocked(browser);

describe('CronjobControllerStorageManager', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockedBrowser.storage.local.get.mockImplementation(async () => {
      return {
        [CronjobControllerStorageKey]: {
          mockKey: 'mockData',
        },
      };
    });
    mockedBrowser.storage.local.set.mockImplementation(() => Promise.resolve());
  });

  describe('init', () => {
    it('requests the correct state key', async () => {
      const manager = new CronjobControllerStorageManager();

      await manager.init();

      expect(browser.storage.local.get).toHaveBeenCalledWith(
        CronjobControllerStorageKey,
      );
    });
  });

  describe('getInitialState', () => {
    it('throws if called before initialization', () => {
      const manager = new CronjobControllerStorageManager();

      expect(() => manager.getInitialState()).toThrow(
        'CronjobControllerStorageManager not yet initialized',
      );
    });

    it('returns initial controller state', async () => {
      const manager = new CronjobControllerStorageManager();
      await manager.init();

      const data = manager.getInitialState();

      expect(data).toStrictEqual({ mockKey: 'mockData' });
    });
  });

  describe('set', () => {
    it('throws if called before initialization', () => {
      const manager = new CronjobControllerStorageManager();

      expect(() => manager.set({ foo: 'bar' })).toThrow(
        'CronjobControllerStorageManager not yet initialized',
      );
    });

    it('sets state', async () => {
      const manager = new CronjobControllerStorageManager();
      await manager.init();

      manager.set({ updatedMockkey: 'updatedData' });

      expect(browser.storage.local.set).toHaveBeenCalledWith({
        [CronjobControllerStorageKey]: { updatedMockkey: 'updatedData' },
      });
    });
  });
});
