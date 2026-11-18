import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { useSelector } from 'react-redux';
import { ENVIRONMENT_TYPE_POPUP } from '../../shared/constants/app';
import { WIDE_SCREEN_DESIGN_MIN_WIDTH } from '../../shared/constants/layout';
import { getEnvironmentType } from '../../shared/lib/environment-type';
import { getIsFullscreenRedesignEnabled } from '../selectors/multichain/feature-flags';

const FULL_SCREEN_DESIGN_MEDIA_QUERY = `(min-width: ${WIDE_SCREEN_DESIGN_MIN_WIDTH}px)`;

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
  // The popup is always narrow, so it never uses the wide design. Its page can
  // still be opened in a wide browser tab (e.g. to simulate it in E2E tests).
  const isPopup = getEnvironmentType() === ENVIRONMENT_TYPE_POPUP;

  return isFlagEnabled && isWideViewport && !isPopup;
}
