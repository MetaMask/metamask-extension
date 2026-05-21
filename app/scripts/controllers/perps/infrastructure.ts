/**
 * Platform Infrastructure for PerpsController
 *
 * Provides the PerpsPlatformDependencies required by @metamask/perps-controller.
 * Several dependencies are stubbed pending integration with extension services.
 */

import { CaipAccountId, createProjectLogger } from '@metamask/utils';
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
import { isBenignDisconnectError } from './perps-error-utils';

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
  /**
   * Returns true while a self-initiated disconnect() is in progress (e.g.
   * during an account switch). Used to suppress benign WS-race errors that
   * are guaranteed to be side-effects of our own teardown rather than real
   * failures.
   */
  isDisconnecting?: () => boolean;
  /**
   * Bridge to {@link RewardsController.getPerpsDiscountForAccount}. The
   * rewards controller owns the fee-discount logic; perps just supplies the
   * account and its own base fee in bips. The controller returns null when
   * the discount is currently unknowable (unhydrated cache, fetch error, no
   * subscription); this adapter collapses null to 0 before returning to the
   * core perps-controller, which expects a numeric discount.
   */
  getPerpsDiscountForAccount: (
    caipAccountId: `${string}:${string}:${string}`,
    baseFeeBips: number,
  ) => Promise<number | null>;
};

const debugLog = createProjectLogger('perps');

function createLogger(deps: InfrastructureDeps): PerpsLogger {
  return {
    error: (error, options) => {
      // Suppress benign WS-close errors only while our own disconnect() is
      // active (account switch in progress). Outside that window the same
      // error shapes indicate real connectivity problems and must reach Sentry.
      //
      // KNOWN TRADEOFF: this guard intentionally suppresses every benign-shaped
      // error during the disconnect window, including write-context errors
      // (placeOrder, editOrder, cancelOrder, closePosition, updateMargin,
      // flipPosition, withdraw, ...). We accept this for two reasons:
      //
      //   1. Account switches generate a high volume of in-flight read/stream
      //      cancellations whose error shape is indistinguishable from a true
      //      write race at this layer. Reporting them clutters both the dev
      //      console (captureException -> console.error) and the Sentry inbox
      //      enough to drown out real signal. We verified empirically that
      //      gating on `options.context.data.method` to let write-path errors
      //      through produced many false positives during normal account
      //      switches without surfacing actionable failures.
      //   2. Writes that genuinely race with `disconnect()` are observable to
      //      the user via the UI (orders surface success/failure inline and
      //      withdrawals via transaction state) and to the team via product
      //      reports, so we are not relying on Sentry as the primary signal
      //      for "did the order go through?" during account switches.
      //
      // If that invariant changes (e.g. writes start being issued from
      // non-user-initiated paths during disconnect, or UI surfacing weakens),
      // tighten this guard by gating on `options.context.data.method` against
      // the upstream write-method names so write contexts bypass suppression.
      if (
        isBenignDisconnectError(error) &&
        (deps.isDisconnecting?.() ?? false)
      ) {
        debugLog('Suppressed benign perps WS disconnect race', error, options);
        return;
      }
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
    logger: createLogger(deps),
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
      // The perps package only passes `caipAccountId`; the rewards controller
      // additionally needs the perps MetaMask builder base fee in bips so it
      // can convert the absolute reward fee into a discount fraction. We
      // source the base fee from the perps package's own constants here so
      // the rewards controller stays a pure transformer.
      getPerpsDiscountForAccount: async (
        caipAccountId: `${string}:${string}:${string}`,
        baseFeeBips: number,
      ) => {
        try {
          const result = await deps.getPerpsDiscountForAccount(
            caipAccountId,
            baseFeeBips,
          );
          // The rewards controller returns null when the discount is
          // currently unknowable; treat it the same as a thrown error so
          // the core perps-controller (which expects a number) sees a
          // safe "no discount" fallback.
          return result ?? 0;
        } catch {
          // Never let a discount lookup failure block a trade — return 0.
          return 0;
        }
      },
    },
  };
}
