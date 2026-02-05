import { Messenger } from '@metamask/messenger';
import { Json } from '@metamask/utils';
import {
  dehydrate,
  DehydratedState,
  QueryClient,
  QueryKey,
  hashQueryKey,
} from '@tanstack/query-core';

type QueryServiceMessenger = Messenger<'QueryService', any, any>;

type SubscriptionCallback = (payload: Json) => void;

export class QueryService {
  client: QueryClient;

  #messenger: QueryServiceMessenger;

  #subscriptions: Map<string, Set<SubscriptionCallback>> = new Map();

  constructor(messenger: QueryServiceMessenger) {
    this.#messenger = messenger;
    this.client = new QueryClient({
      defaultOptions: {
        queries: {
          queryFn: ({ queryKey }) => this.#executeQuery(queryKey),
        },
      },
    });

    this.#registerMessageHandlers();
    this.#setupCacheListener();
  }

  #executeQuery(queryKey: QueryKey) {
    const [action, ...args] = queryKey as [string, ...any[]];
    return this.#messenger.call(action, ...args);
  }

  #registerMessageHandlers() {
    this.#messenger.registerActionHandler(
      'QueryService:subscribe',
      (queryKey: QueryKey, callback: SubscriptionCallback) => {
        return this.#handleSubscribe(queryKey, callback);
      },
    );

    this.#messenger.registerActionHandler(
      'QueryService:unsubscribe',
      (queryKey: QueryKey, callback: SubscriptionCallback) => {
        return this.#handleUnsubscribe(queryKey, callback);
      },
    );

    this.#messenger.registerActionHandler(
      'QueryService:fetch',
      async (queryKey: QueryKey) => {
        return this.#handleFetch(queryKey);
      },
    );
  }

  #setupCacheListener() {
    this.client.getQueryCache().subscribe((event) => {
      if (!event.query) {
        return;
      }

      const queryKeyHash = event.query.queryHash;

      if (this.#subscriptions.has(queryKeyHash)) {
        this.#broadcastQueryState(event.query.queryKey);
      }
    });
  }

  #handleSubscribe(
    queryKey: QueryKey,
    subscription: SubscriptionCallback,
  ): DehydratedState {
    const hash = hashQueryKey(queryKey);

    if (!this.#subscriptions.has(hash)) {
      this.#subscriptions.set(hash, new Set());
    }

    this.#subscriptions.get(hash)!.add(subscription);

    return this.#getDehydratedStateForQuery(queryKey);
  }

  #handleUnsubscribe(
    queryKey: QueryKey,
    subscription: SubscriptionCallback,
  ): void {
    const hash = hashQueryKey(queryKey);
    const subscribers = this.#subscriptions.get(hash);

    if (!subscribers) {
      return;
    }

    subscribers.delete(subscription);
    if (subscribers.size === 0) {
      this.#subscriptions.delete(hash);
    }
  }

  async #handleFetch(queryKey: QueryKey): Promise<DehydratedState> {
    await this.client.ensureQueryData({ queryKey });
    return this.#getDehydratedStateForQuery(queryKey);
  }

  #getDehydratedStateForQuery(queryKey: QueryKey): DehydratedState {
    const hash = hashQueryKey(queryKey);
    return dehydrate(this.client, {
      shouldDehydrateQuery: (query) => query.queryHash === hash,
    });
  }

  #broadcastQueryState(queryKey: QueryKey) {
    const hash = hashQueryKey(queryKey);
    const state = this.#getDehydratedStateForQuery(queryKey);

    const subscribers = this.#subscriptions.get(hash)!;
    subscribers.forEach((subscriber) =>
      subscriber({
        queryKeyHash: hash,
        state,
      } as unknown as Json),
    );
  }
}
