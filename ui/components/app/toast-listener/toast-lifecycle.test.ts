import {
  clearToastPhase,
  setApprovedOrSignedToastPhase,
  shouldShowPendingToast,
  shouldShowTerminalToast,
} from './toast-lifecycle';

describe('toast-lifecycle', () => {
  const txId = 'tx-1';

  beforeEach(() => {
    clearToastPhase(txId);
  });

  describe('setApprovedOrSignedToastPhase', () => {
    it('allows a pending toast after the transaction is approved or signed', () => {
      setApprovedOrSignedToastPhase(txId);

      expect(shouldShowPendingToast(txId)).toBe(true);
    });

    it('allows a terminal toast when no pending toast was shown', () => {
      setApprovedOrSignedToastPhase(txId);

      expect(shouldShowTerminalToast(txId)).toBe(true);
      expect(shouldShowPendingToast(txId)).toBe(false);
    });

    it('leaves an existing toast phase in place', () => {
      shouldShowPendingToast(txId);
      setApprovedOrSignedToastPhase(txId);

      expect(shouldShowPendingToast(txId)).toBe(false);

      shouldShowTerminalToast(txId);
      setApprovedOrSignedToastPhase(txId);

      expect(shouldShowTerminalToast(txId)).toBe(false);
    });
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
    it('returns false when the transaction is not approved or signed', () => {
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
