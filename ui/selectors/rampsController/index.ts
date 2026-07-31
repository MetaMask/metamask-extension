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

export const selectProviderAutoSelected = (state: RampsState): boolean =>
  state.metamask.providerAutoSelected ?? false;
