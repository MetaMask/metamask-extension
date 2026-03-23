import {
  BaseDataService,
  type DataServiceActions,
  type DataServiceEvents,
} from '@metamask-previews/base-data-service';
import type { Messenger } from '@metamask/messenger';
import type { CurrencyRateState } from '@metamask/assets-controllers';
import type { Json } from '@metamask/utils';

const serviceName = 'CurrencyRateDataService';

export type CurrencyRateDataServiceActions = DataServiceActions<
  typeof serviceName
>;
export type CurrencyRateDataServiceEvents = DataServiceEvents<
  typeof serviceName
>;

type CurrencyRateMessenger = Messenger<
  typeof serviceName,
  CurrencyRateDataServiceActions,
  CurrencyRateDataServiceEvents
>;

type SubscribeToStateChangeFn = (
  handler: (state: CurrencyRateState) => void,
) => () => void;

/**
 * Background-side currency rate data service.
 *
 * Extends `BaseDataService` from `@metamask-previews/base-data-service`
 * (core PR #8039). This is where `@tanstack/query-core` belongs for
 * controller-driven data — as internal tooling for the background process,
 * not as a UI call-site API.
 *
 * ## What TQ does here (background-internal)
 *
 * - `fetchQuery` stores controller state in a background-side `QueryClient`.
 *   This gives the background process TQ's caching, deduplication, and
 *   garbage collection for free — useful when multiple controllers or
 *   services consume the same data.
 * - `staleTime: 0` means every controller state change writes immediately
 *   (no caching of controller pushes — they are the authoritative source).
 * - `BaseDataService` auto-publishes `cacheUpdate` messenger events with
 *   the serialized cache state.
 *
 * ## What TQ does NOT do here
 *
 * - No UI-facing query options are exported. The UI subscribes to the
 *   messenger event via `useSyncExternalStore`, not via `useQuery`.
 * - `queryKey` is internal — the UI does not reference it. The messenger
 *   event name is the contract between background and UI.
 * - `staleTime`, `gcTime`, `retry` are background-internal cache policy.
 *   They do not affect or leak to the UI.
 *
 * ## When to use this pattern
 *
 * Use a `BaseDataService` when the data meets background ownership criteria:
 * - Controller dependency (used in business logic: gas estimation, validation)
 * - Process persistence (needed when UI is unmounted)
 * - Externally driven cadence (controller state changes, WebSocket events)
 *
 * For display-only, on-demand data (spot prices, activity, swap quotes),
 * skip the data service. The UI fetches directly via `useQuery` with
 * `get*QueryOptions` from `@metamask/core-backend`.
 */
export class CurrencyRateDataService extends BaseDataService<
  typeof serviceName,
  CurrencyRateMessenger
> {
  constructor(
    messenger: CurrencyRateMessenger,
    subscribeToStateChange: SubscribeToStateChangeFn,
  ) {
    super({ name: serviceName, messenger });

    subscribeToStateChange((state) => {
      this.fetchQuery({
        queryKey: [`${serviceName}:getCurrencyRates`],
        queryFn: async () => state.currencyRates as unknown as Json,
        staleTime: 0,
      }).catch(console.error);
    });
  }
}
