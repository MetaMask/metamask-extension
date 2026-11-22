import { omitBy } from 'lodash';
import type { Json } from '@metamask/utils';
import type { EnvironmentType } from '../../constants/app';
import type {
  MetaMetricsEventOptions,
  MetaMetricsPageObject,
  MetaMetricsReferrerObject,
} from '../../constants/metametrics';

type AnalyticsUnfilteredProperties =
  | Record<string, Json | undefined>
  | null
  | undefined;

export type AnalyticsEventBuildOptions = Pick<
  MetaMetricsEventOptions,
  'excludeMetaMetricsId' | 'matomoEvent'
> & {
  environmentType?: EnvironmentType | string;
  page?: MetaMetricsPageObject;
  referrer?: MetaMetricsReferrerObject;
};

export type AnalyticsEvent = {
  name: string;
  properties: Record<string, Json>;
  sensitiveProperties: Record<string, Json>;
  options?: AnalyticsEventBuildOptions;
};

export type AnalyticsEventBuilder = {
  addCategory: (category: string) => AnalyticsEventBuilder;
  addProperties: (
    properties: AnalyticsUnfilteredProperties,
  ) => AnalyticsEventBuilder;
  addSensitiveProperties: (
    properties: AnalyticsUnfilteredProperties,
  ) => AnalyticsEventBuilder;
  removeProperties: (propNames: string[]) => AnalyticsEventBuilder;
  removeSensitiveProperties: (propNames: string[]) => AnalyticsEventBuilder;
  build: (options?: AnalyticsEventBuildOptions) => AnalyticsEvent;
};

type AnalyticsEventState = {
  name: string;
  properties: Record<string, Json | undefined>;
  sensitiveProperties: Record<string, Json | undefined>;
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
  event: AnalyticsEventState,
): AnalyticsEventBuilder {
  return {
    addCategory: (category: string) => {
      event.properties = {
        ...event.properties,
        category,
      };
      return createBuilderFromEvent(event);
    },

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

    build: (options?: AnalyticsEventBuildOptions) => ({
      name: event.name,
      properties: filterUndefinedValues(event.properties),
      sensitiveProperties: filterUndefinedValues(event.sensitiveProperties),
      ...(options ? { options } : {}),
    }),
  };
}

/**
 * Create a lightweight analytics event builder.
 *
 * This builder only manages caller-provided event state. Background-specific
 * normalization is applied by the analytics delivery module.
 *
 * @param eventName - Name of the event to track.
 * @returns A fluent event builder.
 */
export function createEventBuilder(eventName: string): AnalyticsEventBuilder {
  if (!eventName) {
    throw new Error(`Must specify event. Event was: ${eventName}`);
  }

  return createBuilderFromEvent({
    name: eventName,
    properties: {},
    sensitiveProperties: {},
  });
}
