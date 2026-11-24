import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router-dom';
import {
  WIDE_SCREEN_REDESIGN_AB_KEY,
  WIDE_SCREEN_REDESIGN_AB_TEST_EXPOSURE_METADATA,
  WIDE_SCREEN_REDESIGN_AB_TEST_VARIANTS,
} from '../../shared/lib/ab-testing/configs/wide-screen-redesign';
import { ENVIRONMENT_TYPE_POPUP } from '../../shared/constants/app';
import { WIDE_SCREEN_DESIGN_MIN_WIDTH } from '../../shared/constants/layout';
import { getEnvironmentType } from '../../shared/lib/environment-type';
import { DEFAULT_ROUTE } from '../helpers/constants/routes';
import { useABTest } from './useABTest';

const WIDE_SCREEN_MEDIA_QUERY = `(min-width: ${WIDE_SCREEN_DESIGN_MIN_WIDTH}px)`;

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

/**
 * Whether the wide layout redesign should render.
 * The viewport check is local. The design comes from
 * `coreCEUX1492AbtestWideScreenRedesign`. Exposure is recorded
 * only on the wide Home screen for now.
 */
export function useWideLayoutDesign(): boolean {
  const { pathname } = useLocation();
  const isWideViewport = useMediaQueryMatches(WIDE_SCREEN_MEDIA_QUERY);
  const isHome = pathname === DEFAULT_ROUTE;
  const isPopup = getEnvironmentType() === ENVIRONMENT_TYPE_POPUP;

  const { variant } = useABTest(
    WIDE_SCREEN_REDESIGN_AB_KEY,
    WIDE_SCREEN_REDESIGN_AB_TEST_VARIANTS,
    WIDE_SCREEN_REDESIGN_AB_TEST_EXPOSURE_METADATA,
    { trackExposure: isHome && isWideViewport && !isPopup },
  );

  return variant.useWideLayout && isWideViewport && !isPopup;
}
