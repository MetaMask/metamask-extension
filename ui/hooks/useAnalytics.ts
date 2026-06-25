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
  getCompletedMetaMetricsOnboarding,
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
  trackEvent: (built: AnalyticsEvent) => void;
};

export function useAnalytics(): UseAnalyticsResult {
  const context = useSegmentContext();
  const completedMetaMetricsOnboarding = useSelector(
    getCompletedMetaMetricsOnboarding,
  );
  const isOptedIn = useSelector(getOptedIn);
  const analyticsId = useSelector(getAnalyticsId);
  const isMetricsEnabled = completedMetaMetricsOnboarding && isOptedIn;
  const canTrackImmediately = isMetricsEnabled && Boolean(analyticsId);
  const canMaybeTrackLater =
    !completedMetaMetricsOnboarding || (isMetricsEnabled && !analyticsId);

  const trackEvent = useCallback(
    (built: AnalyticsEvent) => {
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
        trackAnalyticsEvent(built, options).catch(() => undefined);
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
