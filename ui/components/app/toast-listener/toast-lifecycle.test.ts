import {
  clearToastPhase,
  shouldShowPendingToast,
  shouldShowTerminalToast,
} from './toast-lifecycle';

describe('toast-lifecycle', () => {
  const txId = 'tx-1';

  beforeEach(() => {
    clearToastPhase(txId);
  });

  describe('shouldShowPendingToast', () => {
    it('returns true the first time for a transaction id', () => {
      expect(shouldShowPendingToast(txId)).toBe(true);
    });

    it('returns false when a pending toast was already shown for that id', () => {
      shouldShowPendingToast(txId);

      expect(shouldShowPendingToast(txId)).toBe(false);
    });
  });

  describe('shouldShowTerminalToast', () => {
    it('returns false when no pending toast was shown for that id', () => {
      expect(shouldShowTerminalToast(txId)).toBe(false);
    });

    it('returns true after a pending toast was shown for that id', () => {
      shouldShowPendingToast(txId);

      expect(shouldShowTerminalToast(txId)).toBe(true);
    });

    it('returns false when a terminal toast was already shown for that id', () => {
      shouldShowPendingToast(txId);
      shouldShowTerminalToast(txId);

      expect(shouldShowTerminalToast(txId)).toBe(false);
    });
  });

  describe('clearToastPhase', () => {
    it('allows pending and terminal toasts to show again for that id', () => {
      shouldShowPendingToast(txId);
      shouldShowTerminalToast(txId);

      clearToastPhase(txId);

      expect(shouldShowPendingToast(txId)).toBe(true);
      expect(shouldShowTerminalToast(txId)).toBe(true);
    });
  });
});
