import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { getIsRampsEnabled } from '../../selectors/ramps-feature-flags';
import { useRampsAnalytics } from './useRampsAnalytics';
import { useRampsUserRegion } from './useRampsUserRegion';

/**
 * Fires `ramps-screen-viewed` exactly once per mount. Mirrors
 * `useActivityScreenViewed` — the region/currency context resolves
 * asynchronously (the buy flow already gates on `userRegion?.regionCode`), so
 * the buy-flow screens defer the event until the region has loaded, letting it
 * carry the correct `region` instead of an empty string.
 *
 * `waitForRegion` is off for screens reached outside the buy flow (order
 * details, opened from the activity list) where no region is fetched — there
 * the event fires on mount rather than waiting for a region that never comes.
 *
 * @param location - The `location` property identifying the screen.
 * @param options - Options bag.
 * @param options.waitForRegion - Defer the event until the region resolves.
 * Defaults to `true`.
 */
export function useRampsScreenViewed(
  location: string,
  { waitForRegion = true }: { waitForRegion?: boolean } = {},
): void {
  const { trackScreenViewed } = useRampsAnalytics();
  const isRampsEnabled = useSelector(getIsRampsEnabled);
  const { userRegion } = useRampsUserRegion();
  const isReady = waitForRegion ? userRegion !== null : true;

  // Keep the latest location without making it an effect dependency, so the
  // event captures the value at the moment it fires (parity with the flow's
  // other screen-viewed hook). Synced in an effect (not during render) to
  // satisfy the React Compiler refs rule.
  const locationRef = useRef(location);
  useEffect(() => {
    locationRef.current = location;
  }, [location]);
  const hasTrackedRef = useRef(false);

  useEffect(() => {
    if (!isReady || !isRampsEnabled || hasTrackedRef.current) {
      return;
    }
    hasTrackedRef.current = true;
    trackScreenViewed(locationRef.current);
  }, [isReady, isRampsEnabled, trackScreenViewed]);
}
