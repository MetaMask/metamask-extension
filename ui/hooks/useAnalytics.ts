import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import type {
  AnalyticsEventProperties,
  TrackErrorAsAnalyticsOptions,
} from '@metamask/analytics-controller';
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
import {
  trackAnalyticsEvent,
  trackErrorAsAnalytics as trackErrorAsAnalyticsAction,
} from '../store/actions';
import { useSegmentContext } from './useSegmentContext';

type UIAnalyticsTrackEventOptions = AnalyticsEventBuildOptions & {
  environmentType: string;
  page?: MetaMetricsPageObject;
  referrer?: MetaMetricsReferrerObject;
};

type TrackErrorAsAnalyticsUiOptions = TrackErrorAsAnalyticsOptions & {
  excludeMetaMetricsId?: boolean;
};

type UseAnalyticsResult = {
  createEventBuilder: typeof createEventBuilder;
  trackEvent: (built: AnalyticsEvent) => Promise<void>;
  trackErrorAsAnalytics: (
    error: unknown,
    options: TrackErrorAsAnalyticsUiOptions,
    properties?: AnalyticsEventProperties,
  ) => Promise<void>;
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

  const trackErrorAsAnalytics = useCallback(
    async (
      error: unknown,
      options: TrackErrorAsAnalyticsUiOptions,
      properties?: AnalyticsEventProperties,
    ): Promise<void> => {
      if (!canTrackImmediately && !canMaybeTrackLater) {
        return;
      }

      await trackErrorAsAnalyticsAction(
        error,
        {
          ...options,
          environmentType: getEnvironmentType(),
        },
        properties,
      );
    },
    [canMaybeTrackLater, canTrackImmediately],
  );

  return useMemo(
    () => ({
      createEventBuilder,
      trackEvent,
      trackErrorAsAnalytics,
    }),
    [trackEvent, trackErrorAsAnalytics],
  );
}
