import type {
  AnalyticsContext,
  AnalyticsEventProperties,
  AnalyticsTrackingEvent,
  AnalyticsUserTraits,
} from '@metamask/analytics-controller';
import type { AuthenticationController } from '@metamask/profile-sync-controller';
import type { Json } from '@metamask/utils';
import { omitBy } from 'lodash';
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
import type { AnalyticsControllerInitMessenger } from '../../messenger-client-init/messengers/analytics-controller-messenger';
import { trackSegmentEventWhileOptedOut } from '../../lib/segment/custom-segment-tracking';
import { getPlatform } from '../../lib/util';
import { ANONYMOUS_EVENT_PROPERTY } from './platform-adapter';

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
  messenger: AnalyticsControllerInitMessenger;
};

let messenger: AnalyticsControllerInitMessenger | undefined;
let cachedProfileIdentity:
  | {
      profileId?: string;
      canonicalProfileId?: string;
    }
  | undefined;

function getMessenger(): AnalyticsControllerInitMessenger {
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
 */
export function configureAnalytics({
  messenger: configuredMessenger,
}: ConfigureAnalyticsOptions): void {
  messenger = configuredMessenger;
}

/**
 * Cache profile identity derived from SRP session data for event properties.
 * Only profile IDs are retained, not access tokens or other session fields.
 *
 * @param srpSessionData - Current SRP session data from MetaMask state.
 */
export function updateProfileSessionData(
  srpSessionData: AuthenticationController.AuthenticationControllerState['srpSessionData'],
): void {
  const profile = Object.entries(srpSessionData ?? {})?.[0]?.[1]?.profile;

  if (!profile) {
    cachedProfileIdentity = undefined;
    return;
  }

  cachedProfileIdentity = {
    profileId: profile.profileId,
    canonicalProfileId: profile.canonicalProfileId,
  };
}

export function getProfileIdentityProperties(): Record<string, string> {
  return omitBy(
    {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      profile_id: cachedProfileIdentity?.profileId,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      canonical_profile_id: cachedProfileIdentity?.canonicalProfileId,
    },
    (value) => !value,
  ) as Record<string, string>;
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

function buildContext(
  referrer: MetaMetricsContext['referrer'],
  page: MetaMetricsContext['page'] = METAMETRICS_BACKGROUND_PAGE_OBJECT,
): MetaMetricsContext {
  return omitBy(
    {
      page,
      referrer,
    },
    (propertyValue) => propertyValue === undefined,
  ) as MetaMetricsContext;
}

function buildTrackEventPayload(
  rawEvent: AnalyticsEvent,
  options?: AnalyticsEventBuildOptions,
): SegmentTrackPayload {
  const { name: event, properties, sensitiveProperties } = rawEvent;
  const {
    environmentType = ENVIRONMENT_TYPE_BACKGROUND,
    page,
    referrer,
  } = options ?? {};

  return {
    event,
    properties: omitBy(
      {
        ...properties,
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

  return {
    name: name ?? '',
    properties: omitBy(
      {
        params,
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

export function trackEvent(
  built: AnalyticsEvent,
  options?: AnalyticsEventBuildOptions,
): void {
  try {
    const mergedOptions = { ...built.options, ...options };

    if (!isBasicFunctionalityEnabled()) {
      return;
    }

    const eventPayload = buildTrackEventPayload(built, mergedOptions);

    if (built.name === MetaMetricsEventName.MetricsOptOut) {
      const { analyticsId } = getMessenger().call(
        'AnalyticsController:getState',
      );

      if (analyticsId.length === 0 || getPlatform() === PLATFORM_FIREFOX) {
        return;
      }

      trackSegmentEventWhileOptedOut({
        analyticsId,
        event: MetaMetricsEventName.MetricsOptOut,
        properties: eventPayload.properties as Record<string, Json> | undefined,
        context: eventPayload.context as AnalyticsContext | undefined,
      });
      return;
    }

    applyAnonymousEventOptions(eventPayload, mergedOptions);
    applyLegacyEventOptions(eventPayload, mergedOptions);

    getMessenger().call(
      'AnalyticsController:trackEvent',
      {
        name: eventPayload.event,
        properties: eventPayload.properties,
        sensitiveProperties: eventPayload.sensitiveProperties ?? {},
        saveDataRecording: false, // Legacy property that is ignored by the analytics controller and will be removed from the type in the future.
        hasProperties:
          Object.keys(eventPayload.properties).length > 0 ||
          Object.keys(eventPayload.sensitiveProperties ?? {}).length > 0,
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
