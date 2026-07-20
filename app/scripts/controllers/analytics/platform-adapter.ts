import type {
  AnalyticsContext,
  AnalyticsDeliveryOptions,
  AnalyticsEventProperties,
  AnalyticsPlatformAdapter,
  AnalyticsUserTraits,
} from '@metamask/analytics-controller';
import type { Hex } from '@metamask/utils';
import { omit } from 'lodash';
import {
  METAMETRICS_ANONYMOUS_ID,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  AnonymousTransactionMetaMetricsEvent,
  TransactionMetaMetricsEvent,
} from '../../../../shared/constants/transaction';
import { UTM_PARAMETERS } from '../../../../shared/types/metametrics';
import {
  enrichWithABTests,
  getRemoteFeatureFlagsWithManifestOverrides,
  hasABTestAnalyticsMappingForEvent,
} from '../../../../shared/lib/ab-testing/ab-test-analytics';
import {
  segment as extensionSegmentSingleton,
  type SegmentClient,
} from '../../lib/segment';
import type { AnalyticsControllerInitMessenger } from '../../messenger-client-init/messengers/analytics-controller-messenger';

export const ANONYMOUS_EVENT_PROPERTY = 'anonymous' as const;

const MARKETING_UTM_PARAMETERS = [...UTM_PARAMETERS];
const APP_NAME = 'MetaMask Extension';

/**
 * Dependencies for universal analytics event enrichment at delivery time.
 */
export type PlatformAdapterEnrichmentContext = {
  getLocale: () => string;
  getDefaultChainId: () => Hex | null;
  getPageChainProperties: () => AnalyticsEventProperties;
  getProfileIdentityProperties: () => Record<string, string>;
  getMarketingCampaignCookieId: () => string | null;
  hasMarketingConsent: () => boolean;
  hasBasicFunctionalityEnabled: () => boolean;
  getRemoteFeatureFlags: () => Record<string, unknown>;
  appVersion: string;
  userAgent: string;
};

/**
 * Builds enrichment context from messenger reads and app version metadata.
 *
 * @param messenger - Messenger with analytics-related controller access.
 * @param appVersion - Formatted extension version string.
 * @param getProfileIdentityProperties - Resolver for cached profile identity properties.
 * @returns Enrichment context for universal metadata.
 */
export function createEnrichmentContext(
  messenger: AnalyticsControllerInitMessenger,
  appVersion: string,
  getProfileIdentityProperties: () => Record<string, string>,
): PlatformAdapterEnrichmentContext {
  const getDefaultChainId = (): Hex | null => {
    const { selectedNetworkClientId } = messenger.call(
      'NetworkController:getState',
    );
    const {
      configuration: { chainId },
    } = messenger.call(
      'NetworkController:getNetworkClientById',
      selectedNetworkClientId,
    );
    return chainId;
  };

  return {
    getLocale: () =>
      messenger
        .call('PreferencesController:getState')
        .currentLocale.replace('_', '-'),
    getDefaultChainId,
    getPageChainProperties: (): AnalyticsEventProperties => {
      const { isEvmSelected, selectedMultichainNetworkChainId } =
        messenger.call('MultichainNetworkController:getState');

      if (isEvmSelected) {
        return {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: getDefaultChainId(),
        } as AnalyticsEventProperties;
      }

      return {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        chain_id: null,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        chain_id_caip: selectedMultichainNetworkChainId,
      } as AnalyticsEventProperties;
    },
    getProfileIdentityProperties,
    getMarketingCampaignCookieId: () =>
      messenger.call('MetaMetricsController:getState')
        .marketingCampaignCookieId,
    hasMarketingConsent: () =>
      messenger.call('MetaMetricsController:getState')
        .dataCollectionForMarketing === true,
    hasBasicFunctionalityEnabled: () =>
      messenger.call('PreferencesController:getState').useExternalServices,
    getRemoteFeatureFlags: () =>
      getRemoteFeatureFlagsWithManifestOverrides(
        messenger.call('RemoteFeatureFlagController:getState')
          ?.remoteFeatureFlags as Record<string, unknown> | undefined,
      ),
    appVersion,
    userAgent: typeof window === 'undefined' ? '' : window.navigator.userAgent,
  };
}

/**
 * Adds universal event properties and removes UTM parameters when marketing
 * consent is not granted. For anonymous-marked payloads, strips any
 * caller-provided profile identity plus the anonymous marker.
 *
 * @param properties - Incoming event properties.
 * @param ctx - Enrichment context.
 * @returns Properties enriched with universal metadata.
 */
export function enrichEventProperties(
  properties: AnalyticsEventProperties,
  ctx: PlatformAdapterEnrichmentContext,
): AnalyticsEventProperties {
  const isAnonymousEvent = properties[ANONYMOUS_EVENT_PROPERTY] === true;
  const enrichedProperties: AnalyticsEventProperties = ctx.hasMarketingConsent()
    ? { ...properties }
    : (omit(
        { ...properties },
        MARKETING_UTM_PARAMETERS,
      ) as AnalyticsEventProperties);

  enrichedProperties.locale = ctx.getLocale();

  if (
    'chain_id_caip' in enrichedProperties &&
    typeof enrichedProperties.chain_id_caip === 'string'
  ) {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    enrichedProperties.chain_id = null;
  } else if (typeof enrichedProperties.chain_id !== 'string') {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    enrichedProperties.chain_id = ctx.getDefaultChainId();
  }

  if (!isAnonymousEvent) {
    Object.assign(enrichedProperties, ctx.getProfileIdentityProperties());
  }

  if (isAnonymousEvent) {
    const anonymousProperties = { ...enrichedProperties };
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    delete anonymousProperties.profile_id;
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    delete anonymousProperties.canonical_profile_id;
    delete anonymousProperties[ANONYMOUS_EVENT_PROPERTY];
    return anonymousProperties;
  }

  return enrichedProperties;
}

/**
 * Enriches track event properties with A/B test assignments from remote flags
 * and normalizes any caller-provided `active_ab_tests` payloads.
 *
 * @param eventName - Analytics event name.
 * @param properties - Incoming event properties.
 * @param ctx - Enrichment context.
 * @returns Properties enriched with A/B test assignments when applicable.
 */
export function enrichWithABTestAnalytics(
  eventName: string,
  properties: AnalyticsEventProperties,
  ctx: PlatformAdapterEnrichmentContext,
): AnalyticsEventProperties {
  let enrichedProperties = properties;

  if (
    // eslint-disable-next-line @typescript-eslint/naming-convention
    properties.active_ab_tests !== undefined
  ) {
    try {
      enrichedProperties =
        enrichWithABTests(
          { name: eventName, properties: enrichedProperties },
          null,
          [],
        ).properties ?? enrichedProperties;
    } catch {
      enrichedProperties = properties;
    }
  }

  if (!hasABTestAnalyticsMappingForEvent(eventName)) {
    return enrichedProperties;
  }

  try {
    return (
      enrichWithABTests(
        { name: eventName, properties: enrichedProperties },
        ctx.getRemoteFeatureFlags(),
      ).properties ?? enrichedProperties
    );
  } catch {
    return enrichedProperties;
  }
}

/**
 * Adds universal Segment context fields.
 *
 * @param context - Incoming analytics context.
 * @param ctx - Enrichment context.
 * @returns Context enriched with universal metadata.
 */
export function enrichEventContext(
  context: AnalyticsContext | undefined,
  ctx: PlatformAdapterEnrichmentContext,
): AnalyticsContext {
  const enrichedContext: AnalyticsContext = { ...(context ?? {}) };

  enrichedContext.app = {
    name: APP_NAME,
    version: ctx.appVersion,
  };
  enrichedContext.userAgent = ctx.userAgent;
  enrichedContext.marketingCampaignCookieId =
    ctx.getMarketingCampaignCookieId();

  return enrichedContext;
}

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
 * - Drops delivery when basic functionality is disabled, including for direct
 * AnalyticsController messenger callers that bypass analytics.ts.
 * - Injects A/B test assignments for mapped track events at delivery time.
 * - Enriches track/view/identify payloads with universal metadata at delivery time.
 * - Caller-specific metadata (environment_type, page, referrer) is added upstream in analytics.ts only.
 * - Build full Segment payloads from adapter inputs. Track payloads marked
 * with `properties.anonymous` are downgraded to the shared anonymous ID before
 * being sent to Segment.
 *
 * Sets `skipUUIDv4Check: true`: extension `analyticsId` values are
 * non-UUIDv4 hex strings (PR MetaMask/core#8543).
 *
 * @param enrichmentContext - Context used to fill universal metadata downstream.
 * @returns Platform adapter implementation for Segment delivery.
 */
export function createPlatformAdapter(
  enrichmentContext: PlatformAdapterEnrichmentContext,
): AnalyticsPlatformAdapter {
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
      if (!enrichmentContext.hasBasicFunctionalityEnabled()) {
        return;
      }

      const isAnonymousEvent = properties?.[ANONYMOUS_EVENT_PROPERTY] === true;
      const abEnrichedProperties = enrichWithABTestAnalytics(
        eventName,
        properties ?? {},
        enrichmentContext,
      );
      const enrichedProperties = enrichEventProperties(
        abEnrichedProperties,
        enrichmentContext,
      );
      const enrichedContext = enrichEventContext(context, enrichmentContext);

      const payload = {
        ...buildBasePayload(
          isAnonymousEvent
            ? { anonymousId: METAMETRICS_ANONYMOUS_ID }
            : { userId: cachedAnalyticsId },
          enrichedContext,
          options,
        ),
        event: isAnonymousEvent ? getAnonymousEventName(eventName) : eventName,
        properties: enrichedProperties,
      };
      client.track(payload, options?.callback);
    },

    identify(
      userId: string,
      traits?: AnalyticsUserTraits,
      context?: AnalyticsContext,
      options?: AnalyticsDeliveryOptions,
    ): void {
      if (!enrichmentContext.hasBasicFunctionalityEnabled()) {
        return;
      }

      const enrichedContext = enrichEventContext(context, enrichmentContext);
      const payload = {
        ...buildBasePayload({ userId }, enrichedContext, options),
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
      if (!enrichmentContext.hasBasicFunctionalityEnabled()) {
        return;
      }

      const enrichedProperties = enrichEventProperties(
        properties ?? {},
        enrichmentContext,
      );
      // TODO: For some reason, the chainId logic is different for events and pages.
      // Unless there's a strong reason not too, we should align both at some point.
      const pageChainProperties = enrichmentContext.getPageChainProperties();
      Object.assign(enrichedProperties, pageChainProperties);
      if (!('chain_id_caip' in pageChainProperties)) {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        delete enrichedProperties.chain_id_caip;
      }
      const enrichedContext = enrichEventContext(context, enrichmentContext);

      const payload = {
        ...buildBasePayload(
          { userId: cachedAnalyticsId },
          enrichedContext,
          options,
        ),
        name,
        properties: enrichedProperties,
      };
      client.page(payload, options?.callback);
    },

    onSetupCompleted(analyticsId: string): void {
      cachedAnalyticsId = analyticsId;
    },
  };
}
