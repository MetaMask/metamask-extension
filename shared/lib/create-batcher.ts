type CreateBatcherOptions<TItem, TResult> = {
  fetcher: (items: TItem[]) => Promise<TResult[]>;
  resolver: (results: TResult[], item: TItem) => TResult | null | undefined;
  getKey?: (item: TItem) => string;
  scheduler?: (flush: () => void) => void;
};

type Batcher<TItem, TResult> = {
  fetch: (item: TItem) => Promise<TResult | null | undefined>;
};

const microtaskScheduler = (flush: () => void) => {
  queueMicrotask(flush);
};

export function create<TItem, TResult>({
  fetcher,
  resolver,
  getKey = String,
  scheduler = microtaskScheduler,
}: CreateBatcherOptions<TItem, TResult>): Batcher<TItem, TResult> {
  type PendingFetch = {
    item: TItem;
    resolve: (
      result:
        | TResult
        | null
        | undefined
        | PromiseLike<TResult | null | undefined>,
    ) => void;
    reject: (error: unknown) => void;
  };

  const pendingFetches: PendingFetch[] = [];
  let isFlushScheduled = false;

  const flush = async () => {
    isFlushScheduled = false;
    const batch = pendingFetches.splice(0, pendingFetches.length);

    if (batch.length === 0) {
      return;
    }

    const uniqueItems = [
      ...new Map(
        batch.map((entry) => [getKey(entry.item), entry.item]),
      ).values(),
    ];

    try {
      const results = await fetcher(uniqueItems);

      batch.forEach((entry) => {
        entry.resolve(resolver(results, entry.item));
      });
    } catch (error) {
      batch.forEach((entry) => entry.reject(error));
    }
  };

  return {
    fetch: (item) =>
      new Promise<TResult | null | undefined>((resolve, reject) => {
        pendingFetches.push({ item, resolve, reject });

        if (isFlushScheduled) {
          return;
        }

        isFlushScheduled = true;
        scheduler(flush);
      }),
  };
}
