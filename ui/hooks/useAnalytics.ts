import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { omitBy } from 'lodash';
import type { Json } from '@metamask/utils';
import {
  MetaMetricsEventName,
  type MetaMetricsPageObject,
  type MetaMetricsReferrerObject,
  type UIAnalyticsEvent,
  type UIAnalyticsEventBuildOptions,
} from '../../shared/constants/metametrics';
import { getEnvironmentType } from '../../shared/lib/environment-type';
import {
  getAnalyticsId,
  getCompletedMetaMetricsOnboarding,
  getOptedIn,
} from '../selectors';
import { trackAnalyticsEvent } from '../store/actions';
import { useSegmentContext } from './useSegmentContext';

type AnalyticsUnfilteredProperties =
  | Record<string, Json | undefined>
  | null
  | undefined;

type UIAnalyticsEventBuilder = {
  addProperties: (
    properties: AnalyticsUnfilteredProperties,
  ) => UIAnalyticsEventBuilder;
  addSensitiveProperties: (
    properties: AnalyticsUnfilteredProperties,
  ) => UIAnalyticsEventBuilder;
  removeProperties: (propNames: string[]) => UIAnalyticsEventBuilder;
  removeSensitiveProperties: (propNames: string[]) => UIAnalyticsEventBuilder;
  build: (options?: UIAnalyticsEventBuildOptions) => UIAnalyticsEvent;
};

type UIAnalyticsEventState = {
  name: string;
  properties: Record<string, Json | undefined>;
  sensitiveProperties: Record<string, Json | undefined>;
};

type UIAnalyticsTrackEventOptions = UIAnalyticsEventBuildOptions & {
  environmentType: string;
  page?: MetaMetricsPageObject;
  referrer?: MetaMetricsReferrerObject;
};

type UseAnalyticsResult = {
  createEventBuilder: (eventName: string) => UIAnalyticsEventBuilder;
  trackEvent: (built: UIAnalyticsEvent) => void;
};

function filterUndefinedValues(
  properties: Record<string, Json | undefined>,
): Record<string, Json> {
  return omitBy(
    properties,
    (propertyValue) => propertyValue === undefined,
  ) as Record<string, Json>;
}

function removePropertiesFromMap(
  map: Record<string, Json | undefined>,
  keys: string[],
): void {
  keys.forEach((key) => {
    delete map[key];
  });
}

function createBuilderFromEvent(
  event: UIAnalyticsEventState,
): UIAnalyticsEventBuilder {
  return {
    addProperties: (properties: AnalyticsUnfilteredProperties) => {
      event.properties = {
        ...event.properties,
        ...filterUndefinedValues(properties ?? {}),
      };
      return createBuilderFromEvent(event);
    },

    addSensitiveProperties: (properties: AnalyticsUnfilteredProperties) => {
      event.sensitiveProperties = {
        ...event.sensitiveProperties,
        ...filterUndefinedValues(properties ?? {}),
      };
      return createBuilderFromEvent(event);
    },

    removeProperties: (propNames: string[]) => {
      removePropertiesFromMap(event.properties, propNames);
      return createBuilderFromEvent(event);
    },

    removeSensitiveProperties: (propNames: string[]) => {
      removePropertiesFromMap(event.sensitiveProperties, propNames);
      return createBuilderFromEvent(event);
    },

    build: (options?: UIAnalyticsEventBuildOptions) => ({
      name: event.name,
      properties: filterUndefinedValues(event.properties),
      sensitiveProperties: filterUndefinedValues(event.sensitiveProperties),
      ...(options ? { options } : {}),
    }),
  };
}

function createEventBuilder(eventName: string): UIAnalyticsEventBuilder {
  if (!eventName) {
    throw new Error(`Must specify event. Event was: ${eventName}`);
  }

  return createBuilderFromEvent({
    name: eventName,
    properties: {},
    sensitiveProperties: {},
  });
}

export function useAnalytics(): UseAnalyticsResult {
  const context = useSegmentContext();
  const completedMetaMetricsOnboarding = useSelector(
    getCompletedMetaMetricsOnboarding,
  );
  const isOptedIn = useSelector(getOptedIn);
  const analyticsId = useSelector(getAnalyticsId);
  const isMetricsEnabled = completedMetaMetricsOnboarding && isOptedIn;
  const canTrackImmediately = isMetricsEnabled && Boolean(analyticsId);

  const trackEvent = useCallback(
    (built: UIAnalyticsEvent) => {
      if (
        !canTrackImmediately &&
        built.name !== MetaMetricsEventName.MetricsOptOut
      ) {
        return;
      }

      const options: UIAnalyticsTrackEventOptions = {
        ...built.options,
        environmentType: getEnvironmentType(),
        ...context,
      };

      trackAnalyticsEvent(built, options);
    },
    [canTrackImmediately, context],
  );

  return useMemo(
    () => ({
      createEventBuilder,
      trackEvent,
    }),
    [trackEvent],
  );
}
