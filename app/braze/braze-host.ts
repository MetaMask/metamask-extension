import type { SyncBrazeUser } from '../../shared/lib/braze';
import { isBrazeWorkerResponse } from './braze-worker-messages';

type PendingRequest = {
  resolve: () => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
};

const REQUEST_TIMEOUT_MS = 30_000;

/**
 * Host the SDK in a dedicated worker. The document sends identity strings and
 * accepts acknowledgements only; it never interprets worker content as DOM.
 *
 * @param options - Options.
 * @param options.createWorker - Creates the isolated worker on first identify.
 * @returns A function that applies the desired user.
 */
export function createBrazeHost({
  createWorker = () =>
    new Worker('./braze-worker.js', { name: 'braze-worker' }),
}: { createWorker?: () => Worker } = {}): SyncBrazeUser {
  let worker: Worker | undefined;
  let nextId = 0;
  let latestProfileId: string | null = null;
  const pending = new Map<number, PendingRequest>();

  const stop = (error = new Error('Braze worker stopped')) => {
    worker?.terminate();
    worker = undefined;
    for (const request of pending.values()) {
      clearTimeout(request.timeout);
      request.reject(error);
    }
    pending.clear();
  };

  return async (profileId) => {
    latestProfileId = profileId;
    if (!worker && profileId === null) {
      return;
    }

    if (!worker) {
      const createdWorker = createWorker();
      worker = createdWorker;
      createdWorker.addEventListener(
        'message',
        (event: MessageEvent<unknown>) => {
          if (worker !== createdWorker || !isBrazeWorkerResponse(event.data)) {
            return;
          }
          const { id } = event.data;
          const request = pending.get(id);
          if (!request) {
            return;
          }
          pending.delete(id);
          clearTimeout(request.timeout);
          if (event.data.success) {
            request.resolve();
          } else {
            request.reject(new Error(event.data.error));
          }
        },
      );
      const fail = () => {
        if (worker === createdWorker) {
          stop(new Error('Braze worker failed'));
        }
      };
      createdWorker.addEventListener('error', fail);
      createdWorker.addEventListener('messageerror', fail);
    }

    nextId += 1;
    const id = nextId;
    const activeWorker = worker;
    const result = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () => stop(new Error('Braze worker sync timed out')),
        REQUEST_TIMEOUT_MS,
      );
      pending.set(id, { resolve, reject, timeout });
      try {
        activeWorker.postMessage({ id, profileId });
      } catch {
        stop(new Error('Braze worker message failed'));
      }
    });

    try {
      await result;
    } finally {
      if (
        profileId === null &&
        latestProfileId === null &&
        activeWorker === worker &&
        pending.size === 0
      ) {
        stop();
      }
    }
  };
}
