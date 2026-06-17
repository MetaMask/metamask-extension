import type {
  AnalyticsContext,
  AnalyticsEventProperties,
  AnalyticsTrackingEvent,
} from '@metamask/analytics-controller';
import type { Hex, Json } from '@metamask/utils';
import { omit, omitBy } from 'lodash';
import {
  ENVIRONMENT_TYPE_BACKGROUND,
  type EnvironmentType,
} from '../../../../shared/constants/app';
import {
  METAMETRICS_BACKGROUND_PAGE_OBJECT,
  type MetaMetricsEventPayload,
  type MetaMetricsPageObject,
  type MetaMetricsPagePayload,
  type MetaMetricsReferrerObject,
} from '../../../../shared/constants/metametrics';
import { UTM_PARAMETERS } from '../../../../shared/types/metametrics';
import {
  enrichWithABTests,
  hasABTestAnalyticsMappingForEvent,
} from '../../../../shared/lib/ab-testing/ab-test-analytics';
import { ANONYMOUS_EVENT_PROPERTY } from './platform-adapter';

type AnalyticsUnfilteredProperties =
  | Record<string, Json | undefined>
  | null
  | undefined;

type AnalyticsEventBuilderContext = {
  chainId: Hex;
  locale: string;
  appVersion: string;
  marketingCampaignCookieId: string | null;
  dataCollectionForMarketing: boolean | null;
  isEvmSelected: boolean;
  selectedMultichainNetworkChainId: string | null;
};

const MARKETING_UTM_PARAMETERS = [...UTM_PARAMETERS];

type AnalyticsEventBuilderConfig = {
  getExtensionContext: () => AnalyticsEventBuilderContext;
  getRemoteFeatureFlags: () => Record<string, unknown>;
};

export type AnalyticsEventBuildOptions = {
  excludeMetaMetricsId?: boolean;
  referrer?: MetaMetricsReferrerObject;
  page?: MetaMetricsPageObject;
  environmentType?: EnvironmentType | string;
};

export type BuiltPageViewPayload = {
  name: string;
  properties: AnalyticsEventProperties;
  context: AnalyticsContext;
};

export type AnalyticsContextBuildOptions = {
  page?: MetaMetricsPageObject;
  referrer?: MetaMetricsReferrerObject;
};

export type BuiltAnalyticsEvent = {
  event: AnalyticsTrackingEvent;
  context: AnalyticsContext;
};

type AnalyticsEventBuilderInterface = {
  addProperties: (
    properties: AnalyticsUnfilteredProperties,
  ) => AnalyticsEventBuilderInterface;
  addSensitiveProperties: (
    properties: AnalyticsUnfilteredProperties,
  ) => AnalyticsEventBuilderInterface;
  removeProperties: (propNames: string[]) => AnalyticsEventBuilderInterface;
  removeSensitiveProperties: (
    propNames: string[],
  ) => AnalyticsEventBuilderInterface;
  build: (options?: AnalyticsEventBuildOptions) => BuiltAnalyticsEvent;
};

type EventState = {
  name: string;
  properties: AnalyticsEventProperties;
  sensitiveProperties: AnalyticsEventProperties;
};

const defaultConfig: AnalyticsEventBuilderConfig = {
  getExtensionContext: () => {
    throw new Error('AnalyticsEventBuilder has not been configured');
  },
  getRemoteFeatureFlags: () => ({}),
};

let config: AnalyticsEventBuilderConfig = defaultConfig;

function removePropertiesFromMap(
  map: AnalyticsEventProperties,
  keys: string[],
): void {
  keys.forEach((key) => {
    delete map[key];
  });
}

function filterUndefinedProperties(
  properties: AnalyticsUnfilteredProperties,
): AnalyticsEventProperties {
  return omitBy(
    properties ?? {},
    (propertyValue) => propertyValue === undefined,
  ) as AnalyticsEventProperties;
}

function enrichPropertiesWithABTests(
  eventName: string,
  properties: AnalyticsEventProperties,
): AnalyticsEventProperties {
  const event = { event: eventName, properties } as MetaMetricsEventPayload;
  let normalizedEvent = event;

  if (properties.active_ab_tests !== undefined) {
    try {
      normalizedEvent = enrichWithABTests(event, null, []);
    } catch {
      normalizedEvent = event;
    }
  }

  if (!hasABTestAnalyticsMappingForEvent(eventName)) {
    return normalizedEvent.properties ?? {};
  }

  try {
    return (
      enrichWithABTests(normalizedEvent, config.getRemoteFeatureFlags())
        .properties ?? {}
    );
  } catch {
    return normalizedEvent.properties ?? {};
  }
}

/**
 * Derive chain fields from multichain network selection for page views.
 * Matches legacy `MetaMetricsController#buildTrackPagePayload`.
 */
function buildPageChainIdProperties(): Partial<AnalyticsEventProperties> {
  const { chainId, isEvmSelected, selectedMultichainNetworkChainId } =
    config.getExtensionContext();

  if (isEvmSelected) {
    return {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      chain_id: chainId,
    };
  }

  return {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    chain_id: null,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    chain_id_caip: selectedMultichainNetworkChainId ?? undefined,
  };
}

/**
 * Derive chain fields for track events from caller properties.
 * Matches legacy `MetaMetricsController#buildTrackEventPayload`.
 *
 * @param properties - Event properties that may include caller chain fields.
 */
function buildEventChainIdProperties(
  properties: AnalyticsEventProperties,
): Partial<AnalyticsEventProperties> {
  const { chainId } = config.getExtensionContext();

  if (typeof properties.chain_id_caip === 'string') {
    return {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      chain_id: null,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      chain_id_caip: properties.chain_id_caip,
    };
  }

  if (typeof properties.chain_id === 'string') {
    return {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      chain_id: properties.chain_id as Hex,
    };
  }

  return {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    chain_id: chainId,
  };
}

function normalizeProperties(
  eventName: string,
  properties: AnalyticsEventProperties,
  options?: AnalyticsEventBuildOptions,
): AnalyticsEventProperties {
  const { locale } = config.getExtensionContext();
  const enrichedProperties = enrichPropertiesWithABTests(eventName, properties);
  const {
    locale: _callerLocale,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    chain_id: _chainId,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    chain_id_caip: _chainIdCaip,
    ...remainingProperties
  } = enrichedProperties;

  return omitBy(
    {
      ...remainingProperties,
      ...buildEventChainIdProperties(enrichedProperties),
      locale,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      environment_type: options?.environmentType ?? ENVIRONMENT_TYPE_BACKGROUND,
    },
    (propertyValue) => propertyValue === undefined,
  ) as AnalyticsEventProperties;
}

function removeUtmPropertiesWithoutMarketingConsent<
  TProperties extends AnalyticsEventProperties,
>(properties: TProperties): TProperties {
  const { dataCollectionForMarketing } = config.getExtensionContext();

  if (dataCollectionForMarketing) {
    return properties;
  }

  return omit(properties, MARKETING_UTM_PARAMETERS) as TProperties;
}

function applyAnonymousOptions(
  event: EventState,
  properties: AnalyticsEventProperties,
  options?: AnalyticsEventBuildOptions,
): AnalyticsEventProperties {
  const hasSensitiveProperties =
    Object.keys(event.sensitiveProperties).length > 0;

  if (hasSensitiveProperties && options?.excludeMetaMetricsId === true) {
    throw new Error(
      'sensitiveProperties was specified in an event payload that also set the excludeMetaMetricsId flag',
    );
  }

  let excludeMetaMetricsId = options?.excludeMetaMetricsId ?? false;
  // This is carried over from the old implementation, and will likely need
  // to be updated to work with the new tracking plan. I think we should use
  // a config setting for this instead of trying to match the event name
  const isSendFlow = Boolean(event.name.match(/^send|^confirm/iu));
  // do not filter if excludeMetaMetricsId is explicitly set to false
  if (options?.excludeMetaMetricsId !== false && isSendFlow) {
    excludeMetaMetricsId = true;
  }

  if (!excludeMetaMetricsId) {
    return properties;
  }

  return {
    ...properties,
    [ANONYMOUS_EVENT_PROPERTY]: true,
  };
}

export function buildAnalyticsContext(
  options?: AnalyticsContextBuildOptions,
): AnalyticsContext {
  const { appVersion, marketingCampaignCookieId } =
    config.getExtensionContext();

  return {
    app: {
      name: 'MetaMask Extension',
      version: appVersion,
    },
    userAgent: typeof window === 'undefined' ? '' : window.navigator.userAgent,
    page: options?.page ?? METAMETRICS_BACKGROUND_PAGE_OBJECT,
    ...(options?.referrer ? { referrer: options.referrer } : {}),
    marketingCampaignCookieId,
  };
}

/**
 * Build a page view payload for {@link AnalyticsController.trackView}.
 *
 * @param payload - Page view details from the UI or background.
 * @returns Normalized page name, properties, and context.
 */
export function buildPageViewPayload(
  payload: MetaMetricsPagePayload,
): BuiltPageViewPayload {
  const { locale } = config.getExtensionContext();
  const { name, params, environmentType, page, referrer } = payload;

  return {
    name: name ?? '',
    properties: omitBy(
      {
        params,
        locale,
        ...buildPageChainIdProperties(),
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        environment_type: environmentType,
      },
      (propertyValue) => propertyValue === undefined,
    ) as AnalyticsEventProperties,
    context: buildAnalyticsContext({ page, referrer }),
  };
}

function buildEvent(
  event: EventState,
  options?: AnalyticsEventBuildOptions,
): BuiltAnalyticsEvent {
  const normalizedProperties = removeUtmPropertiesWithoutMarketingConsent(
    normalizeProperties(event.name, event.properties, options),
  );
  const properties = applyAnonymousOptions(
    event,
    normalizedProperties,
    options,
  );
  const sensitiveProperties = removeUtmPropertiesWithoutMarketingConsent(
    event.sensitiveProperties,
  );

  const trackingEvent: AnalyticsTrackingEvent = {
    name: event.name,
    properties,
    sensitiveProperties,
    saveDataRecording: false, // Legacy property introduced by Mobile that is ignored by the analytics controller and will be removed from the type in the future.
    get hasProperties(): boolean {
      return (
        Object.keys(this.properties).length > 0 ||
        Object.keys(this.sensitiveProperties).length > 0
      );
    },
  };

  return {
    event: trackingEvent,
    context: buildAnalyticsContext({
      page: options?.page,
      referrer: options?.referrer,
    }),
  };
}

function createBuilderFromEvent(
  event: EventState,
): AnalyticsEventBuilderInterface {
  return {
    addProperties: (properties: AnalyticsUnfilteredProperties) => {
      event.properties = {
        ...event.properties,
        ...filterUndefinedProperties(properties),
      };
      return createBuilderFromEvent(event);
    },

    addSensitiveProperties: (properties: AnalyticsUnfilteredProperties) => {
      event.sensitiveProperties = {
        ...event.sensitiveProperties,
        ...filterUndefinedProperties(properties),
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

    build: (options?: AnalyticsEventBuildOptions) => buildEvent(event, options),
  };
}

function createEventBuilder(eventName: string): AnalyticsEventBuilderInterface {
  if (!eventName) {
    throw new Error(`Must specify event. Event was: ${eventName}`);
  }

  return createBuilderFromEvent({
    name: eventName,
    properties: {},
    sensitiveProperties: {},
  });
}

function configure(builderConfig: AnalyticsEventBuilderConfig): void {
  config = builderConfig;
}

export const AnalyticsEventBuilder = {
  configure,
  createEventBuilder,
};
