import { useLayoutEffect } from 'react';

/**
 * Schedule a callback after a ready commit and a paint opportunity.
 * Becoming unready, changing the callback, or unmounting cancels scheduling.
 *
 * @param ready - Whether the committed content is ready.
 * @param callback - The action to schedule, if any.
 */
export function useAfterPaint(ready: boolean, callback?: () => void): void {
  useLayoutEffect(() => {
    if (!ready || !callback) {
      return undefined;
    }
    // Double rAF allows a paint opportunity between callbacks.
    // https://lists.w3.org/Archives/Public/public-web-perf/2024Sep/0001.html
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(callback);
    });
    return () => cancelAnimationFrame(frame);
  }, [ready, callback]);
}
