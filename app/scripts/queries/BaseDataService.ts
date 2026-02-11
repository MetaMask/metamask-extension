import {
  DehydratedState,
  FetchInfiniteQueryOptions,
  FetchQueryOptions,
  InfiniteData,
  InvalidateOptions,
  InvalidateQueryFilters,
  QueryClient,
  QueryFunctionContext,
  QueryKey,
  WithRequired,
  dehydrate,
  hashQueryKey,
} from '@tanstack/query-core';
import {
  Messenger,
  ActionConstraint,
  EventConstraint,
} from '@metamask/messenger';
import { assert, Json } from '@metamask/utils';

type SubscriptionCallback = (payload: Json) => void;

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

  #client = new QueryClient();

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
    this.#setupCacheListener();
  }

  protected async fetchQuery<
    TQueryFnData = unknown,
    TError = unknown,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    options: WithRequired<
      FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
      'queryKey' | 'queryFn'
    >,
  ): Promise<TData> {
    return this.#client.fetchQuery(options);
  }

  protected async fetchInfiniteQuery<
    TQueryFnData = unknown,
    TError = unknown,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    options: WithRequired<
      FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
      'queryKey' | 'queryFn'
    >,
    context: QueryFunctionContext<TQueryKey>,
  ): Promise<TData> {
    assert(context, 'Context must be passed when using fetchInfiniteQuery.');

    const query = this.#client
      .getQueryCache()
      .find<TQueryFnData, TError, TData>({ queryKey: options.queryKey });

    if (query && context.pageParam) {
      const result = (await query.fetch(undefined, {
        meta: {
          // TODO: Determine if this breaks when fetching backwards.
          fetchMore: {
            direction: 'forward',
            pageParam: context.pageParam,
          },
        },
      })) as InfiniteData<TData>;

      const pageIndex = result.pageParams.indexOf(context.pageParam);

      return result.pages[pageIndex];
    }

    const result = await this.#client.fetchInfiniteQuery(options);

    return result.pages[0];
  }

  protected async invalidateQueries<TPageData = unknown>(
    filters?: InvalidateQueryFilters<TPageData>,
    options?: InvalidateOptions,
  ): Promise<void> {
    return this.#client.invalidateQueries(filters, options);
  }

  #registerMessageHandlers() {
    this.#messenger.registerActionHandler(
      // @ts-expect-error TODO.
      `${this.name}:subscribe`,
      (queryKey: QueryKey, callback: SubscriptionCallback) => {
        return this.#handleSubscribe(queryKey, callback);
      },
    );

    this.#messenger.registerActionHandler(
      // @ts-expect-error TODO.
      `${this.name}:unsubscribe`,
      (queryKey: QueryKey, callback: SubscriptionCallback) => {
        return this.#handleUnsubscribe(queryKey, callback);
      },
    );

    this.#messenger.registerActionHandler(
      // @ts-expect-error TODO.
      `${this.name}:invalidateQueries`,
      this.invalidateQueries.bind(this),
    );
  }

  #setupCacheListener() {
    this.#client.getQueryCache().subscribe((event) => {
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

  #getDehydratedStateForQuery(queryKey: QueryKey): DehydratedState {
    const hash = hashQueryKey(queryKey);
    return dehydrate(this.#client, {
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
