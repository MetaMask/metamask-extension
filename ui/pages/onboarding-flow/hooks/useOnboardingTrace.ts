import { useCallback, useContext, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { TraceName, TraceOperation } from '../../../../shared/lib/trace';

export type OnboardingTraceOutcome = 'completed' | 'abandoned';

/**
 * Converts an onboarding pathname into a stable, query-free step identifier.
 *
 * @param pathname - The current browser pathname.
 * @returns The route portion after `/onboarding`, or `root` for the container route.
 */
export function getOnboardingTraceStep(pathname: string): string {
  const step = pathname.replace(/^\/onboarding\/?/u, '');
  return step || 'root';
}

/**
 * Provides the start and end API for the overall onboarding journey trace.
 *
 * The caller controls when the journey starts. This keeps the start boundary
 * explicit because not every mount of the onboarding container necessarily
 * represents the beginning of a user journey.
 */
export function useOnboardingTrace() {
  const { pathname } = useLocation();
  const {
    bufferedTrace,
    bufferedEndTrace,
    onboardingParentContext: onboardingParentContextRef,
  } = useContext(MetaMetricsContext);
  const lastStepRef = useRef(getOnboardingTraceStep(pathname));
  const hasEndedRef = useRef(false);

  useEffect(() => {
    lastStepRef.current = getOnboardingTraceStep(pathname);
  }, [pathname]);

  const startJourney = useCallback(() => {
    bufferedTrace({
      name: TraceName.OnboardingJourneyOverall,
      op: TraceOperation.OnboardingUserJourney,
    });

    // Child screens read this shared ref when starting their own traces.
    // Only the serializable trace identity crosses the UI/background RPC
    // boundary; a live Sentry span cannot be passed through it.
    onboardingParentContextRef.current = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      _name: TraceName.OnboardingJourneyOverall,
    };
  }, [bufferedTrace, onboardingParentContextRef]);

  const endJourney = useCallback(
    (outcome: OnboardingTraceOutcome) => {
      if (hasEndedRef.current) {
        return;
      }

      hasEndedRef.current = true;
      bufferedEndTrace({
        name: TraceName.OnboardingJourneyOverall,
        data: {
          outcome,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          last_step: lastStepRef.current,
        },
      });
    },
    [bufferedEndTrace],
  );

  return { startJourney, endJourney };
}
