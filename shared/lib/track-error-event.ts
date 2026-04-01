import { generateDeterministicRandomNumber } from '@metamask/remote-feature-flag-controller';
import { getErrorMessage } from '@metamask/utils';
import type { Json } from '@metamask/utils';
import type {
  MetaMetricsEventOptions,
  MetaMetricsEventPayload,
} from '../constants/metametrics';

/** Values for Segment `error_severity`. */
export const TrackErrorTelemetrySeverity = {
  Fatal: 'fatal',
  Error: 'error',
  Warning: 'warning',
} as const;

export type TrackErrorTelemetrySeverityType =
  (typeof TrackErrorTelemetrySeverity)[keyof typeof TrackErrorTelemetrySeverity];

const DEFAULT_MAX_MESSAGE_LENGTH = 2000;

const DEFAULT_SESSION_OPTIONS: Required<TrackErrorEventSessionOptions> = {
  dedupeWindowMs: 60_000,
  maxEmissionsPerSignaturePerWindow: 1,
  globalSessionCap: 500,
  sampleRate: 1,
  metaMetricsId: null,
  getDeterministicRandomNumberForUser: generateDeterministicRandomNumber,
  now: () => Date.now(),
};

/** MetaMetrics `trackEvent` (UI or background). */
export type TrackErrorEventSubmitFn = (
  payload: MetaMetricsEventPayload,
  options?: MetaMetricsEventOptions,
) => void | Promise<void>;

export type TrackErrorEventInput = {
  event: string;
  category: string;
  /** Dedupe + `error_source`. */
  source: string;
  severity: TrackErrorTelemetrySeverityType;
  error: unknown;
  /** Merged as `error_context`. */
  context?: Record<string, Json>;
};

export type TrackErrorEventSessionOptions = {
  dedupeWindowMs?: number;
  maxEmissionsPerSignaturePerWindow?: number;
  /** 0 = unlimited. */
  globalSessionCap?: number;
  /** User cohort: `generateDeterministicRandomNumber(id) < sampleRate`. 1 = all, 0 = none. */
  sampleRate?: number;
  /** Cohort sampling when sampleRate is below 1; uses `metaMetricsId ?? ''`. */
  metaMetricsId?: string | null;
  /** Defaults to `generateDeterministicRandomNumber`. */
  getDeterministicRandomNumberForUser?: (metaMetricsUserId: string) => number;
  /** For tests. */
  now?: () => number;
};

export type TrackErrorEventResult =
  | { sent: true }
  | {
      sent: false;
      reason: 'sampled' | 'deduplicated' | 'session_capped';
    };

type DedupeRecord = {
  windowStart: number;
  count: number;
};

function truncateMessage(message: string, maxLength: number): string {
  if (message.length <= maxLength) {
    return message;
  }
  return `${message.slice(0, maxLength)}…`;
}

/**
 * @param input
 * @param maxMessageLength
 */
export function buildTrackErrorEventProperties(
  input: TrackErrorEventInput,
  maxMessageLength: number = DEFAULT_MAX_MESSAGE_LENGTH,
): Record<string, Json> {
  const errorMessage = truncateMessage(
    getErrorMessage(input.error),
    maxMessageLength,
  );
  const base: Record<string, Json> = {
    // eslint-disable-next-line @typescript-eslint/naming-convention -- Segment wire format
    error_source: input.source,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    error_severity: input.severity,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    error_message: errorMessage,
  };
  if (input.context && Object.keys(input.context).length > 0) {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    base.error_context = input.context as Json;
  }
  return base;
}

function buildSignature(input: TrackErrorEventInput): string {
  const message = getErrorMessage(input.error);
  return `${input.event}|${input.source}|${message}`;
}

/**
 * Per-user cohort: same id ⇒ same pass/fail for a given `sampleRate`.
 * @param metaMetricsUserId
 * @param sampleRate
 * @param getDeterministicRandomNumber
 */
export function userIncludedInErrorTelemetrySample(
  metaMetricsUserId: string | null | undefined,
  sampleRate: number,
  getDeterministicRandomNumber: (
    metaMetricsId: string,
  ) => number = generateDeterministicRandomNumber,
): boolean {
  if (sampleRate >= 1) {
    return true;
  }
  if (sampleRate <= 0) {
    return false;
  }
  const id = metaMetricsUserId ?? '';
  return getDeterministicRandomNumber(id) < sampleRate;
}

function shouldDedupe(
  dedupeMap: Map<string, DedupeRecord>,
  signature: string,
  now: number,
  windowMs: number,
  maxPerWindow: number,
): boolean {
  const rec = dedupeMap.get(signature);
  if (!rec) {
    dedupeMap.set(signature, { windowStart: now, count: 1 });
    return false;
  }
  if (now - rec.windowStart > windowMs) {
    dedupeMap.set(signature, { windowStart: now, count: 1 });
    return false;
  }
  if (rec.count >= maxPerWindow) {
    return true;
  }
  rec.count += 1;
  return false;
}

export type TrackErrorEventSession = {
  trackErrorEvent: (
    submit: TrackErrorEventSubmitFn,
    input: TrackErrorEventInput,
    submitOptions?: MetaMetricsEventOptions,
  ) => Promise<TrackErrorEventResult>;
  reset: () => void;
  getTotalEmitted: () => number;
};

/**
 * Cohort sampling, dedupe by `event|source|message`, optional session cap.
 * @param options
 */
export function createTrackErrorEventSession(
  options?: TrackErrorEventSessionOptions,
): TrackErrorEventSession {
  const opts = { ...DEFAULT_SESSION_OPTIONS, ...options };
  const dedupeMap = new Map<string, DedupeRecord>();
  let totalEmitted = 0;

  const trackErrorEvent = async (
    submit: TrackErrorEventSubmitFn,
    input: TrackErrorEventInput,
    submitOptions?: MetaMetricsEventOptions,
  ): Promise<TrackErrorEventResult> => {
    if (opts.globalSessionCap > 0 && totalEmitted >= opts.globalSessionCap) {
      return { sent: false, reason: 'session_capped' };
    }

    if (
      !userIncludedInErrorTelemetrySample(
        opts.metaMetricsId,
        opts.sampleRate,
        opts.getDeterministicRandomNumberForUser,
      )
    ) {
      return { sent: false, reason: 'sampled' };
    }

    const now = opts.now();
    const signature = buildSignature(input);
    if (
      shouldDedupe(
        dedupeMap,
        signature,
        now,
        opts.dedupeWindowMs,
        opts.maxEmissionsPerSignaturePerWindow,
      )
    ) {
      return { sent: false, reason: 'deduplicated' };
    }

    const properties = buildTrackErrorEventProperties(input);
    const payload: MetaMetricsEventPayload = {
      event: input.event,
      category: input.category,
      properties,
    };

    await Promise.resolve(submit(payload, submitOptions));
    totalEmitted += 1;
    return { sent: true };
  };

  return {
    trackErrorEvent,
    reset: () => {
      dedupeMap.clear();
      totalEmitted = 0;
    },
    getTotalEmitted: () => totalEmitted,
  };
}
