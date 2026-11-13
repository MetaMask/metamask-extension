import { trace, TraceName, TraceOperation } from '../trace';

/**
 * A measurement of one write on this channel. Emitted rather than reported, so
 * the class stays free of a telemetry dependency and the caller decides what a
 * measurement becomes — the same split `PersistenceManager` uses for its
 * `splitStateWrite` event.
 */
export type MessengerEventWrite = {
  event: string;
  /** Patches the ordering drain wrote ahead of this notification. */
  patchesDrained: number;
  /** UI subscribers this connection holds for the event. */
  subscriberCount: number;
  /**
   * Serialized size of the payload. Measured only on a sampled write: the
   * publisher of the highest-volume candidate event computes its own state size
   * once per session for exactly this reason.
   *
   * Absent when the payload does not survive `JSON.stringify`.
   */
  payloadBytes?: number;
  /**
   * Milliseconds since the previous write on this channel. Absent for the first
   * write of a connection. A rate alone cannot separate a steady stream from a
   * burst inside one state update, which is the shape that would hurt.
   */
  msSinceLastWrite?: number;
  /** The rate this measurement was taken at, for weighting it later. */
  sampleRate: number;
};

/**
 * Sentry transaction name for sampled writes on the messenger event channel.
 * Must match the early-return in `createTracesSampler`.
 */
export const MESSENGER_EVENT_WRITE_TRACE_NAME = TraceName.MessengerEventWrite;

/**
 * Reports one sampled write on the messenger event channel.
 *
 * This channel sits outside the `sendUpdate` debounce, so its volume appears in
 * no existing signal: the event name says which publishers dominate it, the
 * drained-patch count says how often a subscriber would have read state older
 * than the event that woke it, and the payload size and inter-write gap are what
 * would show a per-asset publisher before it is subscribed rather than after.
 *
 * Carries no payload values, only their serialized size.
 *
 * @param measurement - Value-free measurements for one write.
 */
export function trackMessengerEventWrite(
  measurement: MessengerEventWrite,
): void {
  const data: Record<string, number | string | boolean> = {
    'messenger.write.event': measurement.event,
    'messenger.write.patches_drained': measurement.patchesDrained,
    'messenger.write.stale_window_open': measurement.patchesDrained > 0,
    'messenger.write.subscriber_count': measurement.subscriberCount,
    'messenger.write.sample_rate': measurement.sampleRate,
  };

  if (measurement.payloadBytes !== undefined) {
    data['messenger.write.payload_bytes'] = measurement.payloadBytes;
  }

  if (measurement.msSinceLastWrite !== undefined) {
    data['messenger.write.ms_since_last_write'] = measurement.msSinceLastWrite;
  }

  trace(
    {
      data,
      name: TraceName.MessengerEventWrite,
      op: TraceOperation.MessengerEventWrite,
    },
    () => undefined,
  );
}
