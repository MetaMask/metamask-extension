import type {
  AnalyticsContext,
  AnalyticsEventProperties,
  AnalyticsTrackingEvent,
  AnalyticsUserTraits,
} from '@metamask/analytics-controller';
import type { NetworkClientId } from '@metamask/network-controller';
import type { Hex, Json } from '@metamask/utils';
import { omit, omitBy } from 'lodash';
import type {
  AnalyticsEvent,
  AnalyticsEventBuildOptions,
} from '../../../../shared/lib/analytics/create-event-builder';
import { captureException as sentryCaptureException } from '../../../../shared/lib/sentry';
import {
  ENVIRONMENT_TYPE_BACKGROUND,
  PLATFORM_FIREFOX,
} from '../../../../shared/constants/app';
import {
  METAMETRICS_BACKGROUND_PAGE_OBJECT,
  MetaMetricsEventName,
  type MetaMetricsContext,
  type MetaMetricsPagePayload,
  type MetaMetricsUserTraits,
  type SegmentEventPayload,
} from '../../../../shared/constants/metametrics';
import { UTM_PARAMETERS } from '../../../../shared/types/metametrics';
import {
  enrichWithABTests,
  getRemoteFeatureFlagsWithManifestOverrides,
  hasABTestAnalyticsMappingForEvent,
} from '../../../../shared/lib/ab-testing/ab-test-analytics';
import { trackSegmentEventWhileOptedOut } from '../../lib/segment/custom-segment-tracking';
import { getPlatform } from '../../lib/util';
import { ANONYMOUS_EVENT_PROPERTY } from './platform-adapter';
import type { AnalyticsMessenger } from './analytics-messenger';

type SegmentTrackPayload = Omit<
  SegmentEventPayload,
  'properties' | 'timestamp'
> & {
  properties: AnalyticsEventProperties;
  sensitiveProperties?: Record<string, Json>;
};

type SegmentPagePayload = {
  name: string;
  properties: AnalyticsEventProperties;
  context: AnalyticsContext;
};

type ConfigureAnalyticsOptions = {
  messenger: AnalyticsMessenger;
  version: string;
  environment: string;
};

const MARKETING_UTM_PARAMETERS = [...UTM_PARAMETERS];

let messenger: AnalyticsMessenger | undefined;
let appVersion = '';

function getMessenger(): AnalyticsMessenger {
  if (!messenger) {
    throw new Error('Analytics has not been configured');
  }
  return messenger;
}

/**
 * Configure analytics normalization and delivery helpers.
 *
 * @param options - Configuration options.
 * @param options.messenger - Messenger with analytics state and delivery access.
 * @param options.version - Extension version.
 * @param options.environment - Build environment.
 */
export function configureAnalytics({
  messenger: configuredMessenger,
  version,
  environment,
}: ConfigureAnalyticsOptions): void {
  messenger = configuredMessenger;
  appVersion =
    environment === 'production' ? version : `${version}-${environment}`;
}

function getCurrentChainId(networkClientId?: NetworkClientId): Hex {
  const selectedNetworkClientId =
    networkClientId ||
    getMessenger().call('NetworkController:getState').selectedNetworkClientId;
  const {
    configuration: { chainId },
  } = getMessenger().call(
    'NetworkController:getNetworkClientById',
    selectedNetworkClientId,
  );
  return chainId;
}

function getLocale(): string {
  return getMessenger()
    .call('PreferencesController:getState')
    .currentLocale.replace('_', '-');
}

function isBasicFunctionalityEnabled(): boolean {
  const { useExternalServices } = getMessenger().call(
    'PreferencesController:getState',
  );
  return useExternalServices;
}

export function canSubmitAnalytics(eventName?: string): boolean {
  if (!isBasicFunctionalityEnabled()) {
    return false;
  }

  if (eventName === MetaMetricsEventName.MetricsOptOut) {
    return true;
  }

  const { analyticsId, optedIn } = getMessenger().call(
    'AnalyticsController:getState',
  );
  return optedIn && analyticsId.length > 0;
}

function getRemoteFeatureFlags(): Record<string, unknown> {
  return getRemoteFeatureFlagsWithManifestOverrides(
    getMessenger().call('RemoteFeatureFlagController:getState')
      ?.remoteFeatureFlags as Record<string, unknown> | undefined,
  );
}

function getMetaMetricsState() {
  return getMessenger().call('MetaMetricsController:getState');
}

function isValidTraitDate(value: unknown): value is Date {
  return Object.prototype.toString.call(value) === '[object Date]';
}

function isValidTraitArray(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    (value.every((element) => typeof element === 'string') ||
      value.every((element) => typeof element === 'boolean') ||
      value.every((element) => typeof element === 'number'))
  );
}

function isValidTrait(value: unknown): boolean {
  const type = typeof value;

  return (
    type === 'string' ||
    type === 'boolean' ||
    type === 'number' ||
    isValidTraitArray(value) ||
    isValidTraitDate(value)
  );
}

export function validateIdentifyPayload(
  userTraits: Partial<MetaMetricsUserTraits>,
): AnalyticsUserTraits | undefined {
  if (!userTraits) {
    return undefined;
  }

  if (typeof userTraits !== 'object') {
    console.warn(
      `analytics#identify: userTraits parameter must be an object. Received type: ${typeof userTraits}`,
    );
    return undefined;
  }

  const validTraits: Record<string, string> = {};

  for (const [key, value] of Object.entries(userTraits)) {
    if (isValidTraitDate(value)) {
      validTraits[key] = value.toISOString();
    } else if (isValidTrait(value)) {
      (validTraits as Record<string, typeof value>)[key] = value;
    } else {
      console.warn(
        `analytics#identify: "${key}" value is not a valid trait type`,
      );
    }
  }

  if (Object.keys(validTraits).length === 0) {
    return undefined;
  }

  return validTraits as AnalyticsUserTraits;
}

function enrichWithABTestAnalytics(event: AnalyticsEvent): AnalyticsEvent {
  let normalizedEvent = event;

  if (event.properties.active_ab_tests !== undefined) {
    try {
      normalizedEvent = enrichWithABTests(event, null, []);
    } catch {
      normalizedEvent = event;
    }
  }

  if (!hasABTestAnalyticsMappingForEvent(event.name)) {
    return normalizedEvent;
  }

  try {
    return enrichWithABTests(normalizedEvent, getRemoteFeatureFlags());
  } catch {
    return normalizedEvent;
  }
}

function buildContext(
  referrer: MetaMetricsContext['referrer'],
  page: MetaMetricsContext['page'] = METAMETRICS_BACKGROUND_PAGE_OBJECT,
): MetaMetricsContext {
  return {
    app: {
      name: 'MetaMask Extension',
      version: appVersion,
    },
    userAgent: typeof window === 'undefined' ? '' : window.navigator.userAgent,
    page,
    referrer,
    marketingCampaignCookieId: getMetaMetricsState().marketingCampaignCookieId,
  };
}

function buildTrackEventPayload(
  rawEvent: AnalyticsEvent,
  options?: AnalyticsEventBuildOptions,
): SegmentTrackPayload {
  const enrichedEvent = enrichWithABTestAnalytics(rawEvent);

  const { name: event, properties, sensitiveProperties } = enrichedEvent;
  const {
    environmentType = ENVIRONMENT_TYPE_BACKGROUND,
    page,
    referrer,
  } = options ?? {};

  let chainId;
  if (
    properties &&
    'chain_id_caip' in properties &&
    typeof properties.chain_id_caip === 'string'
  ) {
    chainId = null;
  } else if (
    properties &&
    'chain_id' in properties &&
    typeof properties.chain_id === 'string'
  ) {
    chainId = properties.chain_id;
  } else {
    chainId = getCurrentChainId();
  }

  return {
    event,
    properties: omitBy(
      {
        ...properties,
        locale: getLocale(),
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        chain_id: chainId,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        environment_type: environmentType,
      },
      (propertyValue) => propertyValue === undefined,
    ) as AnalyticsEventProperties,
    context: buildContext(referrer, page),
    sensitiveProperties,
  };
}

function buildTrackPagePayload(
  payload: MetaMetricsPagePayload,
): SegmentPagePayload {
  const { name, params, environmentType, page, referrer } = payload;

  const { isEvmSelected, selectedMultichainNetworkChainId } =
    getMessenger().call('MultichainNetworkController:getState');

  return {
    name: name ?? '',
    properties: omitBy(
      {
        params,
        locale: getLocale(),
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        chain_id: isEvmSelected ? getCurrentChainId() : null,
        ...(isEvmSelected
          ? {}
          : {
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              chain_id_caip: selectedMultichainNetworkChainId,
            }),
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        environment_type: environmentType,
      },
      (propertyValue) => propertyValue === undefined,
    ) as AnalyticsEventProperties,
    context: buildContext(referrer, page) as AnalyticsContext,
  };
}

function applyAnonymousEventOptions(
  eventPayload: SegmentTrackPayload,
  options?: AnalyticsEventBuildOptions,
): void {
  if (
    eventPayload.sensitiveProperties &&
    Object.keys(eventPayload.sensitiveProperties).length > 0 &&
    options?.excludeMetaMetricsId === true
  ) {
    throw new Error(
      'sensitiveProperties was specified in an event payload that also set the excludeMetaMetricsId flag',
    );
  }

  let excludeMetaMetricsId = options?.excludeMetaMetricsId ?? false;
  // This is carried over from the old implementation, and will likely need
  // to be updated to work with the new tracking plan. I think we should use
  // a config setting for this instead of trying to match the event name
  const isSendFlow = Boolean(eventPayload.event.match(/^send|^confirm/iu));
  if (options?.excludeMetaMetricsId !== false && isSendFlow) {
    excludeMetaMetricsId = true;
  }

  // The platform adapter reads the "anonymous" marker from track `properties`
  // and swaps the user id for the shared anonymous id when marked is true.
  if (excludeMetaMetricsId) {
    (eventPayload.properties as Record<string, Json>)[
      ANONYMOUS_EVENT_PROPERTY
    ] = true;
  }
}

function applyLegacyEventOptions(
  eventPayload: SegmentTrackPayload,
  options?: AnalyticsEventBuildOptions,
): void {
  if (options?.matomoEvent === true) {
    eventPayload.properties.legacy_event = true;
  }
}

function removeUtmPropertiesWithoutMarketingConsent<
  TProperties extends Record<string, Json>,
>(properties: TProperties): TProperties {
  if (getMetaMetricsState().dataCollectionForMarketing) {
    return properties;
  }

  return omit(properties, MARKETING_UTM_PARAMETERS) as TProperties;
}

function trackMetricsOptOutEvent(eventPayload: SegmentTrackPayload): void {
  const { analyticsId } = getMessenger().call('AnalyticsController:getState');

  if (analyticsId.length === 0 || getPlatform() === PLATFORM_FIREFOX) {
    return;
  }

  trackSegmentEventWhileOptedOut({
    analyticsId,
    event: MetaMetricsEventName.MetricsOptOut,
    properties: eventPayload.properties as Record<string, Json> | undefined,
    context: eventPayload.context as AnalyticsContext | undefined,
  });
}

export function trackEvent(
  built: AnalyticsEvent,
  options?: AnalyticsEventBuildOptions,
): void {
  try {
    const mergedOptions = { ...built.options, ...options };

    if (!canSubmitAnalytics(built.name)) {
      return;
    }

    const eventPayload = buildTrackEventPayload(built, mergedOptions);

    if (built.name === MetaMetricsEventName.MetricsOptOut) {
      trackMetricsOptOutEvent(eventPayload);
      return;
    }

    applyAnonymousEventOptions(eventPayload, mergedOptions);
    applyLegacyEventOptions(eventPayload, mergedOptions);

    const properties = removeUtmPropertiesWithoutMarketingConsent(
      eventPayload.properties,
    );
    const sensitiveProperties = removeUtmPropertiesWithoutMarketingConsent(
      eventPayload.sensitiveProperties ?? {},
    );

    getMessenger().call(
      'AnalyticsController:trackEvent',
      {
        name: eventPayload.event,
        properties,
        sensitiveProperties,
        saveDataRecording: false, // Legacy property that is ignored by the analytics controller and will be removed from the type in the future.
        hasProperties:
          Object.keys(properties).length > 0 ||
          Object.keys(sensitiveProperties).length > 0,
      } satisfies AnalyticsTrackingEvent,
      eventPayload.context as AnalyticsContext | undefined,
    );
  } catch (error) {
    sentryCaptureException(error);
  }
}

export function identify(
  userTraits: Partial<MetaMetricsUserTraits>,
  context?: AnalyticsContext,
): void {
  try {
    const identifyPayload = validateIdentifyPayload(userTraits);

    if (!identifyPayload) {
      return;
    }

    if (!canSubmitAnalytics()) {
      return;
    }

    getMessenger().call(
      'AnalyticsController:identify',
      identifyPayload,
      context,
    );
  } catch (error) {
    sentryCaptureException(error);
  }
}

export function trackPage(payload: MetaMetricsPagePayload): void {
  try {
    if (!canSubmitAnalytics()) {
      return;
    }

    const pagePayload = buildTrackPagePayload(payload);
    getMessenger().call(
      'AnalyticsController:trackView',
      pagePayload.name,
      pagePayload.properties,
      pagePayload.context,
    );
  } catch (error) {
    sentryCaptureException(error);
  }
}
