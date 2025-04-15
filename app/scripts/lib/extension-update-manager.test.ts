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

  beforeEach(() => {
    jest.clearAllMocks();
    updateManager = new ExtensionUpdateManager();
  });

  describe('initialize', () => {
    it('should set up event listeners for update detection', () => {
      updateManager.initialize();

      expect(browser.runtime.onUpdateAvailable.addListener).toHaveBeenCalled();
    });
  });

  describe('setIdleState', () => {
    it('should update idle state and apply pending updates when becoming idle', () => {
      const applyUpdateSpy = jest.spyOn(
        updateManager,
        'applyPendingUpdateIfNeeded',
      );

      // Set a pending update via private property
      Object.defineProperty(updateManager, 'updatePending', { value: true });

      // Set to idle
      updateManager.setIdleState(true);

      expect(applyUpdateSpy).toHaveBeenCalled();
    });

    it('should not apply updates when becoming idle with no pending updates', () => {
      const applyUpdateSpy = jest.spyOn(
        updateManager,
        'applyPendingUpdateIfNeeded',
      );

      // Ensure no pending update
      Object.defineProperty(updateManager, 'updatePending', { value: false });

      updateManager.setIdleState(true);

      expect(applyUpdateSpy).not.toHaveBeenCalled();
    });
  });

  describe('applyPendingUpdateIfNeeded', () => {
    it('should reload the extension when update is pending and extension is idle', () => {
      Object.defineProperty(updateManager, 'updatePending', { value: true });
      Object.defineProperty(updateManager, 'isIdle', { value: true });

      updateManager.applyPendingUpdateIfNeeded();

      expect(browser.runtime.reload).toHaveBeenCalled();
    });

    it('should not reload the extension when not idle', () => {
      Object.defineProperty(updateManager, 'updatePending', { value: true });
      Object.defineProperty(updateManager, 'isIdle', { value: false });

      updateManager.applyPendingUpdateIfNeeded();

      expect(browser.runtime.reload).not.toHaveBeenCalled();
    });

    it('should not reload the extension when no update is pending', () => {
      Object.defineProperty(updateManager, 'updatePending', { value: false });
      Object.defineProperty(updateManager, 'isIdle', { value: true });

      updateManager.applyPendingUpdateIfNeeded();

      expect(browser.runtime.reload).not.toHaveBeenCalled();
    });
  });

  describe('handleUpdateAvailable', () => {
    it('should mark update as pending and remove the listener', () => {
      // Use type assertion to access the private method
      const handleUpdateAvailable = (
        updateManager as unknown as { handleUpdateAvailable: () => void }
      ).handleUpdateAvailable.bind(updateManager);

      handleUpdateAvailable();

      // Check if the listener was removed
      expect(
        browser.runtime.onUpdateAvailable.removeListener,
      ).toHaveBeenCalled();

      // Check if updatePending was set to true using type assertion
      expect(
        (updateManager as unknown as { updatePending: boolean }).updatePending,
      ).toBe(true);
    });

    it('should apply update immediately if already idle', () => {
      Object.defineProperty(updateManager, 'isIdle', { value: true });

      const applyUpdateSpy = jest.spyOn(
        updateManager,
        'applyPendingUpdateIfNeeded',
      );

      // Access the private method using type assertion
      const handleUpdateAvailable = (
        updateManager as unknown as { handleUpdateAvailable: () => void }
      ).handleUpdateAvailable.bind(updateManager);

      handleUpdateAvailable();

      expect(applyUpdateSpy).toHaveBeenCalled();
    });
  });
});
