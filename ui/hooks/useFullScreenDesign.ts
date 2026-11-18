import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router-dom';
import {
  WIDE_SCREEN_REDESIGN_AB_KEY,
  WIDE_SCREEN_REDESIGN_AB_TEST_EXPOSURE_METADATA,
  WIDE_SCREEN_REDESIGN_AB_TEST_VARIANTS,
} from '../../shared/lib/ab-testing/configs/wide-screen-redesign';
import { WIDE_SCREEN_DESIGN_MIN_WIDTH } from '../../shared/constants/layout';
import { DEFAULT_ROUTE } from '../helpers/constants/routes';
import { useABTest } from './useABTest';

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

/**
 * Whether the wide screen redesign (side nav) should render.
 *
 * The viewport check is local. The design itself comes from
 * `coreCEUX1492AbtestWideScreenRedesign`: treatment uses the side nav, and
 * control or a missing assignment keeps the bottom nav. Exposure is recorded
 * only on the wide Home screen, where the two designs actually differ.
 *
 * @returns True when the assigned variant uses the wide layout and the
 * viewport is at least {@link WIDE_SCREEN_DESIGN_MIN_WIDTH}px.
 */
export function useFullScreenDesign(): boolean {
  const { pathname } = useLocation();
  const isWideViewport = useMediaQueryMatches(FULL_SCREEN_DESIGN_MEDIA_QUERY);
  const isHome = pathname === DEFAULT_ROUTE;
  const { variant } = useABTest(
    WIDE_SCREEN_REDESIGN_AB_KEY,
    WIDE_SCREEN_REDESIGN_AB_TEST_VARIANTS,
    WIDE_SCREEN_REDESIGN_AB_TEST_EXPOSURE_METADATA,
    { trackExposure: isHome && isWideViewport },
  );

  return variant.useWideLayout && isWideViewport;
}
