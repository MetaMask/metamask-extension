import { Duplex } from 'readable-stream';
import { NamespacedName } from '@metamask/messenger';
import { BaseControllerMessenger } from '../controller-init/types';

type Listener = (...payload: unknown[]) => void;

export class MessengerSubscriptions {
  #messenger: BaseControllerMessenger;

  #stream: Duplex;

  #subscriptions = new Map<NamespacedName, { listener: Listener, count: number }>();

  constructor(messenger: BaseControllerMessenger, stream: Duplex) {
    this.#messenger = messenger;
    this.#stream = stream;
  }

  subscribe(event: NamespacedName) {
    const subscription = this.#subscriptions.get(event);
    if (subscription) {
      subscription.count += 1;
      return;
    }

    const listener = (...payload: unknown[]) => {
      this.#stream.write({
        jsonrpc: '2.0',
        method: event,
        params: [payload],
      });
    };
    this.#subscriptions.set(event, { listener, count: 1 });

    this.#messenger.subscribe(event, listener);
  }

  unsubscribe(event: NamespacedName) {
    const subscription = this.#subscriptions.get(event);

    if (!subscription) {
      return;
    }

    if (subscription.count > 2) {
      subscription.count -= 1;
      return;
    }

    this.#messenger.unsubscribe(event, subscription.listener);
    this.#subscriptions.delete(event);
  }
}
