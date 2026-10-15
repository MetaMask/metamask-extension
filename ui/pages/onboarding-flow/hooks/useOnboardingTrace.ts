import {
  createElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';
import {
  OnboardingTraceContextProvider,
  type OnboardingTraceContextValue,
  type OnboardingTraceOutcome,
} from '../../../contexts/onboarding-trace';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { TraceName, TraceOperation } from '../../../../shared/lib/trace';

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
function useOnboardingTraceLifecycle(): OnboardingTraceContextValue {
  const { pathname } = useLocation();
  const {
    bufferedTrace,
    bufferedEndTrace,
    onboardingParentContext: onboardingParentContextRef,
  } = useContext(MetaMetricsContext);
  const lastStepRef = useRef(getOnboardingTraceStep(pathname));
  const hasStartedRef = useRef(false);
  const hasEndedRef = useRef(false);
  const isOAuthInProgressRef = useRef(false);

  const setOAuthInProgress = useCallback((isInProgress: boolean) => {
    isOAuthInProgressRef.current = isInProgress;
  }, []);

  const startJourney = useCallback(() => {
    if (hasStartedRef.current) {
      return;
    }

    hasStartedRef.current = true;
    bufferedTrace({
      name: TraceName.OnboardingJourneyOverall,
      op: TraceOperation.OnboardingUserJourney,
      data: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        perf_fix: 'trace-registry-v1',
      },
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
      if (!hasStartedRef.current || hasEndedRef.current) {
        return;
      }

      hasEndedRef.current = true;
      bufferedEndTrace({
        name: TraceName.OnboardingJourneyOverall,
        data: {
          outcome,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          last_step: lastStepRef.current,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          perf_fix: 'trace-registry-v1',
        },
      });
    },
    [bufferedEndTrace],
  );

  useEffect(() => {
    lastStepRef.current = getOnboardingTraceStep(pathname);
  }, [pathname]);

  useEffect(() => {
    const handlePageHide = () => {
      if (!isOAuthInProgressRef.current) {
        endJourney('abandoned');
      }
    };

    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [endJourney]);

  return { startJourney, endJourney, setOAuthInProgress };
}

/**
 * Provides one shared onboarding trace lifecycle to all onboarding screens.
 *
 * @param options0
 * @param options0.children
 * @returns The provider element.
 */
export function OnboardingTraceProvider({ children }: { children: ReactNode }) {
  const value = useOnboardingTraceLifecycle();

  return createElement(OnboardingTraceContextProvider, { value, children });
}
