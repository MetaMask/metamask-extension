import { Analytics } from '@segment/analytics-node';
import { cloneDeep } from 'lodash';
import { SECOND } from '../../../../shared/constants/time';
import type { MetaMetricsUserTraits } from '../../../../shared/constants/metametrics';

const SEGMENT_WRITE_KEY = process.env.SEGMENT_WRITE_KEY ?? null;
const SEGMENT_HOST = process.env.SEGMENT_HOST || undefined;

// flushAt controls how many events are sent to segment at once. Segment will
// hold onto a queue of events until it hits this number, then sends them as
// a batch. This setting defaults to 15 in `@segment/analytics-node`, but in
// development we likely want to see events in real time for debugging, so this
// is set to 1 to disable the queueing mechanism.
const SEGMENT_FLUSH_AT =
  process.env.METAMASK_ENVIRONMENT === 'production' ? undefined : 1;

// flushInterval controls how frequently the queue is flushed to segment.
// This happens regardless of the size of the queue. The default setting is
// 10,000ms (10 seconds). This default is rather high, though thankfully using
// the background process as our event handler means we don't have to deal
// with short lived sessions that happen faster than the interval
// e.g confirmations. This is set to 5,000ms (5 seconds) arbitrarily with the
// intent of having a value less than 10 seconds.
const SEGMENT_FLUSH_INTERVAL = SECOND * 5;

/**
 * Callback invoked after an event has been flushed to Segment. The first
 * argument is an error (if any). The second argument is the Segment SDK
 * `Context` object. Consumers in this codebase only inspect the error, so the
 * type is intentionally loose.
 */
export type SegmentCallback = (err?: unknown, ctx?: unknown) => void;

/**
 * Loose payload shape used by `custom-segment-tracking` and tests. The real
 * `Analytics` SDK enforces stricter per-method types. We keep this lenient
 * because early-init traffic and the mock both forward partial payloads.
 */
export type SegmentTrackPayload = {
  userId?: string;
  anonymousId?: string;
  event?: string;
  name?: string;
  category?: string;
  messageId?: string;
  timestamp?: string | Date;
  properties?: Record<string, unknown>;
  context?: Record<string, unknown>;
  traits?: MetaMetricsUserTraits | Record<string, unknown>;
};

/**
 * Safe Segment client exposed to the rest of the extension. The real
 * implementation clones payloads before forwarding to `@segment/analytics-node`
 * because the SDK mutates payloads during normalization.
 */
export type SegmentClient = {
  track: (payload: SegmentTrackPayload, callback?: SegmentCallback) => void;
  identify: (payload: SegmentTrackPayload, callback?: SegmentCallback) => void;
  page: (payload: SegmentTrackPayload, callback?: SegmentCallback) => void;
  flush: () => Promise<void>;
};

/**
 * Constructs a `@segment/analytics-node` Analytics instance.
 *
 * @param writeKey - The Segment project write key.
 * @param host - Segment API host override (e.g. local mock).
 * @param flushAt - Queue batch size. `undefined` uses the SDK default.
 * @param flushInterval - Periodic flush interval in milliseconds.
 */
export function createSegmentClient(
  writeKey: string,
  host: string | undefined,
  flushAt: number | undefined,
  flushInterval: number,
): SegmentClient {
  const analytics = new Analytics({
    writeKey,
    host,
    flushAt,
    flushInterval,
  });

  return {
    track(payload, callback) {
      analytics.track(
        cloneDeep(payload) as Parameters<Analytics['track']>[0],
        callback,
      );
    },
    identify(payload, callback) {
      analytics.identify(
        cloneDeep(payload) as Parameters<Analytics['identify']>[0],
        callback,
      );
    },
    page(payload, callback) {
      analytics.page(
        cloneDeep(payload) as Parameters<Analytics['page']>[0],
        callback,
      );
    },
    flush() {
      return analytics.flush();
    },
  };
}

type MockQueueItem = [SegmentTrackPayload, SegmentCallback];

/**
 * Segment mock used in test environments and in builds without
 * `SEGMENT_WRITE_KEY`. Exposes an inspectable `queue` and lets tests drive
 * flushes synchronously via `flush()`.
 *
 * @param flushAt - Number of events to queue before auto-flushing. When
 * undefined, events are only flushed when `flush()` is called explicitly.
 */
export const createSegmentMock = (
  flushAt: number | undefined = SEGMENT_FLUSH_AT,
): SegmentClient & { queue: MockQueueItem[] } => {
  const noopCallback: SegmentCallback = () => undefined;

  const flushQueue = (queue: MockQueueItem[]) => {
    queue.forEach(([, callback]) => {
      callback();
    });
    queue.length = 0;
  };

  const segmentMock = {
    queue: [] as MockQueueItem[],

    track(payload: SegmentTrackPayload, callback: SegmentCallback = noopCallback) {
      segmentMock.queue.push([payload, callback]);
      if (flushAt !== undefined && segmentMock.queue.length >= flushAt) {
        flushQueue(segmentMock.queue);
      }
    },

    flush() {
      flushQueue(segmentMock.queue);
      return Promise.resolve();
    },

    page(_payload?: SegmentTrackPayload, callback?: SegmentCallback): void {
      callback?.();
    },

    identify(_payload?: SegmentTrackPayload, callback?: SegmentCallback): void {
      callback?.();
    },
  };

  return segmentMock as unknown as SegmentClient & { queue: MockQueueItem[] };
};

/**
 * Shared Segment client used across the extension background. Real builds use
 * the `@segment/analytics-node` SDK; test builds and CI without
 * `SEGMENT_WRITE_KEY` fall back to createSegmentMock.
 *
 * Payload cloning lives in this module so every direct Segment caller receives
 * the same protection from SDK payload mutation.
 */
export const segment: SegmentClient = SEGMENT_WRITE_KEY
  ? createSegmentClient(
      SEGMENT_WRITE_KEY,
      SEGMENT_HOST,
      SEGMENT_FLUSH_AT,
      SEGMENT_FLUSH_INTERVAL,
    )
  : (createSegmentMock(SEGMENT_FLUSH_AT) as unknown as SegmentClient);
