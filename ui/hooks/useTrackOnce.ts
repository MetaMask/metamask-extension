import { useEffect, useRef } from 'react';

/**
 * Calls `track` the first time `isReady` is true for the lifetime of the
 * component, and never again, even if `isReady` flips back and forth.
 *
 * @param isReady - Whether the surface being tracked is actually showing.
 * @param track - The analytics call to fire once.
 */
export function useTrackOnce(isReady: boolean, track: () => void) {
  const hasTrackedRef = useRef(false);

  useEffect(() => {
    if (!isReady || hasTrackedRef.current) {
      return;
    }
    hasTrackedRef.current = true;
    track();
  }, [isReady, track]);
}
