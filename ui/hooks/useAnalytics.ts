import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  createEventBuilder,
  type AnalyticsEvent,
  type AnalyticsEventBuildOptions,
} from '../../shared/lib/analytics/create-event-builder';
import {
  MetaMetricsEventName,
  type MetaMetricsPageObject,
  type MetaMetricsReferrerObject,
} from '../../shared/constants/metametrics';
import { getEnvironmentType } from '../../shared/lib/environment-type';
import {
  getAnalyticsId,
  getConsentDecisionMade,
  getOptedIn,
} from '../selectors';
import { trackAnalyticsEvent } from '../store/actions';
import { useSegmentContext } from './useSegmentContext';

type UIAnalyticsTrackEventOptions = AnalyticsEventBuildOptions & {
  environmentType: string;
  page?: MetaMetricsPageObject;
  referrer?: MetaMetricsReferrerObject;
};

type UseAnalyticsResult = {
  createEventBuilder: typeof createEventBuilder;
  trackEvent: (built: AnalyticsEvent) => Promise<void>;
};

export function useAnalytics(): UseAnalyticsResult {
  const context = useSegmentContext();
  const consentDecisionMade = useSelector(getConsentDecisionMade);
  const isOptedIn = useSelector(getOptedIn);
  const analyticsId = useSelector(getAnalyticsId);
  const isMetricsEnabled = consentDecisionMade && isOptedIn;
  const canTrackImmediately = isMetricsEnabled && Boolean(analyticsId);
  const canMaybeTrackLater =
    !consentDecisionMade || (isMetricsEnabled && !analyticsId);

  const trackEvent = useCallback(
    async (built: AnalyticsEvent): Promise<void> => {
      const options: UIAnalyticsTrackEventOptions = {
        ...built.options,
        environmentType: getEnvironmentType(),
        ...context,
      };

      if (
        canTrackImmediately ||
        canMaybeTrackLater ||
        built.name === MetaMetricsEventName.MetricsOptOut
      ) {
        await trackAnalyticsEvent(built, options).catch(() => undefined);
      }
    },
    [canMaybeTrackLater, canTrackImmediately, context],
  );

  return useMemo(
    () => ({
      createEventBuilder,
      trackEvent,
    }),
    [trackEvent],
  );
}
