import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { useSelector } from 'react-redux';
import { getIsFullscreenRedesignEnabled } from '../selectors/multichain/feature-flags';

// Minimum viewport width at which the fullscreen design is used.
// Webpack inlines this from the resolved Tailwind `md` screen
// (`theme.screens.md`) so the media query stays aligned with `md:` utilities.
const tailwindMdMinWidth = Number(process.env.TAILWIND_MD_MIN_WIDTH);
if (!Number.isInteger(tailwindMdMinWidth) || tailwindMdMinWidth <= 0) {
  throw new Error(
    'TAILWIND_MD_MIN_WIDTH must be the Tailwind md breakpoint in pixels.',
  );
}

export const FULL_SCREEN_DESIGN_MIN_WIDTH = tailwindMdMinWidth;
const FULL_SCREEN_DESIGN_MEDIA_QUERY = `(min-width: ${FULL_SCREEN_DESIGN_MIN_WIDTH}px)`;

/**
 * Subscribes to a media query and returns whether it currently matches.
 *
 * @param query - The CSS media query to evaluate.
 * @returns Whether the media query currently matches.
 */
function useMediaQueryMatches(query: string): boolean {
  // Created once per query and reused for both reading and listening.
  const mediaQueryList = useMemo(() => window.matchMedia(query), [query]);

  const subscribe = useCallback(
    (onChange: () => void) => {
      mediaQueryList.addEventListener('change', onChange);
      return () => mediaQueryList.removeEventListener('change', onChange);
    },
    [mediaQueryList],
  );

  const getSnapshot = useCallback(
    () => mediaQueryList.matches,
    [mediaQueryList],
  );

  return useSyncExternalStore(subscribe, getSnapshot);
}

export function useFullScreenDesign(): boolean {
  const isFlagEnabled = useSelector(getIsFullscreenRedesignEnabled);
  const isWideViewport = useMediaQueryMatches(FULL_SCREEN_DESIGN_MEDIA_QUERY);

  return isFlagEnabled && isWideViewport;
}
