import { useEffect, useState, useRef } from 'react';
import type { PerpsControllerState } from '@metamask/perps-controller';
import { usePerpsControllerOrNull } from '../../providers/perps/PerpsControllerProvider';
import { useAppSelector } from '../../store/store';
import { getRemoteFeatureFlags } from '../../selectors/remote-feature-flags';

const DEFAULT_ELIGIBLE = true;
const ELIGIBILITY_LOG_PREFIX = '[Perps Eligibility]';

/** Same URL the @metamask/perps-controller EligibilityService uses for geo-blocking. */
const PERPS_GEO_URL = 'https://on-ramp.api.cx.metamask.io/geolocation';

/**
 * Hook to read perps geo-blocking eligibility from the PerpsController.
 * Re-renders when controller state.isEligible changes (e.g. after remote
 * feature flags or geolocation check).
 *
 * When the controller is not available (e.g. outside PerpsControllerProvider
 * or before stream manager has initialized), returns isEligible: true so
 * the UI is not incorrectly blocked.
 *
 * @returns isEligible - true if the user can trade/deposit/modify; false if geo-blocked
 * @returns isLoading - false (eligibility is resolved asynchronously in the controller)
 */
export function usePerpsEligibility(): {
  isEligible: boolean;
  isLoading: boolean;
} {
  const controller = usePerpsControllerOrNull();
  const remoteFeatureFlags = useAppSelector(getRemoteFeatureFlags);
  const [isEligible, setIsEligible] = useState(
    controller?.state.isEligible ?? DEFAULT_ELIGIBLE,
  );
  const lastLoggedEligible = useRef<boolean | null>(null);
  const diagnosticLogged = useRef(false);

  useEffect(() => {
    if (!controller) {
      console.log(
        ELIGIBILITY_LOG_PREFIX,
        'Controller not available, using default eligible',
        DEFAULT_ELIGIBLE,
      );
      lastLoggedEligible.current = null;

      setIsEligible(DEFAULT_ELIGIBLE);
      return undefined;
    }

    const initialEligible = controller.state.isEligible;
    setIsEligible(initialEligible);
    console.log(ELIGIBILITY_LOG_PREFIX, 'Controller available', {
      isEligible: initialEligible,
    });
    lastLoggedEligible.current = initialEligible;

    // Diagnostic: prove whether root cause is geo fetch failing in extension UI context.
    // PerpsController's EligibilityService uses this same URL; if fetch fails it returns UNKNOWN → default eligible.
    if (!diagnosticLogged.current) {
      diagnosticLogged.current = true;
      const geoFlag =
        remoteFeatureFlags?.perpsPerpTradingGeoBlockedCountriesV2 as
          | { blockedRegions?: string[] }
          | undefined;
      const blockedRegions = Array.isArray(geoFlag?.blockedRegions)
        ? geoFlag.blockedRegions
        : [];
      fetch(PERPS_GEO_URL)
        .then((res) => {
          if (!res.ok) {
            console.log(
              ELIGIBILITY_LOG_PREFIX,
              '[ROOT CAUSE CHECK] Geo fetch failed (non-OK)',
              {
                status: res.status,
                statusText: res.statusText,
                blockedRegions,
                explanation:
                  'PerpsController uses this same URL; on failure it gets UNKNOWN and defaults to eligible=true.',
              },
            );
            return null;
          }
          return res.text();
        })
        .then((body) => {
          if (body === null) {
            return;
          }
          const region = body?.trim() || 'UNKNOWN';
          const wouldBeBlocked =
            blockedRegions.length > 0 &&
            blockedRegions.some((b) =>
              region.toUpperCase().startsWith(b.toUpperCase()),
            );
          console.log(
            ELIGIBILITY_LOG_PREFIX,
            '[ROOT CAUSE CHECK] Geo fetch from extension UI',
            {
              success: true,
              region,
              blockedRegions,
              wouldBeBlocked,
              controllerIsEligible: initialEligible,
              mismatch:
                wouldBeBlocked && initialEligible
                  ? 'Controller says eligible but region is blocked → likely controller’s internal fetch failed (CORS/context).'
                  : undefined,
            },
          );
        })
        .catch((err) => {
          console.log(
            ELIGIBILITY_LOG_PREFIX,
            '[ROOT CAUSE CHECK] Geo fetch failed (exception)',
            {
              error: err?.message ?? String(err),
              blockedRegions,
              explanation:
                'PerpsController uses this same URL; on failure it gets UNKNOWN and defaults to eligible=true. This is likely the root cause of incorrect isEligible.',
            },
          );
        });
    }

    const controllerWithMessenger = controller as typeof controller & {
      messenger: {
        subscribe: (
          event: string,
          handler: (state: PerpsControllerState) => void,
        ) => () => void;
      };
    };
    const unsubscribe = controllerWithMessenger.messenger.subscribe(
      'PerpsController:stateChange',
      (state: PerpsControllerState) => {
        const newEligible = state.isEligible;

        console.log(ELIGIBILITY_LOG_PREFIX, 'Eligibility changed', {
          isEligible: newEligible,
        });
        lastLoggedEligible.current = newEligible;

        setIsEligible(newEligible);
      },
    );
    return unsubscribe;
  }, [controller]);

  return {
    isEligible: controller ? isEligible : DEFAULT_ELIGIBLE,
    isLoading: false,
  };
}
