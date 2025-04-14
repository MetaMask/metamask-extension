import browser from 'webextension-polyfill';
import { ExtensionUpdateManager } from './extension-update-manager';

// Mock the webextension-polyfill
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

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    updateManager = new ExtensionUpdateManager();
  });

  describe('initialize', () => {
    it('should add an update available listener', () => {
      updateManager.initialize();

      expect(browser.runtime.onUpdateAvailable.addListener).toHaveBeenCalled();
    });
  });

  describe('handleUpdateAvailable', () => {
    it('should mark update as pending and remove the listener', () => {
      // Access private method using type assertion with the class structure
      type PrivateExtensionUpdateManager = {
        handleUpdateAvailable: () => void;
      };

      const handleUpdateAvailable = (
        updateManager as unknown as PrivateExtensionUpdateManager
      ).handleUpdateAvailable.bind(updateManager);

      // Call the handler directly
      handleUpdateAvailable();

      // Check that the listener was removed
      expect(
        browser.runtime.onUpdateAvailable.removeListener,
      ).toHaveBeenCalled();

      // Check that update is marked as pending by calling applyPendingUpdateIfNeeded
      updateManager.applyPendingUpdateIfNeeded();
      expect(browser.runtime.reload).toHaveBeenCalled();
    });
  });

  describe('applyPendingUpdateIfNeeded', () => {
    it('should not reload if no update is pending', () => {
      updateManager.applyPendingUpdateIfNeeded();

      expect(browser.runtime.reload).not.toHaveBeenCalled();
    });

    it('should reload if an update is pending', () => {
      // Access private property using type assertion with the class structure
      type PrivateExtensionUpdateManager = {
        updatePending: boolean;
      };

      (
        updateManager as unknown as PrivateExtensionUpdateManager
      ).updatePending = true;

      updateManager.applyPendingUpdateIfNeeded();

      expect(browser.runtime.reload).toHaveBeenCalled();
    });

    it('should handle errors during reload', () => {
      // Access private property using type assertion with the class structure
      type PrivateExtensionUpdateManager = {
        updatePending: boolean;
      };

      (
        updateManager as unknown as PrivateExtensionUpdateManager
      ).updatePending = true;

      // Mock console.error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Make reload throw an error
      (browser.runtime.reload as jest.Mock).mockImplementation(() => {
        throw new Error('Reload failed');
      });

      updateManager.applyPendingUpdateIfNeeded();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to reload extension:',
        expect.any(Error),
      );

      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });
});
