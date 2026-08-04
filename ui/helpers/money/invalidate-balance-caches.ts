import {
  MoneyAccountApiDataServiceQueryKeys,
  MoneyAccountBalanceServiceQueryKeys,
} from '../../../shared/lib/money/query-keys';
import { queryClient } from '../../contexts/query-client';
import { submitRequestToBackground } from '../../store/background-connection';

/**
 * Force-refresh Money Account balance through the facade.
 *
 * `fetchBalanceWithFallback` has no service-local cache entry. It reads either
 * `getMoneyAccountBalance` (balance-service QueryClient) or
 * `MoneyAccountApiDataService:fetchPositions` (API-service QueryClient). UI
 * invalidation of the facade key only clears the UI cache and forwards the
 * same filter to `MoneyAccountBalanceService:invalidateQueries`, which does
 * not match either source key — so source caches would otherwise keep serving
 * stale values on the subsequent facade refetch.
 *
 * This helper busts both source caches through the background connection, then
 * invalidates the UI facade query so observers refetch.
 *
 * @param address - Money account address (same casing as used by the UI query).
 */
export async function invalidateMoneyAccountBalanceCaches(
  address: string,
): Promise<void> {
  await Promise.all([
    submitRequestToBackground<void>('messengerCall', [
      'MoneyAccountBalanceService:invalidateQueries',
      [
        {
          queryKey: [
            MoneyAccountBalanceServiceQueryKeys.GET_MONEY_ACCOUNT_BALANCE,
            address,
          ],
        },
      ],
    ]),
    submitRequestToBackground<void>('messengerCall', [
      'MoneyAccountApiDataService:invalidateQueries',
      [
        {
          queryKey: [
            MoneyAccountApiDataServiceQueryKeys.FETCH_POSITIONS,
            // Package lowercases the address when building the positions query key.
            address.toLowerCase(),
          ],
        },
      ],
    ]),
  ]);

  await queryClient.invalidateQueries({
    queryKey: [
      MoneyAccountBalanceServiceQueryKeys.FETCH_BALANCE_WITH_FALLBACK,
      address,
    ],
    refetchType: 'all',
  });
}
