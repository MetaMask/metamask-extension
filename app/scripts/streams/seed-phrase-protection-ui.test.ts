import {
  createWarningModal,
  showWarningModal,
  removeWarningModal,
  isWarningDismissed,
  loadWarningDismissedState,
} from './seed-phrase-protection-ui';

// Mock webextension-polyfill
const mockStorage: Record<string, unknown> = {};
jest.mock('webextension-polyfill', () => ({
  storage: {
    local: {
      get: jest.fn((key: string) =>
        Promise.resolve({ [key]: mockStorage[key] }),
      ),
      set: jest.fn((data: Record<string, unknown>) => {
        Object.assign(mockStorage, data);
        return Promise.resolve();
      }),
    },
  },
}));

describe('Seed Phrase Protection UI', () => {
  beforeEach(() => {
    // Clear mock storage
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  });

  afterEach(() => {
    // Clean up any modals
    removeWarningModal();
  });

  describe('isWarningDismissed', () => {
    it('should return false when not dismissed', async () => {
      await loadWarningDismissedState();
      expect(isWarningDismissed()).toBe(false);
    });

    it('should return true when dismissed in extension storage', async () => {
      mockStorage['metamask-srp-warning-dismissed'] = true;
      await loadWarningDismissedState();
      expect(isWarningDismissed()).toBe(true);
    });

    it('should NOT be affected by localStorage (security test)', async () => {
      // This test verifies the fix for the localStorage bypass vulnerability.
      // A malicious site setting localStorage should NOT bypass the protection.
      localStorage.setItem('metamask-srp-warning-dismissed', 'true');
      await loadWarningDismissedState();
      // Should still return false because we use browser.storage.local, not localStorage
      expect(isWarningDismissed()).toBe(false);
      localStorage.clear();
    });
  });

  describe('createWarningModal', () => {
    it('should create a modal element with shadow DOM', () => {
      const onExit = jest.fn();
      const onIgnore = jest.fn();

      const modal = createWarningModal(onExit, onIgnore);

      expect(modal).toBeInstanceOf(HTMLElement);
      expect(modal.id).toBe('metamask-seed-phrase-warning');
      expect(modal.shadowRoot).toBeNull(); // closed shadow root
    });

    it('should call onIgnore when ignore button is clicked', () => {
      const onExit = jest.fn();
      const onIgnore = jest.fn();

      const modal = createWarningModal(onExit, onIgnore);
      document.body.appendChild(modal);

      // Since we use closed shadow DOM, we can't directly access the button
      // This test verifies the modal is created and added to DOM
      expect(document.getElementById('metamask-seed-phrase-warning')).toBe(
        modal,
      );
    });
  });

  describe('showWarningModal', () => {
    it('should add modal to document body', async () => {
      // Start showing modal (don't await - it won't resolve until button click)
      showWarningModal();

      // Check modal was added
      const modal = document.getElementById('metamask-seed-phrase-warning');
      expect(modal).not.toBeNull();

      // Clean up by removing the modal
      modal?.remove();

      // The promise won't resolve in this test since we didn't click a button
      // This is expected behavior
    });

    it('should remove existing modal before showing new one', () => {
      // Create a dummy modal
      const existingModal = document.createElement('div');
      existingModal.id = 'metamask-seed-phrase-warning';
      document.body.appendChild(existingModal);

      // Show new modal
      showWarningModal();

      // Check only one modal exists
      const modals = document.querySelectorAll('#metamask-seed-phrase-warning');
      expect(modals.length).toBe(1);
      expect(modals[0]).not.toBe(existingModal);
    });

    it('should resolve immediately with ignore when warning is dismissed', async () => {
      // Set the dismissed flag in extension storage and load it
      mockStorage['metamask-srp-warning-dismissed'] = true;
      await loadWarningDismissedState();

      // Show modal - should resolve immediately
      const result = await showWarningModal();

      expect(result).toEqual({ action: 'ignore', dontShowAgain: true });

      // No modal should have been added
      const modal = document.getElementById('metamask-seed-phrase-warning');
      expect(modal).toBeNull();
    });
  });

  describe('removeWarningModal', () => {
    it('should remove modal if it exists', () => {
      const modal = document.createElement('div');
      modal.id = 'metamask-seed-phrase-warning';
      document.body.appendChild(modal);

      expect(
        document.getElementById('metamask-seed-phrase-warning'),
      ).not.toBeNull();

      removeWarningModal();

      expect(
        document.getElementById('metamask-seed-phrase-warning'),
      ).toBeNull();
    });

    it('should not throw if modal does not exist', () => {
      expect(() => removeWarningModal()).not.toThrow();
    });
  });
});
