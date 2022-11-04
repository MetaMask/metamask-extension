import { SECOND } from '../../../../shared/constants/time';
import Analytics from './analytics';

const SEGMENT_WRITE_KEY = process.env.SEGMENT_WRITE_KEY ?? null;
const SEGMENT_HOST = process.env.SEGMENT_HOST ?? null;

// flushAt controls how many events are sent to segment at once. Segment will
// hold onto a queue of events until it hits this number, then it sends them as
// a batch. This setting defaults to 20, but in development we likely want to
// see events in real time for debugging, so this is set to 1 to disable the
// queueing mechanism.
const SEGMENT_FLUSH_AT =
  process.env.METAMASK_ENVIRONMENT === 'production' ? undefined : 1;

// flushInterval controls how frequently the queue is flushed to segment.
// This happens regardless of the size of the queue. The default setting is
// 10,000ms (10 seconds). This default is rather high, though thankfully
// using the background process as our event handler means we don't have to
// deal with short lived sessions that happen faster than the interval
// e.g confirmations. This is set to 5,000ms (5 seconds) arbitrarily with the
// intent of having a value less than 10 seconds.
const SEGMENT_FLUSH_INTERVAL = SECOND * 5;

/**
 * Creates a mock segment module for usage in test environments. This is used
 * when building the application in test mode to catch event calls and prevent
 * them from being sent to segment. It is also used in unit tests to mock and
 * spy on the methods to ensure proper behavior
 *
 * @param {number} flushAt - number of events to queue before sending to segment
 * @returns {SegmentInterface}
 */
export const createSegmentMock = (flushAt = SEGMENT_FLUSH_AT) => {
  const segmentMock = {
    // Internal queue to keep track of events and properly mimic segment's
    // queueing behavior.
    queue: [],

    /**
     * Used to immediately send all queued events and reset the queue to zero.
     * For our purposes this simply triggers the callback method registered with
     * the event.
     */
    flush() {
      segmentMock.queue.forEach(([_, callback]) => {
        callback();
      });
      segmentMock.queue = [];
    },

    /**
     * Track an event and add it to the queue. If the queue size reaches the
     * flushAt threshold, flush the queue.
     *
     * @param payload
     * @param callback
     */
    track(payload, callback = () => undefined) {
      segmentMock.queue.push([payload, callback]);

      if (segmentMock.queue.length >= flushAt) {
        segmentMock.flush();
      }
    },

    /**
     * A true NOOP, these methods are either not used or do not await callback
     * and therefore require no functionality.
     */
    page() {
      // noop
    },
    identify() {
      // noop
    },
  };

  return segmentMock;
};

export const segment = SEGMENT_WRITE_KEY
  ? new Analytics(SEGMENT_WRITE_KEY, {
      host: SEGMENT_HOST,
      flushAt: SEGMENT_FLUSH_AT,
      flushInterval: SEGMENT_FLUSH_INTERVAL,
    })
  : createSegmentMock(SEGMENT_FLUSH_AT, SEGMENT_FLUSH_INTERVAL);
