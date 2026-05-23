import { Duplex } from 'readable-stream';
import { NamespacedName } from '@metamask/messenger';
import { BaseControllerMessenger } from '../messenger-client-init/types';
import { MESSENGER_SUBSCRIPTION_NOTIFICATION } from '../../../shared/constants/messages';
import { isStreamWritable } from './stream-utils';

export class MessengerSubscriptions {
  readonly #messenger: BaseControllerMessenger;

  readonly #stream: Duplex;

  readonly #subscriptions = new Map<
    NamespacedName,
    { listener: (...payload: unknown[]) => void; count: number }
  >();

  constructor(messenger: BaseControllerMessenger, stream: Duplex) {
    this.#messenger = messenger;
    this.#stream = stream;
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

      this.#stream.write({
        jsonrpc: '2.0',
        method: MESSENGER_SUBSCRIPTION_NOTIFICATION,
        params: [event, payload],
      });
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
