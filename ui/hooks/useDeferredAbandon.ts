import { useCallback, useRef } from 'react';

/**
 * Defer work scheduled by an effect teardown so that a setup running
 * immediately afterwards can cancel it.
 *
 * React StrictMode tears an effect down and sets it up again on the same
 * component instance in development, so a teardown alone does not mean the user
 * left. Treating that probe as an abandonment reports spans and events that
 * never happened. React runs both halves of the probe synchronously within one
 * task, so a microtask checkpoint is the earliest point at which a probe is
 * distinguishable from a real exit, which has no follow-up setup.
 *
 * The checkpoint deliberately outlives the component: a genuine unmount must
 * still report. Callers therefore schedule from the teardown and cancel from
 * the setup, never from a cleanup of their own.
 *
 * @returns `scheduleAbandon`, to defer the teardown work, and `cancelAbandon`,
 * to discard a deferred teardown that turned out to be a probe.
 */
export function useDeferredAbandon(): {
  cancelAbandon: () => void;
  scheduleAbandon: (abandon: () => void) => void;
} {
  const pendingRef = useRef<{ abandon: () => void } | null>(null);

  const cancelAbandon = useCallback(() => {
    pendingRef.current = null;
  }, []);

  const scheduleAbandon = useCallback((abandon: () => void) => {
    // Identity rather than a handle: a checkpoint that is no longer the
    // pending one was either cancelled or superseded, so it must not run.
    const pending = { abandon };
    pendingRef.current = pending;

    queueMicrotask(() => {
      if (pendingRef.current !== pending) {
        return;
      }

      pendingRef.current = null;
      pending.abandon();
    });
  }, []);

  return { cancelAbandon, scheduleAbandon };
}
