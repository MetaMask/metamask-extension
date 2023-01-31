import browser from 'webextension-polyfill';
import LocalStore from './local-store';

jest.mock('webextension-polyfill', () => ({
  storage: { local: true },
}));

const setup = ({ isSupported }) => {
  browser.storage.local = isSupported;
  return new LocalStore();
};
describe('LocalStore', () => {
  afterEach(() => {
    jest.resetModules();
  });
  describe('contructor', () => {
    it('should set isSupported property to false when browser does not support local storage', () => {
      const localStore = setup({ isSupported: false });

      expect(localStore.isSupported).toBe(false);
    });

    it('should set isSupported property to true when browser supports local storage', () => {
      const localStore = setup({ isSupported: true });
      expect(localStore.isSupported).toBe(true);
    });
  });

  describe('setMetadata', () => {
    it('should set the metadata property on LocalStore', () => {
      const metadata = { version: 74 };
      const localStore = setup({ isSupported: true });
      localStore.setMetadata(metadata);

      expect(localStore.metadata).toStrictEqual(metadata);
    });
  });

  describe('set', () => {
    it('should throw an error if called in a browser that does not support local storage', async () => {
      const localStore = setup({ isSupported: false });
      await expect(() => localStore.set()).rejects.toThrow(
        'Metamask- cannot persist state to local store as this browser does not support this action',
      );
    });

    it('should throw an error if not passed a truthy value as an argument', async () => {
      const localStore = setup({ isSupported: true });
      await expect(() => localStore.set()).rejects.toThrow(
        'MetaMask - updated state is missing',
      );
    });

    it('should throw an error if passed a valid argument but metadata has not yet been set', async () => {
      const localStore = setup({ isSupported: true });
      await expect(() =>
        localStore.set({ appState: { test: true } }),
      ).rejects.toThrow(
        'MetaMask - metadata must be set on instance of ExtensionStore before calling "set"',
      );
    });

    it('should not throw if passed a valid argument and metadata has been set', async () => {
      const localStore = setup({ isSupported: true });
      localStore.setMetadata({ version: 74 });
      await expect(async function () {
        localStore.set({ appState: { test: true } });
      }).not.toThrow();
    });
  });

  describe('get', () => {
    it('should return undefined if called in a browser that does not support local storage', async () => {
      const localStore = setup({ isSupported: false });
      const result = await localStore.get();
      expect(result).toStrictEqual(undefined);
    });
  });
});
