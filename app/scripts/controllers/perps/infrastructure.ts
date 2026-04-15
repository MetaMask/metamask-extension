/**
 * Platform Infrastructure for PerpsController
 *
 * Provides the PerpsPlatformDependencies required by @metamask/perps-controller.
 * Several dependencies are stubbed pending integration with extension services.
 */

import { createProjectLogger } from '@metamask/utils';
import browser from 'webextension-polyfill';
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
  PRICE_RANGES_UNIVERSAL,
} from '@metamask/perps-controller';
import { captureException } from '../../../../shared/lib/sentry';
import { validatedVersionGatedFeatureFlag } from '../../../../shared/lib/feature-flags/version-gating';

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

  return {
    formatVolume: (value: number) => compactFormatter.format(value),
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

function createDiskCache(): PerpsPlatformDependencies['diskCache'] {
  const memoryCache = new Map<string, string>();
  const storageLocal = browser?.storage?.local;

  return {
    getItemSync: (key: string) => memoryCache.get(key) ?? null,
    getItem: async (key: string) => {
      if (memoryCache.has(key)) {
        return memoryCache.get(key) ?? null;
      }

      if (!storageLocal) {
        return null;
      }

      const result = await storageLocal.get(key);
      if (!(key in result)) {
        return null;
      }

      const value = result[key];
      if (typeof value !== 'string') {
        return null;
      }

      memoryCache.set(key, value);
      return value;
    },
    setItem: async (key: string, value: string) => {
      memoryCache.set(key, value);
      if (storageLocal) {
        await storageLocal.set({ [key]: value });
      }
    },
    removeItem: async (key: string) => {
      memoryCache.delete(key);
      if (storageLocal) {
        await storageLocal.remove(key);
      }
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
    diskCache: createDiskCache(),
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
