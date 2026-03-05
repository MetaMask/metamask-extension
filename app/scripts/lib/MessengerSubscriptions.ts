import { Duplex } from 'readable-stream';
import { NamespacedName } from '@metamask/messenger';
import { BaseControllerMessenger } from '../controller-init/types';

type Listener = () => void;

export class MessengerSubscriptions {
  #messenger: BaseControllerMessenger;

  #stream: Duplex;

  #subscriptions = new Map<NamespacedName, Listener>();

  constructor(messenger: BaseControllerMessenger, stream: Duplex) {
    this.#messenger = messenger;
    this.#stream = stream;
  }

  subscribe(event: NamespacedName) {
    const listener = (...payload: unknown[]) => {
      this.#stream.write({
        jsonrpc: '2.0',
        method: event,
        params: [payload],
      });
    };
    this.#subscriptions.set(event, listener);

    this.#messenger.subscribe(event, listener);
  }

  unsubscribe(event: NamespacedName) {
    const listener = this.#subscriptions.get(event);

    if (!listener) {
      return;
    }

    this.#messenger.unsubscribe(event, listener);
    this.#subscriptions.delete(event);
  }
}
