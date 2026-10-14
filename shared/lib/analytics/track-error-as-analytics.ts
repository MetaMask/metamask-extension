import type { Json } from '@metamask/utils';
import { MetaMetricsEventName } from '../../constants/metametrics';
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
 * `sessionCap`: maximum number of events emitted per runtime session.
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
   * Maximum number of events emitted per runtime session.
   */
  sessionCap?: number;
  /**
   * Injectable draw used for sampling, for deterministic tests. Returns a
   * number between 0 and 1.
   */
  draw?: () => number;
  /**
   * Injectable clock used for dedup timing, for deterministic tests.
   * Returns the current time in milliseconds.
   */
  now?: () => number;
};

export type TrackErrorAsAnalyticsOptions = {
  /**
   * Canonical event category (e.g. a `MetaMetricsEventCategory` value).
   * Required canonical field.
   */
  category: string;
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
const ERROR_STACK_KEY = 'error_stack';

type ErrorProperties = {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  error_message: string;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  error_stack?: string;
};

let emittedCount = 0;

const lastEmittedAtBySignature = new Map<string, number>();

/**
 * Normalizes any thrown value into a stable string representation.
 *
 * @param error - The caught value to normalize.
 * @returns The normalized error message and stack (stack is only present
 * for `Error`-like values).
 */
function normalizeError(error: unknown): {
  errorMessage: string;
  errorStack?: string;
} {
  if (error instanceof Error) {
    return { errorMessage: error.message, errorStack: error.stack };
  }
  if (error === null || error === undefined) {
    return { errorMessage: 'Unknown error' };
  }
  if (typeof error === 'string') {
    return { errorMessage: error };
  }
  if (
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  ) {
    return { errorMessage: (error as { message: string }).message };
  }
  try {
    return { errorMessage: String(error) };
  } catch {
    return { errorMessage: 'Unknown error' };
  }
}

/**
 * Reports a caught error as an analytics event.
 *
 * Emits `MetaMetricsEventName.ErrorOccured` with `category`, `severity`,
 * normalized error fields (`error_message`, `error_stack`) in properties,
 * and any `context` under the `error_context` namespace. Mirrors Mobile's
 * `trackErrorAsAnalytics` (single shared error event, regular properties).
 *
 * Fail-safe: never throws, and the returned promise always resolves.
 * Volume controls (`samplingRate`, `dedupWindowMs`, `sessionCap`) bound
 * event volume. See `TrackErrorVolumeControls`.
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
    const now = volumeControls.now ?? Date.now;
    const draw = volumeControls.draw ?? Math.random;
    const samplingRate =
      volumeControls.samplingRate ??
      DEFAULT_ERROR_TRACKING_OPTIONS.samplingRate;
    const dedupWindowMs =
      volumeControls.dedupWindowMs ??
      DEFAULT_ERROR_TRACKING_OPTIONS.dedupWindowMs;
    const sessionCap =
      volumeControls.sessionCap ?? DEFAULT_ERROR_TRACKING_OPTIONS.sessionCap;

    if (emittedCount >= sessionCap) {
      return;
    }

    if (draw() > samplingRate) {
      return;
    }

    const { errorMessage, errorStack } = normalizeError(error);

    const signature = `${MetaMetricsEventName.ErrorOccured}:${errorMessage}`;
    const lastEmittedAt = lastEmittedAtBySignature.get(signature);
    if (lastEmittedAt !== undefined && now() - lastEmittedAt < dedupWindowMs) {
      return;
    }

    const severity = options.severity ?? 'error';

    const event = createEventBuilder(MetaMetricsEventName.ErrorOccured)
      .addCategory(options.category)
      .addProperties({
        severity,
        ...({
          [ERROR_MESSAGE_KEY]: errorMessage,
          ...(errorStack === undefined
            ? {}
            : { [ERROR_STACK_KEY]: errorStack }),
        } satisfies ErrorProperties),
        ...(options.context
          ? { [ERROR_CONTEXT_NAMESPACE]: options.context }
          : {}),
      })
      .build(options.buildOptions);

    await report(event);

    emittedCount += 1;
    lastEmittedAtBySignature.set(signature, now());
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
