import type { Json } from '@metamask/utils';
import { MetaMetricsEventName } from '../../constants/metametrics';
import { sanitizeErrorMessage } from '../sanitize-error-message';
import { createEventBuilder } from './create-event-builder';
import type { AnalyticsEventBuildOptions } from './create-event-builder';

/**
 * Canonical required severity levels for error events.
 */
export type TrackErrorSeverity = 'info' | 'warning' | 'error';

/**
 * The controlled namespace under which optional caller context fields are
 * placed in the event payload. Nothing outside this namespace may be written
 * by callers.
 */
export const ERROR_CONTEXT_NAMESPACE = 'error_context';

/**
 * Default volume-control configuration for `trackErrorAsAnalytics`.
 *
 * `samplingRate`: probability (0-1) that an individual event is emitted.
 * `dedupWindowMs`: repeated events with the same signature within this
 * window are suppressed.
 * `sessionCap`: maximum number of events emitted per runtime session,
 * with caller-supplied values above this default clamped.
 */
export const DEFAULT_ERROR_TRACKING_OPTIONS = {
  samplingRate: 1,
  dedupWindowMs: 10_000,
  sessionCap: 50,
} as const;

/**
 * Function-internal volume-control knobs, separated from event build
 * options so the two can never mix.
 */
export type TrackErrorVolumeControls = {
  /**
   * Per-event sampling rate between 0 and 1 (1 = always emit).
   */
  samplingRate?: number;
  /**
   * Deduplication window in milliseconds. Events sharing a signature within
   * this window are suppressed.
   */
  dedupWindowMs?: number;
  /**
   * Maximum number of events emitted per runtime session. May only lower
   * the global cap (`DEFAULT_ERROR_TRACKING_OPTIONS.sessionCap`). Larger
   * values are clamped so no caller can bypass the session bound.
   */
  sessionCap?: number;
};

export type TrackErrorAsAnalyticsOptions = {
  /**
   * Canonical event category (e.g. a `MetaMetricsEventCategory` value).
   * Required canonical field.
   */
  category: string;
  /**
   * Identifies the operation or callsite that produced the error (e.g.
   * `'clear-metametrics-data'`). Required canonical field.
   */
  source: string;
  /**
   * Canonical severity of the reported error. Defaults to `'error'`.
   */
  severity?: TrackErrorSeverity;
  /**
   * Optional caller context. Values are copied into the event payload under
   * the controlled `error_context` namespace only. Keys must be
   * `snake_case`.
   */
  context?: Record<string, Json>;
  /**
   * Pass-through options forwarded verbatim to the event builder (e.g.
   * `excludeMetaMetricsId`, `matomoEvent`). Kept separate from the
   * schema fields and volume controls so the three kinds of options
   * cannot mix.
   */
  buildOptions?: AnalyticsEventBuildOptions;
  /**
   * Function-internal volume-control knobs.
   */
  volumeControls?: TrackErrorVolumeControls;
};

export type TrackErrorReporter = (event: {
  name: string;
  properties: Record<string, Json>;
  sensitiveProperties: Record<string, Json>;
  options?: AnalyticsEventBuildOptions;
}) => Promise<void> | void;

// Snake_case metric property keys are required by the MetaMetrics schema.
const ERROR_MESSAGE_KEY = 'error_message';

type ErrorProperties = {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  error_message: string;
};

let emittedCount = 0;

const lastEmittedAtBySignature = new Map<string, number>();

/**
 * Normalizes any thrown value into a sanitized string representation.
 *
 * @param error - The caught value to normalize.
 * @returns The sanitized error message.
 */
function normalizeError(error: unknown): { errorMessage: string } {
  if (error instanceof Error) {
    return { errorMessage: sanitizeErrorMessage(error.message) };
  }
  if (error === null || error === undefined) {
    return { errorMessage: 'Unknown error' };
  }
  if (typeof error === 'string') {
    return { errorMessage: sanitizeErrorMessage(error) };
  }
  if (
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return { errorMessage: sanitizeErrorMessage(error.message) };
  }
  try {
    return { errorMessage: sanitizeErrorMessage(String(error)) };
  } catch {
    return { errorMessage: 'Unknown error' };
  }
}

/**
 * Resolves the sampling rate, clamping to [0, 1] and falling back to the
 * default for non-finite values, so a caller bug can never disable the
 * sampling control (NaN comparisons are always false and would emit).
 *
 * @param samplingRate - Caller-supplied rate, or undefined for default.
 * @returns A finite sampling rate between 0 and 1.
 */
function resolveSamplingRate(samplingRate?: number): number {
  const fallback = DEFAULT_ERROR_TRACKING_OPTIONS.samplingRate;
  if (typeof samplingRate !== 'number' || !Number.isFinite(samplingRate)) {
    return fallback;
  }
  return Math.min(Math.max(samplingRate, 0), 1);
}

/**
 * Resolves a volume-control number, falling back to the default for
 * non-finite or negative values, so a caller bug can never disable the
 * corresponding control.
 *
 * @param value - Caller-supplied value, or undefined for default.
 * @param fallback - Default value used when the input is invalid.
 * @returns A finite, non-negative number.
 */
function resolveNonNegativeNumber(
  value: number | undefined,
  fallback: number,
): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return fallback;
  }
  return value;
}

/**
 * Reports a caught error as an analytics event.
 *
 * Emits `MetaMetricsEventName.ErrorOccured` with `category`, `source`,
 * `severity`, a sanitized `error_message` (whitespace-normalized, capped
 * at 500 characters) in properties, and any `context` under the
 * `error_context` namespace.
 * Raw stack traces are never sent: Sentry is the stack destination
 * (call sites that need it use `captureException`). Mirrors Mobile's
 * `trackErrorAsAnalytics` (single shared error event, regular properties).
 *
 * Fail-safe: never throws, and the returned promise always resolves.
 * Volume controls (`samplingRate`, `dedupWindowMs`, `sessionCap`) bound
 * event volume, and `sessionCap` may only be lowered, never raised. See
 * `TrackErrorVolumeControls`. The dedup map and the
 * session cap are per JavaScript context (popup, notification, expanded
 * view, and background count separately, and popups reset on close). The
 * cap budget is shared by all callers and categories in that context.
 *
 * The `report` callback must be the consent-aware reporting path (the
 * `trackEvent` from `useAnalytics`, or the background `trackEvent`), so
 * events are not dispatched for opted-out users.
 *
 * @param report - Consent-aware reporter to dispatch the event through.
 * @param error - The caught value to report.
 * @param options - Schema fields, `buildOptions`, and `volumeControls`.
 * @returns A promise that always resolves.
 * @example
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   await trackErrorAsAnalytics(trackAnalyticsEvent, error, {
 *     category: MetaMetricsEventCategory.Swaps,
 *     source: 'swap-quote-fetch',
 *     severity: 'warning',
 *     context: { origin: 'swap-quote-fetch' },
 *     buildOptions: { excludeMetaMetricsId: true },
 *   });
 * }
 */
export async function trackErrorAsAnalytics(
  report: TrackErrorReporter,
  error: unknown,
  options: TrackErrorAsAnalyticsOptions,
): Promise<void> {
  try {
    const volumeControls = options.volumeControls ?? {};
    const samplingRate = resolveSamplingRate(volumeControls.samplingRate);
    const dedupWindowMs = resolveNonNegativeNumber(
      volumeControls.dedupWindowMs,
      DEFAULT_ERROR_TRACKING_OPTIONS.dedupWindowMs,
    );
    // The global cap is a hard ceiling: a caller-supplied sessionCap may
    // only lower it, never raise it.
    const sessionCap = Math.min(
      resolveNonNegativeNumber(
        volumeControls.sessionCap,
        DEFAULT_ERROR_TRACKING_OPTIONS.sessionCap,
      ),
      DEFAULT_ERROR_TRACKING_OPTIONS.sessionCap,
    );

    if (emittedCount >= sessionCap) {
      return;
    }

    if (Math.random() >= samplingRate) {
      return;
    }

    const { errorMessage } = normalizeError(error);

    const severity = options.severity ?? 'error';
    const { source } = options;

    const signature = `${MetaMetricsEventName.ErrorOccured}:${options.category}:${source}:${severity}:${errorMessage}`;

    const lastEmittedAt = lastEmittedAtBySignature.get(signature);
    if (
      lastEmittedAt !== undefined &&
      Date.now() - lastEmittedAt < dedupWindowMs
    ) {
      return;
    }

    const event = createEventBuilder(MetaMetricsEventName.ErrorOccured)
      .addCategory(options.category)
      .addProperties({
        source,
        severity,
        ...({
          [ERROR_MESSAGE_KEY]: errorMessage,
        } satisfies ErrorProperties),
        ...(options.context
          ? { [ERROR_CONTEXT_NAMESPACE]: options.context }
          : {}),
      })
      .build(options.buildOptions);

    // Reserve the cap budget and dedup timestamp synchronously, before
    // awaiting the reporter, so concurrent calls cannot all pass the
    // checks while a first report is still pending.
    const reservedAt = Date.now();
    emittedCount += 1;
    lastEmittedAtBySignature.set(signature, reservedAt);

    try {
      await report(event);
    } catch {
      // Rollback policy: a failed report emitted nothing, so release the
      // reservation. The session budget is not consumed and the next
      // identical error is not suppressed by dedup.
      emittedCount = Math.max(0, emittedCount - 1);
      if (lastEmittedAtBySignature.get(signature) === reservedAt) {
        lastEmittedAtBySignature.delete(signature);
      }
    }
  } catch {
    // Fail-safe by contract: telemetry must never break the calling flow.
  }
}

/**
 * Clears the in-memory volume-control state (session emission count and
 * deduplication signatures). Intended for test isolation only; production
 * code should never need to call this.
 */
export function resetTrackErrorAsAnalyticsStateForTesting(): void {
  emittedCount = 0;
  lastEmittedAtBySignature.clear();
}
