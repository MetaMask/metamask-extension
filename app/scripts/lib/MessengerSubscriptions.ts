import { Duplex } from 'readable-stream';
import { NamespacedName } from '@metamask/messenger';
import { BaseControllerMessenger } from '../messenger-client-init/types';
import { MESSENGER_SUBSCRIPTION_NOTIFICATION } from '../../../shared/constants/messages';
import { getMessengerEventWriteTelemetrySampleRate } from '../../../shared/lib/sentry-remote-rates';
import { isStreamWritable } from './stream-utils';

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
  /** The rate this measurement was taken at, for weighting it later. */
  sampleRate: number;
};

export class MessengerSubscriptions {
  readonly #messenger: BaseControllerMessenger;

  readonly #stream: Duplex;

  readonly #subscriptions = new Map<
    NamespacedName,
    { listener: (...payload: unknown[]) => void; count: number }
  >();

  readonly #flushPendingState: () => number;

  readonly #getSampleRate: () => number;

  readonly #random: () => number;

  readonly #onWrite: (measurement: MessengerEventWrite) => void;

  constructor(
    messenger: BaseControllerMessenger,
    stream: Duplex,
    flushPendingState: () => number = () => 0,
    {
      getSampleRate = getMessengerEventWriteTelemetrySampleRate,
      random = Math.random,
      onWrite = () => undefined,
    }: {
      getSampleRate?: () => number;
      random?: () => number;
      onWrite?: (measurement: MessengerEventWrite) => void;
    } = {},
  ) {
    this.#messenger = messenger;
    this.#stream = stream;
    this.#flushPendingState = flushPendingState;
    this.#getSampleRate = getSampleRate;
    this.#random = random;
    this.#onWrite = onWrite;
  }

  /**
   * Subscribe to a given messenger event, letting emitted events be sent to the UI process as JSON-RPC notifications.
   *
   * If an existing subscription already exists, the number of active listeners for the subscription is increased.
   *
   * @param event - The name of the event.
   */
  subscribe(event: NamespacedName): void {
    const subscription = this.#subscriptions.get(event);
    if (subscription) {
      subscription.count += 1;
      return;
    }

    const listener = (...payload: unknown[]) => {
      if (!isStreamWritable(this.#stream)) {
        return;
      }

      // The state this event describes reaches the UI on the debounced `sendUpdate`
      // channel, up to 200ms after the publish and up to a second when the debounce
      // saturates, while this write happens at publish time. A subscriber that reads
      // Redux inside its handler therefore sees state older than the event it is
      // handling. Flushing first puts those patches ahead of the notification on the
      // same stream, so the order the UI observes is the order the background
      // published in.
      const patchesDrained = this.#flushPendingState();

      this.#stream.write({
        jsonrpc: '2.0',
        method: MESSENGER_SUBSCRIPTION_NOTIFICATION,
        params: [event, payload],
      });

      // Nothing else counts writes on this channel: it sits outside the
      // `sendUpdate` debounce, so neither its volume nor the drain's frequency
      // appears in any existing signal. Off until a remote rate is published.
      const sampleRate = this.#getSampleRate();
      if (sampleRate > 0 && this.#random() < sampleRate) {
        this.#onWrite({ event, patchesDrained, sampleRate });
      }
    };

    this.#subscriptions.set(event, { listener, count: 1 });

    this.#messenger.subscribe(event, listener);
  }

  /**
   * Unsubscribe from a given event, if no listeners remain, the subscription is fully removed.
   *
   * @param event - The name of the event.
   */
  unsubscribe(event: NamespacedName): void {
    const subscription = this.#subscriptions.get(event);

    if (!subscription) {
      throw new Error(`No active subscriptions found for: "${event}".`);
    }

    if (subscription.count > 1) {
      subscription.count -= 1;
      return;
    }

    this.#messenger.unsubscribe(event, subscription.listener);
    this.#subscriptions.delete(event);
  }

  /**
   * Clear all active subscriptions and unregister listeners from the messenger.
   */
  clear(): void {
    this.#subscriptions.forEach((subscription, event) => {
      this.#messenger.unsubscribe(event, subscription.listener);
    });

    this.#subscriptions.clear();
  }
}
