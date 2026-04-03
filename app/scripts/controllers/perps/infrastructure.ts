/**
 * Platform Infrastructure for PerpsController
 *
 * Provides the PerpsPlatformDependencies required by @metamask/perps-controller.
 * Several dependencies are stubbed pending integration with extension services.
 */

import { createProjectLogger } from '@metamask/utils';
import { PERPS_EVENT_PROPERTY } from '@metamask/perps-controller';
import type {
  PerpsPlatformDependencies,
  PerpsCacheInvalidator,
  MarketDataFormatters,
  PerpsLogger,
  PerpsDebugLogger,
  PerpsMetrics,
  PerpsPerformance,
  PerpsTracer,
  PerpsStreamManager,
  PerpsAnalyticsEvent,
  PerpsAnalyticsProperties,
  PerpsTraceName,
  PerpsTraceValue,
  InvalidateCacheParams,
} from '@metamask/perps-controller';
import {
  MetaMetricsEventCategory,
  type MetaMetricsEventPayload,
} from '../../../../shared/constants/metametrics';
import { captureException } from '../../../../shared/lib/sentry';
import { validatedVersionGatedFeatureFlag } from '../../../../shared/lib/feature-flags/version-gating';

/**
 * Dependencies required to wire {@link createPerpsInfrastructure} to extension services.
 */
export type InfrastructureDeps = {
  trackEvent: (payload: MetaMetricsEventPayload) => void;
};

const debugLog = createProjectLogger('perps');

function createLogger(): PerpsLogger {
  return {
    error: (error) => {
      captureException(error);
    },
  };
}

function createDebugLogger(): PerpsDebugLogger {
  return { log: debugLog };
}

function createMetrics(deps: InfrastructureDeps): PerpsMetrics {
  return {
    // Always return true here: opt-in filtering is handled upstream by
    // MetaMetricsController.trackEvent, which no-ops when the user hasn't
    // consented to analytics. Mobile delegates this check to
    // analytics.isEnabled() directly, but on extension the MetaMetrics
    // layer is the single source of truth for consent enforcement.

    isEnabled: () => true,
    trackPerpsEvent: (
      event: PerpsAnalyticsEvent,
      properties: PerpsAnalyticsProperties,
    ) => {
      deps.trackEvent({
        event,
        category: MetaMetricsEventCategory.Perps,
        properties: {
          ...properties,
          [PERPS_EVENT_PROPERTY.TIMESTAMP]: Date.now(),
        },
      });
    },
  };
}

function createPerformance(): PerpsPerformance {
  return {
    now: () => performance.now(),
  };
}

function createTracer(): PerpsTracer {
  return {
    trace: (_params: {
      name: PerpsTraceName;
      id: string;
      op: string;
      tags?: Record<string, PerpsTraceValue>;
      data?: Record<string, PerpsTraceValue>;
    }) => {
      // TODO: Integrate with Sentry tracing when ready
    },
    endTrace: (_params: {
      name: PerpsTraceName;
      id: string;
      data?: Record<string, PerpsTraceValue>;
    }) => {
      // TODO: End Sentry span
    },
    setMeasurement: (_name: string, _value: number, _unit: string) => {
      // TODO: Set Sentry measurement
    },
  };
}

function createStreamManager(): PerpsStreamManager {
  return {
    pauseChannel: (_channel: string) => {
      // No-op for PoC
    },
    resumeChannel: (_channel: string) => {
      // No-op for PoC
    },
    clearAllChannels: () => {
      // No-op for PoC
    },
  };
}

function createFeatureFlags(): PerpsPlatformDependencies['featureFlags'] {
  return {
    validateVersionGated: (flag) => validatedVersionGatedFeatureFlag(flag),
  };
}

function createMarketDataFormatters(): MarketDataFormatters {
  const compactFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  });

  const fiatFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const percentFormatter = new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return {
    formatVolume: (value: number) => compactFormatter.format(value),
    formatPerpsFiat: (value: number) => fiatFormatter.format(value),
    formatPercentage: (percent: number) =>
      percentFormatter.format(percent / 100),
    priceRangesUniversal: [],
  };
}

function createCacheInvalidator(): PerpsCacheInvalidator {
  return {
    invalidate: (_params: InvalidateCacheParams) => {
      // TODO: Wire to React Query or custom cache when ready
    },
    invalidateAll: () => {
      // TODO: Wire to React Query or custom cache when ready
    },
  };
}

/**
 * Create the complete PerpsPlatformDependencies for the extension.
 *
 * @param deps - Platform hooks (e.g. MetaMetrics `trackEvent`).
 * @returns PerpsPlatformDependencies object ready for PerpsController
 */
export function createPerpsInfrastructure(
  deps: InfrastructureDeps,
): PerpsPlatformDependencies {
  return {
    logger: createLogger(),
    debugLogger: createDebugLogger(),
    metrics: createMetrics(deps),
    performance: createPerformance(),
    tracer: createTracer(),
    streamManager: createStreamManager(),
    featureFlags: createFeatureFlags(),
    marketDataFormatters: createMarketDataFormatters(),
    cacheInvalidator: createCacheInvalidator(),
    rewards: {
      getPerpsDiscountForAccount: async (
        _caipAccountId: `${string}:${string}:${string}`,
      ) => {
        // TODO: Wire to RewardsController when available
        return 0;
      },
    },
  };
}
