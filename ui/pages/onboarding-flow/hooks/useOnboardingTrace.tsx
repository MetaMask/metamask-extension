import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';
import { submitRequestToBackground } from '../../../store/background-connection';
import {
  OnboardingTraceContextProvider,
  type OnboardingTraceContextValue,
} from '../../../contexts/onboarding-trace';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { TraceName } from '../../../../shared/lib/trace';
import type {
  OnboardingJourneyTraceEndData,
  OnboardingJourneyTraceEndRequest,
  OnboardingJourneyTraceRequest,
} from '../../../../shared/types/onboarding';

function callOnboardingTraceService<Response = void>(
  method:
    | 'startOnboardingJourney'
    | 'updateOnboardingJourney'
    | 'endOnboardingJourney',
  request: OnboardingJourneyTraceRequest | OnboardingJourneyTraceEndRequest,
): Promise<Response | undefined> {
  return submitRequestToBackground<Response>(method, [request]).catch(
    () => undefined,
  );
}

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
  const { onboardingParentContext: onboardingParentContextRef } =
    useContext(MetaMetricsContext);
  const lastStepRef = useRef(getOnboardingTraceStep(pathname));
  const hasStartedRef = useRef(false);
  const hasEndedRef = useRef(false);
  const startJourneyPromiseRef = useRef<Promise<string | undefined>>(
    Promise.resolve(undefined),
  );

  const startJourney = useCallback(async () => {
    if (hasStartedRef.current) {
      return;
    }

    hasStartedRef.current = true;

    const startJourneyPromise = callOnboardingTraceService<string>(
      'startOnboardingJourney',
      {
        lastStep: lastStepRef.current,
      },
    );
    startJourneyPromiseRef.current = startJourneyPromise;

    // Wait for the trace ID to be resolved from the previous promise.
    const traceId = await startJourneyPromise;
    if (!traceId) {
      return;
    }

    // Child screens read this shared ref when starting their own traces.
    // Only the opaque trace identity crosses the UI/background RPC boundary;
    // a live Sentry span cannot be passed through it.
    onboardingParentContextRef.current = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      _name: TraceName.OnboardingJourneyOverall,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      _id: traceId,
    };
  }, [onboardingParentContextRef]);

  const endJourney = useCallback(
    async (data: OnboardingJourneyTraceEndData) => {
      if (!hasStartedRef.current || hasEndedRef.current) {
        return;
      }

      hasEndedRef.current = true;

      await startJourneyPromiseRef.current;
      await callOnboardingTraceService('endOnboardingJourney', {
        lastStep: lastStepRef.current,
        ...data,
      });
    },
    [],
  );

  useEffect(() => {
    const lastStep = getOnboardingTraceStep(pathname);
    lastStepRef.current = lastStep;

    if (!hasStartedRef.current || hasEndedRef.current) {
      return;
    }

    // eslint-disable-next-line no-void
    void startJourneyPromiseRef.current
      .then(() =>
        callOnboardingTraceService('updateOnboardingJourney', {
          lastStep,
        }),
      )
      .catch(() => undefined);
  }, [pathname]);

  return useMemo(
    () => ({ startJourney, endJourney }),
    [startJourney, endJourney],
  );
}

/**
 * Provides one shared onboarding trace lifecycle to all onboarding screens.
 *
 * @param options0
 * @param options0.children
 * @returns The provider element.
 */
export function OnboardingTraceProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const value = useOnboardingTraceLifecycle();

  return (
    <OnboardingTraceContextProvider value={value}>
      {children}
    </OnboardingTraceContextProvider>
  );
}
