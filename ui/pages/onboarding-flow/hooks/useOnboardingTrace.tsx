import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useMessenger } from '../../../hooks/useMessenger';
import { getOnboardingTabId } from '../../../selectors/onboarding';
import {
  OnboardingTraceContextProvider,
  type OnboardingTraceContextValue,
} from '../../../contexts/onboarding-trace';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { TraceName } from '../../../../shared/lib/trace';
import type {
  OnboardingJourneyTraceEndData,
  OnboardingJourneyTraceRequest,
} from '../../../../shared/types/onboarding';
import type { OnboardingTraceRouteMessenger } from '../messenger';

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
  const messenger = useMessenger<OnboardingTraceRouteMessenger>();
  const tabId = useSelector(getOnboardingTabId);
  const { onboardingParentContext: onboardingParentContextRef } =
    useContext(MetaMetricsContext);
  const lastStepRef = useRef(getOnboardingTraceStep(pathname));
  const hasStartedRef = useRef(false);
  const hasEndedRef = useRef(false);
  const startJourneyPromiseRef = useRef<Promise<string | undefined>>(
    Promise.resolve(undefined),
  );
  const getJourneyRequest = useCallback(
    (lastStep: string): OnboardingJourneyTraceRequest => ({
      lastStep,
      ...(tabId === undefined ? {} : { tabId }),
    }),
    [tabId],
  );

  const startJourney = useCallback(async () => {
    if (hasStartedRef.current) {
      return;
    }

    hasStartedRef.current = true;

    const startJourneyPromise = messenger
      .call(
        'OnboardingController:startOnboardingJourney',
        getJourneyRequest(lastStepRef.current),
      )
      .catch(() => undefined);
    startJourneyPromiseRef.current = startJourneyPromise;

    // Child screens read this shared ref when starting their own traces.
    // Publish the journey name before the id arrives so those spans can attach
    // while the background call is still in flight. Only the opaque trace
    // identity crosses the UI/background RPC boundary; a live Sentry span
    // cannot be passed through it.
    onboardingParentContextRef.current = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      _name: TraceName.OnboardingJourneyOverall,
    };

    const traceId = await startJourneyPromise;
    const parentContext = onboardingParentContextRef.current;
    if (!traceId || !parentContext || !('_name' in parentContext)) {
      return;
    }

    parentContext._id = traceId;
  }, [getJourneyRequest, messenger, onboardingParentContextRef]);

  const endJourney = useCallback(
    async (data: OnboardingJourneyTraceEndData) => {
      if (!hasStartedRef.current || hasEndedRef.current) {
        return;
      }

      hasEndedRef.current = true;

      await startJourneyPromiseRef.current;
      await messenger
        .call('OnboardingController:endOnboardingJourney', {
          ...getJourneyRequest(lastStepRef.current),
          ...data,
        })
        .catch(() => undefined);
    },
    [getJourneyRequest, messenger],
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
        messenger.call(
          'OnboardingController:updateOnboardingJourney',
          getJourneyRequest(lastStep),
        ),
      )
      .catch(() => undefined);
  }, [getJourneyRequest, messenger, pathname]);

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
