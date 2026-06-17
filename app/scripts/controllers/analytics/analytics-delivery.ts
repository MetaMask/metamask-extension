import type {
  AnalyticsContext,
  AnalyticsUserTraits,
} from '@metamask/analytics-controller';
import type { Json } from '@metamask/utils';
import { captureException } from '../../../../shared/lib/sentry';
import { PLATFORM_FIREFOX } from '../../../../shared/constants/app';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import type { MetaMetricsUserTraits } from '../../../../shared/constants/metametrics';
import { trackSegmentEventWhileOptedOut } from '../../lib/segment/custom-segment-tracking';
import { getPlatform } from '../../lib/util';
import type {
  BuiltAnalyticsEvent,
  BuiltPageViewPayload,
} from './analytics-event-builder';
import type { AnalyticsEventBuilderMessenger } from './analytics-event-builder-messenger';

export type ConfigureAnalyticsDeliveryOptions = {
  messenger: AnalyticsEventBuilderMessenger;
};

let messenger: AnalyticsEventBuilderMessenger | undefined;

export function canSubmitAnalytics(eventName?: string): boolean {
  if (!messenger) {
    throw new Error('Analytics delivery has not been configured');
  }

  const { useExternalServices } = messenger.call(
    'PreferencesController:getState',
  );
  if (!useExternalServices) {
    return false;
  }

  if (eventName === MetaMetricsEventName.MetricsOptOut) {
    return true;
  }

  const { analyticsId, optedIn } = messenger.call(
    'AnalyticsController:getState',
  );
  return optedIn && analyticsId.length > 0;
}

/**
 * Configure shared analytics delivery helpers for the extension background.
 *
 * Call once during background initialization alongside
 * {@link configureAnalyticsEventBuilder}.
 *
 * @param options - Configuration options.
 * @param options.messenger - Messenger with access to analytics delivery actions.
 */
export function configureAnalyticsDelivery({
  messenger: configuredMessenger,
}: ConfigureAnalyticsDeliveryOptions): void {
  messenger = configuredMessenger;
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

/**
 * Validate and normalize user traits before delivery to
 * {@link AnalyticsController}.
 *
 * @param userTraits - Raw traits from MetaMetrics callers.
 * @returns Normalized traits for AnalyticsController, or undefined when invalid.
 */
export function validateIdentifyPayload(
  userTraits: Partial<MetaMetricsUserTraits>,
): AnalyticsUserTraits | undefined {
  if (!userTraits) {
    return undefined;
  }

  if (typeof userTraits !== 'object') {
    console.warn(
      `analytics delivery identify: userTraits parameter must be an object. Received type: ${typeof userTraits}`,
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
        `analytics delivery identify: "${key}" value is not a valid trait type`,
      );
    }
  }

  if (Object.keys(validTraits).length === 0) {
    return undefined;
  }

  return validTraits as AnalyticsUserTraits;
}

function trackMetricsOptOutEvent(built: BuiltAnalyticsEvent): void {
  const { analyticsId } = messenger?.call('AnalyticsController:getState') ?? {
    analyticsId: '',
  };

  if (analyticsId.length === 0 || getPlatform() === PLATFORM_FIREFOX) {
    return;
  }

  trackSegmentEventWhileOptedOut({
    analyticsId,
    event: MetaMetricsEventName.MetricsOptOut,
    properties: built.event.properties as Record<string, Json> | undefined,
    context: built.context,
  });
}

/**
 * Deliver a built analytics event to {@link AnalyticsController}.
 *
 * @param built - Event and context from {@link AnalyticsEventBuilder.createEventBuilder}.
 */
export function trackEvent(built: BuiltAnalyticsEvent): void {
  try {
    if (built.event.name === MetaMetricsEventName.MetricsOptOut) {
      if (!canSubmitAnalytics(built.event.name)) {
        return;
      }

      trackMetricsOptOutEvent(built);
      return;
    }

    if (!canSubmitAnalytics()) {
      return;
    }

    messenger?.call(
      'AnalyticsController:trackEvent',
      built.event,
      built.context,
    );
  } catch (error) {
    captureException(error);
  }
}

/**
 * Identify the user through {@link AnalyticsController}.
 *
 * @param userTraits - User traits to associate with the analytics identity.
 * @param context - Optional analytics context.
 */
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

    messenger?.call('AnalyticsController:identify', identifyPayload, context);
  } catch (error) {
    captureException(error);
  }
}

/**
 * Deliver a built page view to {@link AnalyticsController}.
 *
 * @param built - Page view payload from {@link buildPageViewPayload}.
 */
export function trackView(built: BuiltPageViewPayload): void {
  try {
    if (!canSubmitAnalytics()) {
      return;
    }

    messenger?.call(
      'AnalyticsController:trackView',
      built.name,
      built.properties,
      built.context,
    );
  } catch (error) {
    captureException(error);
  }
}
