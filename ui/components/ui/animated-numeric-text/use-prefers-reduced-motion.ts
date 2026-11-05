import { useSyncExternalStore } from 'react';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function getMediaQueryList(): MediaQueryList | undefined {
  if (
    typeof window === 'undefined' ||
    typeof window.matchMedia !== 'function'
  ) {
    return undefined;
  }
  return window.matchMedia(REDUCED_MOTION_QUERY);
}

function subscribe(onChange: () => void): () => void {
  const mediaQueryList = getMediaQueryList();
  mediaQueryList?.addEventListener?.('change', onChange);
  return () => mediaQueryList?.removeEventListener?.('change', onChange);
}

function getSnapshot(): boolean {
  return getMediaQueryList()?.matches ?? false;
}

/**
 * Whether the user asked the OS to reduce motion. Follows changes to the
 * setting while mounted.
 *
 * @returns `true` when motion should be reduced.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

/**
 * Whether the Web Animations API is available, so glyph motion can run.
 * jsdom does not implement it.
 *
 * @returns `true` when `Element.animate` exists.
 */
export function canAnimateElements(): boolean {
  return (
    typeof Element !== 'undefined' &&
    typeof Element.prototype.animate === 'function'
  );
}
