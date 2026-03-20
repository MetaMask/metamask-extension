import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { hydrate } from '@tanstack/query-core';
import type { CacheUpdatePayload } from '@metamask-previews/base-data-service';
import { subscribeToMessengerEvent } from '../store/background-connection';
import { UI_SYNC_EVENTS } from '../messengers/ui-messenger';

/**
 * Derive the sync event list from the aggregated messenger config.
 *
 * Post-BaseDataService: events are `cacheUpdate` from `DataServiceEvents`.
 * `BaseDataService` auto-publishes these when the background `QueryClient`
 * cache changes — no manual publish needed in the data service.
 */
const BACKGROUND_SYNC_EVENTS = UI_SYNC_EVENTS;

/**
 * Subscribe to `BaseDataService` cache update events and hydrate the UI
 * `QueryClient`.
 *
 * `BaseDataService` (core PR #8039) publishes `cacheUpdate` events with
 * `DehydratedState` payloads whenever the background `QueryClient` cache
 * changes. This hook subscribes to those events and calls `hydrate()` to
 * merge the dehydrated state into the UI `QueryClient`.
 *
 * This is the Option B equivalent of `createUIQueryClient` from Option A —
 * background-owned queries sync via `hydrate()`, while UI-direct queries
 * retain their own `queryFn` and call-site `staleTime`.
 */
export function useBackgroundQuerySync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let unmounted = false;
    const cleanups: ((() => Promise<void>) | undefined)[] = [];

    const subscriptions = BACKGROUND_SYNC_EVENTS.map((event) =>
      // @ts-expect-error CacheUpdatePayload tuple not assignable to Json constraint
      subscribeToMessengerEvent<[CacheUpdatePayload]>(event, ([payload]) => {
        if (!unmounted && payload.state) {
          try {
            hydrate(queryClient, payload.state);
          } catch (error) {
            console.error('Failed to hydrate UI QueryClient:', error);
          }
        }
      }),
    );

    Promise.all(subscriptions)
      .then((unsubs) => {
        if (unmounted) {
          unsubs.forEach((unsub) => unsub?.());
        } else {
          cleanups.push(...unsubs);
        }
      })
      .catch((error) => {
        // Background connection may not support messengerSubscribe yet
        // (e.g., during initial load or in test environments).
        console.warn('useBackgroundQuerySync: subscription failed:', error);
      });

    return () => {
      unmounted = true;
      cleanups.forEach((cleanup) => cleanup?.());
    };
  }, [queryClient]);
}
