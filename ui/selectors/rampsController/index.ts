import { createSelector } from 'reselect';
import {
  type UserRegion,
  type Provider,
  type Country,
  type PaymentMethod,
  type RampsToken,
  type TokensResponse,
  type ResourceState,
  type RampsOrder,
  type RampsControllerState,
} from '@metamask/ramps-controller';
import { getSelectedInternalAccount } from '../../../shared/lib/selectors/accounts';
import { mapRampsOrderSafely } from '../../hooks/ramps/utils/mapRampsOrderSafely';

export type RampsActivityItem = NonNullable<
  ReturnType<typeof mapRampsOrderSafely>
>;

/**
 * RampsController state is flattened into state.metamask by
 * ComposableObservableStore.getFlatState(). All properties live directly
 * on state.metamask, NOT nested under state.metamask.RampsController.
 */
export type RampsState = {
  metamask: Partial<RampsControllerState>;
};

const createDefaultResourceState = <TData, TSelected = null>(
  data: TData,
  selected: TSelected = null as TSelected,
): ResourceState<TData, TSelected> => ({
  data,
  selected,
  isLoading: false,
  error: null,
});

const EMPTY_ORDERS: RampsOrder[] = [];
const EMPTY_SETTLEMENT_HASHES: Set<string> = new Set();
const DEFAULT_COUNTRIES = createDefaultResourceState<Country[]>([]);
const DEFAULT_PROVIDERS = createDefaultResourceState<
  Provider[],
  Provider | null
>([], null);
const DEFAULT_TOKENS = createDefaultResourceState<
  TokensResponse | null,
  RampsToken | null
>(null, null);
const DEFAULT_PAYMENT_METHODS = createDefaultResourceState<
  PaymentMethod[],
  PaymentMethod | null
>([], null);

export const selectRampsControllerState = createSelector(
  (state: RampsState) => state.metamask,
  (metamask): Partial<RampsControllerState> => ({
    userRegion: metamask.userRegion ?? null,
    countries: metamask.countries ?? DEFAULT_COUNTRIES,
    providers: metamask.providers ?? DEFAULT_PROVIDERS,
    tokens: metamask.tokens ?? DEFAULT_TOKENS,
    paymentMethods: metamask.paymentMethods ?? DEFAULT_PAYMENT_METHODS,
    orders: metamask.orders ?? EMPTY_ORDERS,
    providerAutoSelected: metamask.providerAutoSelected ?? false,
  }),
);

export const selectUserRegion = (state: RampsState): UserRegion | null =>
  state.metamask.userRegion ?? null;

export const selectCountries = (state: RampsState): ResourceState<Country[]> =>
  state.metamask.countries ?? DEFAULT_COUNTRIES;

export const selectProviders = (
  state: RampsState,
): ResourceState<Provider[], Provider | null> =>
  state.metamask.providers ?? DEFAULT_PROVIDERS;

export const selectTokens = (
  state: RampsState,
): ResourceState<TokensResponse | null, RampsToken | null> =>
  state.metamask.tokens ?? DEFAULT_TOKENS;

export const selectPaymentMethods = (
  state: RampsState,
): ResourceState<PaymentMethod[], PaymentMethod | null> =>
  state.metamask.paymentMethods ?? DEFAULT_PAYMENT_METHODS;

export const selectRampsOrders = (state: RampsState): RampsOrder[] =>
  state.metamask.orders ?? EMPTY_ORDERS;

export const selectRampsOrdersForSelectedAccount = createSelector(
  [selectRampsOrders, getSelectedInternalAccount],
  (orders, selectedAccount): RampsOrder[] => {
    const selectedAddress = selectedAccount?.address?.toLowerCase();
    if (!selectedAddress) {
      return [];
    }

    return orders.filter((order) => {
      const walletAddress = order.walletAddress?.toLowerCase();
      return walletAddress === selectedAddress;
    });
  },
);

/**
 * Activity items for the selected account's ramp orders.
 *
 * Orders the shared mapper filters out (hidden statuses, `excludeFromPurchases`,
 * unresolvable chain data) are dropped, so this is exactly the set of ramp rows
 * Activity can render.
 *
 * @param state - Extension UI state with flattened RampsController fields.
 * @returns The mapped ramp activity items.
 */
export const selectRampsActivityItems = createSelector(
  [selectRampsOrdersForSelectedAccount],
  (orders): RampsActivityItem[] =>
    orders
      .map((order) => mapRampsOrderSafely(order))
      .filter((item) => item !== undefined),
);

/**
 * Settlement hashes for the selected account's ramp Activity rows.
 *
 * Used to hide the generic local/API Activity row that shares a ramp order's
 * on-chain settlement hash. Derived from the mapped items so an order that
 * never surfaces as a ramp row cannot hide its generic transaction, and so
 * placeholder provider hashes are excluded by the shared mapper.
 *
 * @param state - Extension UI state with flattened RampsController fields.
 * @returns Lowercased settlement hashes.
 */
export const selectRampsSettlementHashes = createSelector(
  [selectRampsActivityItems],
  (items): Set<string> => {
    const hashes = new Set<string>();

    for (const item of items) {
      const hash = item.hash?.trim().toLowerCase();
      if (hash) {
        hashes.add(hash);
      }
    }

    return hashes.size > 0 ? hashes : EMPTY_SETTLEMENT_HASHES;
  },
);

export const selectProviderAutoSelected = (state: RampsState): boolean =>
  state.metamask.providerAutoSelected ?? false;
