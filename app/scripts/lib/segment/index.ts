import { Analytics } from '@segment/analytics-node';
import { cloneDeep } from 'lodash';
import { SECOND } from '../../../../shared/constants/time';
import type { MetaMetricsUserTraits } from '../../../../shared/constants/metametrics';

const SEGMENT_WRITE_KEY = process.env.SEGMENT_WRITE_KEY ?? null;
const SEGMENT_HOST = process.env.SEGMENT_HOST || undefined;

// flushAt controls how many events are sent to segment at once. Segment will
// hold onto a queue of events until it hits this number, then it sends them as
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
 * `Context` object; consumers in this codebase only inspect the error, so the
 * type is intentionally loose.
 */
export type SegmentCallback = (err?: unknown, ctx?: unknown) => void;

/**
 * Payload accepted by the segment client. Extension call sites pass partial
 * payloads (e.g. `#identify` only sets `userId` + `traits`, early-init events
 * omit `locale`/`chain_id`), so all fields are optional and `properties` /
 * `context` / `traits` are typed loosely; validation is left to Segment.
 *
 * The `timestamp` field accepts both `string` (as persisted in
 * `MetaMetricsController.state.segmentApiCalls` across service-worker
 * restarts) and `Date` (as produced when the event is first enqueued).
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
 * Thin interface exposed to the rest of the extension. This is the only
 * surface `MetaMetricsController` and `early-segment-tracking` interact with,
 * so swapping the underlying implementation (real SDK vs. mock) is confined
 * to this module.
 */
export type SegmentClient = {
  track: (payload: SegmentTrackPayload, callback?: SegmentCallback) => void;
  identify: (payload: SegmentTrackPayload, callback?: SegmentCallback) => void;
  page: (payload: SegmentTrackPayload, callback?: SegmentCallback) => void;
  flush: () => Promise<void>;
};

/**
 * Create a segment client backed by the official `@segment/analytics-node`
 * SDK. The SDK uses `fetch` under the hood, so it is compatible with the MV3
 * service worker runtime (unlike the legacy `analytics-node` which relied on
 * `axios`/`XMLHttpRequest`).
 *
 * @param writeKey - The Segment project write key.
 * @param host - Segment API host override (e.g. local mock).
 * @param flushAt - Queue batch size; `undefined` uses the SDK default.
 * @param flushInterval - Periodic flush interval in milliseconds.
 * @returns A Segment client that forwards to the official Segment SDK.
 */
function createSegmentClient(
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

  /**
   * `MetaMetricsController.#submitSegmentAPICall` writes the same payload into
   * `state.segmentApiCalls` (via `this.update`) before calling this client.
   * BaseController uses immer with auto-freeze, so nested fields like
   * `context`, `properties`, and `traits` that are shared by reference become
   * non-extensible / frozen in place.
   *
   * `@segment/analytics-node`'s Segment.io plugin runs `normalizeEvent`, which
   * uses `dset` to add `context.library` on the existing `context` object. That
   * throws `TypeError: Cannot add property library, object is not extensible`.
   * The error can be swallowed inside the SDK's plugin pipeline, so callbacks
   * may still report success but no HTTP request is sent.
   *
   * `cloneDeep` on each SDK call gives a plain mutable copy so normalization
   * can run.
   */
  return {
    track(payload, callback) {
      analytics.track(
        cloneDeep(payload) as Parameters<typeof analytics.track>[0],
        callback,
      );
    },
    identify(payload, callback) {
      analytics.identify(
        cloneDeep(payload) as Parameters<typeof analytics.identify>[0],
        callback,
      );
    },
    page(payload, callback) {
      analytics.page(
        cloneDeep(payload) as Parameters<typeof analytics.page>[0],
        callback,
      );
    },
    flush() {
      return analytics.flush();
    },
  };
}

/**
 * Mock segment client queue item: the payload and its completion callback.
 */
type MockQueueItem = [SegmentTrackPayload, SegmentCallback];

/**
 * Segment mock used in test environments. It preserves the shape of the real
 * client, exposes an internal `queue`, and lets tests drive flushes
 * synchronously via `flush()`. Used both by unit tests and by the app when
 * `SEGMENT_WRITE_KEY` is not provided (e.g. test builds).
 *
 * @param flushAt - Number of events to queue before auto-flushing. When
 * undefined, events are only flushed when `flush()` is called explicitly.
 * @returns A Segment client with an inspectable queue.
 */
export const createSegmentMock = (
  flushAt: number | undefined = SEGMENT_FLUSH_AT,
): SegmentClient & { queue: MockQueueItem[] } => {
  const segmentMock: SegmentClient & { queue: MockQueueItem[] } = {
    queue: [],

    flush() {
      segmentMock.queue.forEach(([, callback]) => {
        callback();
      });
      segmentMock.queue = [];
      return Promise.resolve();
    },

    track(payload, callback = () => undefined) {
      segmentMock.queue.push([payload, callback]);

      if (flushAt !== undefined && segmentMock.queue.length >= flushAt) {
        segmentMock.flush();
      }
    },

    // These methods are either unused in tests or do not await their callback,
    // so a NOOP implementation is sufficient. Tests still `spyOn` them to
    // assert invocation.
    page() {
      // noop
    },
    identify() {
      // noop
    },
  };

  return segmentMock;
};

export const segment: SegmentClient = SEGMENT_WRITE_KEY
  ? createSegmentClient(
      SEGMENT_WRITE_KEY,
      SEGMENT_HOST,
      SEGMENT_FLUSH_AT,
      SEGMENT_FLUSH_INTERVAL,
    )
  : createSegmentMock(SEGMENT_FLUSH_AT);
