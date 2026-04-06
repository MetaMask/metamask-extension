import { useState, useCallback } from 'react';

type CancelSpeedupErrorState = {
  message: string;
  isCancel: boolean;
};

/**
 * Manages the submit-with-error-handling for the cancel/speed-up flow.
 *
 * Encapsulates error state, the async submit logic (close modal, await the
 * thunk, surface failures), and the error-clearing callback so consuming
 * components only deal with plain values and simple callbacks.
 *
 * @param onClose - Callback that closes the cancel/speed-up modal.
 */
export function useCancelSpeedupActions(onClose: () => void) {
  const [error, setError] = useState<CancelSpeedupErrorState | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const submitTransaction = useCallback(
    async (action: () => void, isCancel: boolean) => {
      setError(null);
      onClose();
      try {
        await Promise.resolve(action());
      } catch (err) {
        setError({ message: (err as Error).message, isCancel });
      }
    },
    [onClose],
  );

  return { error, clearError, submitTransaction };
}
