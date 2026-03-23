// React 17 shim — will be replaced with `react` import after React 18 upgrade.
// eslint-disable-next-line import-x/no-extraneous-dependencies
import { useSyncExternalStore } from 'use-sync-external-store/shim';
import type { Json } from '@metamask/utils';
import type { NamespacedName } from '@metamask/messenger';
import { subscribeToMessengerEvent } from '../store/background-connection';
import { useMessenger } from './useMessenger';
import type { UIMessengerEvents } from '../messengers/ui-messenger';

/**
 * Creates a store that subscribes to a background messenger event and exposes
 * the latest value via `useSyncExternalStore`-compatible API.
 *
 * This is the UI primitive for **controller-driven state** — data that the
 * background pushes to the UI via messenger events. The background may use
 * `@tanstack/query-core` internally for fetch organization and caching, but
 * that is an implementation detail. The UI subscribes to the messenger event
 * and reads the latest value — no TQ involvement on the UI side.
 *
 * The async `subscribeToMessengerEvent` is adapted to `useSyncExternalStore`'s
 * synchronous API: subscription starts lazily on first subscriber, the latest
 * value is buffered, and React is notified on each update.
 *
 * @param event - The messenger event name to subscribe to.
 * @param extract - Extracts the desired data from the raw event payload.
 *   The payload shape depends on the background service. For `BaseDataService`
 *   cacheUpdate events, the payload is `[CacheUpdatePayload]` containing
 *   DehydratedState — the extractor isolates the actual data from TQ internals.
 */
export function createControllerStore<TData>(
  event: NamespacedName,
  extract: (payload: Json) => TData | undefined,
): {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => TData | undefined;
} {
  let data: TData | undefined;
  const listeners = new Set<() => void>();
  let subscriptionStarted = false;
  let unsubscribe: (() => Promise<void>) | undefined;

  function ensureSubscription() {
    if (subscriptionStarted) {
      return;
    }
    subscriptionStarted = true;

    subscribeToMessengerEvent(event, (payload: Json) => {
      const extracted = extract(payload);
      if (extracted !== undefined) {
        data = extracted;
        for (const listener of listeners) {
          listener();
        }
      }
    })
      .then((unsub) => {
        unsubscribe = unsub;
      })
      .catch((error: unknown) => {
        console.warn(
          `createControllerStore: subscription to '${event}' failed:`,
          error,
        );
      });
  }

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      ensureSubscription();
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0 && unsubscribe) {
          unsubscribe();
          unsubscribe = undefined;
          subscriptionStarted = false;
          data = undefined;
        }
      };
    },
    getSnapshot() {
      return data;
    },
  };
}

/**
 * Subscribe to controller state pushed from the background via messenger events.
 *
 * Uses `useSyncExternalStore` — the React 18 primitive for external store
 * subscriptions. No TanStack Query involvement: no queryFn, no staleTime,
 * no cache policy. The background owns the fetch cadence; the UI renders
 * the latest value.
 *
 * Validates that the store's event is declared in the current route's
 * messenger capabilities. This enforces the UIMessenger hierarchy —
 * components can only subscribe to events their route has declared,
 * even though the underlying store subscribes directly.
 *
 * For server state where the UI needs cache policy control (staleTime,
 * refetchOnFocus, retry), use `useQuery` with `get*QueryOptions` from
 * `@metamask/core-backend` — the UI-direct fetch model.
 *
 * @param store - A store created by `createControllerStore`.
 * @param event - The messenger event name. Must match the event passed to
 *   `createControllerStore`. Used for route-capability validation.
 * @returns The latest value, or `undefined` before the first push.
 * @throws If the current route has not declared this event in its
 *   `RouteWithMessenger` events list.
 */
export function useControllerState<TData>(
  store: ReturnType<typeof createControllerStore<TData>>,
  event: NamespacedName,
): TData | undefined {
  // Validate route-level access. Throws if the event isn't declared
  // in the route's RouteWithMessenger capabilities.
  useMessenger({ events: [event as UIMessengerEvents['type']] });

  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}
