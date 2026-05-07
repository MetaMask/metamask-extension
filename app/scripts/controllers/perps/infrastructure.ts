/**
 * Platform Infrastructure for PerpsController
 *
 * Provides the PerpsPlatformDependencies required by @metamask/perps-controller.
 * Several dependencies are stubbed pending integration with extension services.
 */

import { createProjectLogger } from '@metamask/utils';
import type * as Sentry from '@sentry/browser';
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
  FiatRangeConfig,
} from '@metamask/perps-controller';
import {
  formatPerpsFiat,
  formatPercentage,
  formatVolume,
  PRICE_RANGES_UNIVERSAL,
} from '../../../../shared/lib/perps-formatters';
import { PERPS_EVENT_PROPERTY } from '../../../../shared/constants/perps-events';
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
  getStorageItem: (key: string) => Promise<{
    result?: unknown;
    error?: Error;
  }>;
  setStorageItem: (key: string, value: string) => Promise<void>;
  removeStorageItem: (key: string) => Promise<void>;
};

const debugLog = createProjectLogger('perps');

function createLogger(): PerpsLogger {
  return {
    error: (error, options) => {
      const withScope = globalThis.sentry?.withScope;
      if (!withScope) {
        captureException(error);
        return;
      }
      withScope((scope: Sentry.Scope) => {
        scope.setTag('feature', 'perps');
        if (options?.tags) {
          for (const [k, v] of Object.entries(options.tags)) {
            scope.setTag(k, String(v));
          }
        }
        if (options?.context) {
          scope.setContext(options.context.name, options.context.data);
        }
        if (options?.extras) {
          scope.setExtras(options.extras);
        }
        captureException(error);
      });
    },
  };
}

function createDebugLogger(): PerpsDebugLogger {
  return { log: debugLog };
}

function createMetrics(deps: InfrastructureDeps): PerpsMetrics {
  return {
    // isEnabled always true: the MetaMetricsController.trackEvent messenger action is a
    // no-op when the user has not opted into analytics, so consent filtering is
    // enforced at that layer rather than here. Mobile delegates this check to
    // analytics.isEnabled() directly because it uses a different analytics stack.
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

const MAX_PENDING_SPANS = 50;

function createTracer(): PerpsTracer {
  const pendingSpans = new Map<
    string,
    {
      setAttribute: (key: string, value: PerpsTraceValue) => void;
      end: () => void;
    }
  >();

  return {
    trace: (params: {
      name: PerpsTraceName;
      id: string;
      op: string;
      tags?: Record<string, PerpsTraceValue>;
      data?: Record<string, PerpsTraceValue>;
    }) => {
      const startSpanManual = globalThis.sentry?.startSpanManual;
      if (!startSpanManual) {
        return;
      }

      const key = `${params.name}:${params.id}`;

      // End any existing span with the same key before overwriting to avoid
      // leaking the old span reference when trace() is called twice with the
      // same name/id pair.
      const existing = pendingSpans.get(key);
      if (existing) {
        existing.end();
        pendingSpans.delete(key);
      }

      // Evict the oldest pending span when the map is at capacity so the map
      // cannot grow unboundedly over long browser sessions.
      if (pendingSpans.size >= MAX_PENDING_SPANS) {
        const oldestKey = pendingSpans.keys().next().value;
        if (oldestKey !== undefined) {
          pendingSpans.get(oldestKey)?.end();
          pendingSpans.delete(oldestKey);
        }
      }

      startSpanManual(
        {
          name: params.name,
          op: params.op,
          attributes: { ...params.tags, ...params.data },
        },
        (span: {
          setAttribute: (key: string, value: PerpsTraceValue) => void;
          end: () => void;
        }) => {
          pendingSpans.set(key, span);
        },
      );
    },
    endTrace: (params: {
      name: PerpsTraceName;
      id: string;
      data?: Record<string, PerpsTraceValue>;
    }) => {
      const key = `${params.name}:${params.id}`;
      const pending = pendingSpans.get(key);
      if (pending) {
        if (params.data) {
          for (const [attrKey, attrValue] of Object.entries(params.data)) {
            pending.setAttribute(attrKey, attrValue);
          }
        }
        pending.end();
        pendingSpans.delete(key);
      }
    },
    setMeasurement: (name: string, value: number, unit: string) => {
      globalThis.sentry?.setMeasurement?.(name, value, unit);
    },
    addBreadcrumb: (breadcrumb: {
      category: string;
      message: string;
      level: 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';
      data?: Record<string, unknown>;
    }) => {
      globalThis.sentry?.addBreadcrumb?.(breadcrumb);
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
  return {
    // Mobile-parity magnitude-aware volume formatter (2 decimals for B/M, 0 for
    // K, 2 below $1K). Replaces the previous Intl.NumberFormat compact config,
    // which dropped trailing `.0` on round billions (`$2B` instead of mobile's
    // `$2.30B`). See shared/lib/perps-formatters.ts:formatVolume.
    formatVolume: (value: number) => formatVolume(value),
    formatPerpsFiat: (
      value: number,
      options?: { ranges?: unknown[] },
    ): string =>
      formatPerpsFiat(value, {
        ...options,
        ranges: options?.ranges as FiatRangeConfig[] | undefined,
      }),
    formatPercentage: (percent: number) => formatPercentage(percent),
    priceRangesUniversal: PRICE_RANGES_UNIVERSAL,
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

const PERPS_DISK_CACHE_KEY_PREFIX = 'diskCache:';

function getDiskCacheStorageKey(key: string): string {
  return `${PERPS_DISK_CACHE_KEY_PREFIX}${key}`;
}

function createDiskCache(
  deps: InfrastructureDeps,
): PerpsPlatformDependencies['diskCache'] {
  const memoryCache = new Map<string, string>();

  return {
    getItem: async (key: string) => {
      if (memoryCache.has(key)) {
        return memoryCache.get(key) ?? null;
      }

      const { result, error } = await deps.getStorageItem(
        getDiskCacheStorageKey(key),
      );
      if (error || typeof result !== 'string') {
        return null;
      }
      memoryCache.set(key, result);
      return result;
    },
    setItem: async (key: string, value: string) => {
      await deps.setStorageItem(getDiskCacheStorageKey(key), value);
      memoryCache.set(key, value);
    },
    removeItem: async (key: string) => {
      await deps.removeStorageItem(getDiskCacheStorageKey(key));
      memoryCache.delete(key);
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
    diskCache: createDiskCache(deps),
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
