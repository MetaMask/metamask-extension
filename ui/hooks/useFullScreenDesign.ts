import { useCallback, useSyncExternalStore } from 'react';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../shared/constants/app';
import { getEnvironmentType } from '../../shared/lib/environment-type';

// Minimum viewport width at which the fullscreen design is used
// Matches the Tailwind `md` breakpoint
export const FULL_SCREEN_DESIGN_MIN_WIDTH = 768;
const FULL_SCREEN_DESIGN_MEDIA_QUERY = `(min-width: ${FULL_SCREEN_DESIGN_MIN_WIDTH}px)`;

/**
 * Subscribes to a media query and returns whether it currently matches.
 *
 * @param query - The CSS media query to evaluate.
 * @returns Whether the media query currently matches.
 */
function useMediaQueryMatches(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mediaQueryList = window.matchMedia(query);
      mediaQueryList.addEventListener('change', onChange);
      return () => mediaQueryList.removeEventListener('change', onChange);
    },
    [query],
  );

  const getSnapshot = useCallback(
    () => window.matchMedia(query).matches,
    [query],
  );

  return useSyncExternalStore(subscribe, getSnapshot);
}

/**
 * Returns whether the fullscreen design should be used.
 * True only when fullscreen is open AND the viewport is wide enough.
 *
 * @returns Whether the fullscreen design should be shown.
 */
export function useFullScreenDesign(): boolean {
  const isFullscreenEnvironment =
    getEnvironmentType() === ENVIRONMENT_TYPE_FULLSCREEN;
  const isWideViewport = useMediaQueryMatches(FULL_SCREEN_DESIGN_MEDIA_QUERY);

  return isFullscreenEnvironment && isWideViewport;
}
