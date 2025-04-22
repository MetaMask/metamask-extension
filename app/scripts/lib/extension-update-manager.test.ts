import browser from 'webextension-polyfill';
import { ExtensionUpdateManager } from './extension-update-manager';

jest.mock('webextension-polyfill', () => ({
  runtime: {
    onUpdateAvailable: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    reload: jest.fn(),
  },
}));

describe('ExtensionUpdateManager', () => {
  let updateManager: ExtensionUpdateManager;
  let applyUpdateSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    updateManager = new ExtensionUpdateManager();
    applyUpdateSpy = jest.spyOn(
      updateManager,
      'applyPendingUpdate' as keyof ExtensionUpdateManager,
    );
  });

  describe('initialize', () => {
    it('should set up event listeners for update detection', () => {
      updateManager.initialize();
      expect(browser.runtime.onUpdateAvailable.addListener).toHaveBeenCalled();
    });
  });

  describe('update handling workflow', () => {
    it('should mark update as pending when update is available', () => {
      updateManager.initialize();
      const updateAvailableHandler = (
        browser.runtime.onUpdateAvailable.addListener as jest.Mock
      ).mock.calls[0][0];
      updateAvailableHandler();
      expect(
        browser.runtime.onUpdateAvailable.removeListener,
      ).toHaveBeenCalled();
    });

    it('should apply pending update immediately if already idle', () => {
      updateManager.initialize();
      updateManager.setIdleState(true);
      const updateAvailableHandler = (
        browser.runtime.onUpdateAvailable.addListener as jest.Mock
      ).mock.calls[0][0];
      updateAvailableHandler();
      expect(applyUpdateSpy).toHaveBeenCalled();
      expect(browser.runtime.reload).toHaveBeenCalled();
    });

    it('should not apply update immediately if not idle', () => {
      updateManager.initialize();
      updateManager.setIdleState(false);
      const updateAvailableHandler = (
        browser.runtime.onUpdateAvailable.addListener as jest.Mock
      ).mock.calls[0][0];
      updateAvailableHandler();
      expect(applyUpdateSpy).not.toHaveBeenCalled();
      expect(browser.runtime.reload).not.toHaveBeenCalled();
    });

    it('should apply pending update when becoming idle', () => {
      updateManager.initialize();
      const updateAvailableHandler = (
        browser.runtime.onUpdateAvailable.addListener as jest.Mock
      ).mock.calls[0][0];
      updateAvailableHandler();
      applyUpdateSpy.mockClear();
      (browser.runtime.reload as jest.Mock).mockClear();
      updateManager.setIdleState(true);
      expect(applyUpdateSpy).toHaveBeenCalled();
      expect(browser.runtime.reload).toHaveBeenCalled();
    });

    it('should not apply updates when becoming idle with no pending updates', () => {
      updateManager.initialize();
      updateManager.setIdleState(true);
      expect(applyUpdateSpy).not.toHaveBeenCalled();
      expect(browser.runtime.reload).not.toHaveBeenCalled();
    });
  });
});
