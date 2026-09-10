import { useCallback, useRef } from 'react';

/**
 * Defer work scheduled by an effect teardown so that a setup running
 * immediately afterwards can cancel it.
 *
 * React StrictMode tears an effect down and sets it up again on the same
 * component instance in development, so a teardown alone does not mean the user
 * left. Treating that probe as an abandonment reports spans and events that
 * never happened. A real exit has no follow-up setup, so the deferred work runs
 * on the next macrotask.
 *
 * The timer deliberately outlives the component: a genuine unmount must still
 * report. Callers therefore schedule from the teardown and cancel from the
 * setup, never from a cleanup of their own.
 *
 * @returns `scheduleAbandon`, to defer the teardown work, and `cancelAbandon`,
 * to discard a deferred teardown that turned out to be a probe.
 */
export function useDeferredAbandon(): {
  cancelAbandon: () => void;
  scheduleAbandon: (abandon: () => void) => void;
} {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelAbandon = useCallback(() => {
    if (timeoutRef.current === null) {
      return;
    }

    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);

  const scheduleAbandon = useCallback((abandon: () => void) => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      abandon();
    }, 0);
  }, []);

  return { cancelAbandon, scheduleAbandon };
}
