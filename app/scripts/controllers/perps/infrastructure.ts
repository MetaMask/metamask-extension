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
} from '@metamask/perps-controller';
import { captureException } from '../../../../shared/lib/sentry';
import { validatedVersionGatedFeatureFlag } from '../../../../shared/lib/feature-flags/version-gating';

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

function createMetrics(): PerpsMetrics {
  return {
    isEnabled: () => false,
    trackPerpsEvent: (
      _event: PerpsAnalyticsEvent,
      _properties: PerpsAnalyticsProperties,
    ) => {
      // TODO: Integrate with MetaMetrics when ready
    },
  };
}

function createPerformance(): PerpsPerformance {
  return {
    now: () => performance.now(),
  };
}

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
          pendingSpans.set(`${params.name}:${params.id}`, span);
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
 * @returns PerpsPlatformDependencies object ready for PerpsController
 */
export function createPerpsInfrastructure(): PerpsPlatformDependencies {
  return {
    logger: createLogger(),
    debugLogger: createDebugLogger(),
    metrics: createMetrics(),
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
