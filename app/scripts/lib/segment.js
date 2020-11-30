import Analytics from 'analytics-node'

const isDevOrTestEnvironment = Boolean(
  process.env.METAMASK_DEBUG || process.env.IN_TEST,
)
const writeKey = process.env.SEGMENT_WRITE_KEY
const legacyWriteKey = process.env.SEGMENT_LEGACY_WRITE_KEY
const host = process.env.SEGMENT_HOST

// flushAt controls how many events are sent to segment at once. Segment will
// hold onto a queue of events until it hits this number, then it sends them as
// a batch. This setting defaults to 20, but in development we likely want to
// see events in real time for debugging, so this is set to 1 to disable the
// queueing mechanism.
const flushAt =
  process.env.METAMASK_ENVIRONMENT === 'production' ? undefined : 1

// flushInterval controls how frequently the queue is flushed to segment.
// This happens regardless of the size of the queue. The default setting is
// 10,000ms (10 seconds). This default is rather high, though thankfully
// using the background process as our event handler means we don't have to
// deal with short lived sessions that happen faster than the interval
// e.g confirmations. This is set to 5,000ms (5 seconds) arbitrarily with the
// intent of having a value less than 10 seconds.
const flushInterval = 5000

/**
 * Creates a mock segment module for usage in test environments. This is used
 * when building the application in test mode to catch event calls and prevent
 * them from being sent to segment. It is also used in unit tests to mock and
 * spy on the methods to ensure proper behavior
 * @param {number} flushAt - number of events to queue before sending to segment
 * @param {number} flushInterval - ms interval to flush queue and send to segment
 * @returns {SegmentInterface}
 */
export const createSegmentMock = (flushAt, flushInterval) => {
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
        callback()
      })
      segmentMock.queue = []
    },

    /**
     * Track an event and add it to the queue. If the queue size reaches the
     * flushAt threshold, flush the queue.
     */
    track(payload, callback = () => undefined) {
      segmentMock.queue.push([payload, callback])

      if (segmentMock.queue.length >= flushAt) {
        segmentMock.flush()
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
  }
  // Mimic the flushInterval behavior with an interval
  setInterval(segmentMock.flush, flushInterval)
  return segmentMock
}

export const segment =
  !writeKey || (isDevOrTestEnvironment && !host)
    ? createSegmentMock(flushAt, flushInterval)
    : new Analytics(writeKey, {
        host,
        flushAt,
        flushInterval,
      })

export const segmentLegacy =
  !legacyWriteKey || (isDevOrTestEnvironment && !host)
    ? createSegmentMock(flushAt, flushInterval)
    : new Analytics(legacyWriteKey, {
        host,
        flushAt,
        flushInterval,
      })
