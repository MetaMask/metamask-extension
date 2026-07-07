import type {
  AnalyticsContext,
  AnalyticsDeliveryOptions,
  AnalyticsEventProperties,
  AnalyticsPlatformAdapter,
  AnalyticsUserTraits,
} from '@metamask/analytics-controller';
import {
  METAMETRICS_ANONYMOUS_ID,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  AnonymousTransactionMetaMetricsEvent,
  TransactionMetaMetricsEvent,
} from '../../../../shared/constants/transaction';
import {
  segment as extensionSegmentSingleton,
  type SegmentClient,
} from '../../lib/segment';

export const ANONYMOUS_EVENT_PROPERTY = 'anonymous' as const;

const anonymousEventNameOverrides = {
  [TransactionMetaMetricsEvent.added]:
    AnonymousTransactionMetaMetricsEvent.added,
  [TransactionMetaMetricsEvent.approved]:
    AnonymousTransactionMetaMetricsEvent.approved,
  [TransactionMetaMetricsEvent.finalized]:
    AnonymousTransactionMetaMetricsEvent.finalized,
  [TransactionMetaMetricsEvent.rejected]:
    AnonymousTransactionMetaMetricsEvent.rejected,
  [TransactionMetaMetricsEvent.submitted]:
    AnonymousTransactionMetaMetricsEvent.submitted,
  [MetaMetricsEventName.SignatureRequested]:
    MetaMetricsEventName.SignatureRequestedAnon,
  [MetaMetricsEventName.SignatureApproved]:
    MetaMetricsEventName.SignatureApprovedAnon,
  [MetaMetricsEventName.SignatureRejected]:
    MetaMetricsEventName.SignatureRejectedAnon,
} as const;

function getSegmentClient(): SegmentClient {
  return extensionSegmentSingleton;
}

type BasePayload = {
  context?: AnalyticsContext;
  messageId?: AnalyticsDeliveryOptions['messageId'];
  timestamp?: AnalyticsDeliveryOptions['timestamp'];
} & ({ userId: string } | { anonymousId: string });

function buildBasePayload(
  identity: { userId: string } | { anonymousId: string },
  context?: AnalyticsContext,
  options?: AnalyticsDeliveryOptions,
): BasePayload {
  return {
    ...identity,
    ...(context ? { context } : {}),
    ...(options?.messageId ? { messageId: options.messageId } : {}),
    ...(options?.timestamp ? { timestamp: options.timestamp } : {}),
  };
}

function getAnonymousEventName(eventName: string): string {
  return (
    anonymousEventNameOverrides[
      eventName as keyof typeof anonymousEventNameOverrides
    ] ?? eventName
  );
}

/**
 * Platform adapter for the AnalyticsController.
 *
 * - Build full Segment payloads from adapter inputs. Track payloads marked
 * with `properties.anonymous` are downgraded to the shared anonymous ID before
 * being sent to Segment.
 *
 * Sets `skipUUIDv4Check: true`: extension `analyticsId` values are
 * non-UUIDv4 hex strings (PR MetaMask/core#8543).
 */
export function createPlatformAdapter(): AnalyticsPlatformAdapter {
  let cachedAnalyticsId: string;
  const client = getSegmentClient();

  return {
    skipUUIDv4Check: true,

    track(
      eventName: string,
      properties?: AnalyticsEventProperties,
      context?: AnalyticsContext,
      options?: AnalyticsDeliveryOptions,
    ): void {
      const isAnonymousEvent = properties?.[ANONYMOUS_EVENT_PROPERTY] === true;
      let payloadProperties = properties;
      if (isAnonymousEvent) {
        payloadProperties = { ...properties };
        delete payloadProperties[ANONYMOUS_EVENT_PROPERTY];
      }

      const payload = {
        ...buildBasePayload(
          isAnonymousEvent
            ? { anonymousId: METAMETRICS_ANONYMOUS_ID }
            : { userId: cachedAnalyticsId },
          context,
          options,
        ),
        event: isAnonymousEvent ? getAnonymousEventName(eventName) : eventName,
        ...(payloadProperties ? { properties: payloadProperties } : {}),
      };
      client.track(payload, options?.callback);
    },

    identify(
      userId: string,
      traits?: AnalyticsUserTraits,
      context?: AnalyticsContext,
      options?: AnalyticsDeliveryOptions,
    ): void {
      const payload = {
        ...buildBasePayload({ userId }, context, options),
        ...(traits ? { traits } : {}),
      };
      client.identify(payload, options?.callback);
    },

    view(
      name: string,
      properties?: AnalyticsEventProperties,
      context?: AnalyticsContext,
      options?: AnalyticsDeliveryOptions,
    ): void {
      const payload = {
        ...buildBasePayload({ userId: cachedAnalyticsId }, context, options),
        name,
        ...(properties ? { properties } : {}),
      };
      client.page(payload, options?.callback);
    },

    onSetupCompleted(analyticsId: string): void {
      cachedAnalyticsId = analyticsId;
    },
  };
}
