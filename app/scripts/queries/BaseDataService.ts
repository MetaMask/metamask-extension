import {
  Messenger,
  ActionConstraint,
  EventConstraint,
} from '@metamask/messenger';
import { assert, Duration, inMilliseconds, Json } from '@metamask/utils';
import { isCacheExpired, withRetry } from './utils';

export type SubscriptionCallback = (payload: Json) => void;

export type Key = [string, ...Json[]];

export type FetchFunctionParameters = {
  pageParam?: Json;
};

export type FetchFunction<ResultType extends Json> = () => Promise<ResultType>;

export type FetchFunctionPaged<ResultType extends Json> = (
  params: FetchFunctionParameters,
) => Promise<ResultType>;

export type FetchOptions<ResultType extends Json> = {
  key: Key;
  fn: FetchFunction<ResultType>;
  cacheTime?: number;
  staleTime?: number;
  retries?: number;
};

export type FetchPagedOptions<ResultType extends Json> =
  FetchOptions<ResultType> & {
    fn: FetchFunctionPaged<ResultType>;
    pageParam?: Json;
  };

export type CacheEntry = {
  status: 'pending' | 'error' | 'success';
  data?: Json;
  error?: unknown;
  promise?: Promise<Json>;
  dataUpdated?: number;
};

export type PassableCacheEntry = Omit<CacheEntry, 'promise'>;

function hashKey(key: Key) {
  return JSON.stringify(key);
}

export class BaseDataService<
  ServiceName extends string,
  ServiceMessenger extends Messenger<
    ServiceName,
    ActionConstraint,
    EventConstraint,
    // Use `any` to allow any parent to be set. `any` is harmless in a type constraint anyway,
    // it's the one totally safe place to use it.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any
  >,
> {
  name: string;

  #messenger: ServiceMessenger;

  #cache: Map<Key, CacheEntry> = new Map();

  #subscriptions: Map<string, Set<SubscriptionCallback>> = new Map();

  constructor({
    name,
    messenger,
  }: {
    name: ServiceName;
    messenger: ServiceMessenger;
  }) {
    this.name = name;
    this.#messenger = messenger;

    this.#registerMessageHandlers();
  }

  protected async fetch<ResultType extends Json>(
    options: FetchOptions<ResultType>,
  ): Promise<ResultType> {
    const { key, cacheTime = inMilliseconds(1, Duration.Minute) } = options;

    const cached = this.#getCached<ResultType>(key, cacheTime);

    if (cached) {
      return cached;
    }

    const promise = this.#fetch(options.fn, options);
    this.#updateCache(key, { status: 'pending', promise });

    return promise;
  }

  protected async fetchPaged<ResultType extends Json>(
    options: FetchPagedOptions<ResultType>,
  ): Promise<ResultType> {
    const {
      key,
      cacheTime = inMilliseconds(1, Duration.Minute),
      pageParam,
    } = options;

    const cached = this.#getCached<ResultType>(key, cacheTime);

    if (cached) {
      return cached;
    }

    const promise = this.#fetch(() => options.fn({ pageParam }), options);
    this.#updateCache(key, { status: 'pending', promise });

    return promise;
  }

  #getCached<ResultType extends Json>(
    key: Key,
    cacheTime: number,
  ): Promise<ResultType> | ResultType | null {
    const cached = this.#cache.get(key);

    if (!cached) {
      return null;
    }

    // Pending status is used for deduping requests
    if (cached.status === 'pending') {
      return cached.promise as Promise<ResultType>;
    }

    if (cached.status !== 'success') {
      return null;
    }

    // @ts-expect-error Missing type narrowing.
    if (isCacheExpired(cached, cacheTime)) {
      return null;
    }

    // TODO: Check stale time

    return cached.data as ResultType;
  }

  async #fetch<ResultType extends Json>(
    fn: () => Promise<ResultType>,
    { key, retries = 1 }: FetchOptions<ResultType>,
  ): Promise<ResultType> {
    try {
      const data = (await withRetry(fn, retries)) as ResultType;

      this.#updateCache(key, {
        status: 'success',
        data,
        dataUpdated: Date.now(),
      });

      return data;
    } catch (error) {
      this.#updateCache(key, {
        status: 'error',
        error,
        dataUpdated: Date.now(),
      });
      throw error;
    }
  }

  #updateCache(key: Key, entry: CacheEntry) {
    this.#cache.set(key, entry);

    // TODO: Slow?
    const hash = hashKey(key);
    if (this.#subscriptions.has(hash)) {
      this.#broadcastCache(key);
    }
  }

  protected async invalidate(keys: Key[]): Promise<void> {
    // return this.#client.invalidateQueries(filters, options);
  }

  #registerMessageHandlers() {
    this.#messenger.registerActionHandler(
      // @ts-expect-error TODO.
      `${this.name}:subscribe`,
      (key: Key, callback: SubscriptionCallback) => {
        return this.#handleSubscribe(key, callback);
      },
    );

    this.#messenger.registerActionHandler(
      // @ts-expect-error TODO.
      `${this.name}:unsubscribe`,
      (key: Key, callback: SubscriptionCallback) => {
        return this.#handleUnsubscribe(key, callback);
      },
    );

    this.#messenger.registerActionHandler(
      // @ts-expect-error TODO.
      `${this.name}:invalidate`,
      this.invalidate.bind(this),
    );
  }

  #handleSubscribe(
    key: Key,
    subscription: SubscriptionCallback,
  ): PassableCacheEntry | null {
    const hash = hashKey(key);

    if (!this.#subscriptions.has(hash)) {
      this.#subscriptions.set(hash, new Set());
    }

    this.#subscriptions.get(hash)!.add(subscription);

    return this.#cache.get(key) ?? null;
  }

  #handleUnsubscribe(key: Key, subscription: SubscriptionCallback): void {
    const hash = hashKey(key);
    const subscribers = this.#subscriptions.get(hash);

    if (!subscribers) {
      return;
    }

    subscribers.delete(subscription);
    if (subscribers.size === 0) {
      this.#subscriptions.delete(hash);
    }
  }

  #broadcastCache(key: Key) {
    const hash = hashKey(key);
    const state = this.#cache.get(key) ?? null;

    const subscribers = this.#subscriptions.get(hash)!;
    subscribers.forEach((subscriber) =>
      subscriber({
        hash,
        state,
      } as unknown as Json),
    );
  }
}
