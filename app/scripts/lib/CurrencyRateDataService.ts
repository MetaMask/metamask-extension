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
 * Background-side currency rate data service (controller-driven).
 *
 * Extends `BaseDataService` from `@metamask-previews/base-data-service`
 * (core PR #8039). Subscribes to `CurrencyRateController:stateChange` —
 * when the controller updates, `fetchQuery` stores the new state in the
 * background `QueryClient`. `BaseDataService` auto-publishes `cacheUpdate`
 * events, which the UI subscribes to via `useBackgroundQuerySync` and
 * hydrates into the UI `QueryClient`.
 *
 * This demonstrates the controller-dependency ownership criterion:
 *   - CurrencyRateController is the authoritative source (gas estimation, display)
 *   - Background pushes on its own cadence; UI never fetches independently
 *   - `hydrate()` populates the UI cache; `isFetching` stays false on update
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
