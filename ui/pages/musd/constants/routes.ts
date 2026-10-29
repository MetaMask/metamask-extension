/**
 * mUSD Conversion route constants
 *
 * Owned by earn/mUSD. Keeps route paths and analytics definitions decoupled
 * from the central ui/helpers/constants/routes.ts.
 */

/** Base path for mUSD conversion flows */
export const MUSD_CONVERSION_ROUTE = '/musd';

/** Full path for the mUSD education/onboarding screen */
export const MUSD_CONVERSION_EDUCATION_ROUTE = '/musd/education';

/** Route path constants for mUSD conversion (base + education with full and relative paths) */
export const MUSD_CONVERSION_ROUTES = {
  BASE: MUSD_CONVERSION_ROUTE,
  EDUCATION: {
    FULL: MUSD_CONVERSION_EDUCATION_ROUTE,
    RELATIVE: '/education',
  },
} as const;

/** Route definitions for analytics (path, label, trackInAnalytics). Spread into central ROUTES. */
export const MUSD_ROUTE_DEFINITIONS = [
  {
    path: MUSD_CONVERSION_ROUTE,
    label: 'MUSD Conversion',
    trackInAnalytics: true,
  },
  {
    path: MUSD_CONVERSION_EDUCATION_ROUTE,
    label: 'MUSD Conversion Education',
    trackInAnalytics: true,
  },
] as const;
