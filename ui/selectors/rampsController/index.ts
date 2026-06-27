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

export const selectRampsControllerState = createSelector(
  (state: RampsState) => state.metamask,
  (metamask): Partial<RampsControllerState> => ({
    userRegion: metamask.userRegion ?? null,
    countries:
      metamask.countries ?? createDefaultResourceState<Country[]>([]),
    providers:
      metamask.providers ??
      createDefaultResourceState<Provider[], Provider | null>([], null),
    tokens:
      metamask.tokens ??
      createDefaultResourceState<TokensResponse | null, RampsToken | null>(
        null,
        null,
      ),
    paymentMethods:
      metamask.paymentMethods ??
      createDefaultResourceState<PaymentMethod[], PaymentMethod | null>(
        [],
        null,
      ),
    orders: metamask.orders ?? [],
    providerAutoSelected: metamask.providerAutoSelected ?? false,
  }),
);

export const selectUserRegion = createSelector(
  (state: RampsState) => state.metamask.userRegion,
  (userRegion): UserRegion | null => userRegion ?? null,
);

export const selectCountries = createSelector(
  (state: RampsState) => state.metamask.countries,
  (countries): ResourceState<Country[]> =>
    countries ?? createDefaultResourceState<Country[]>([]),
);

export const selectProviders = createSelector(
  (state: RampsState) => state.metamask.providers,
  (providers): ResourceState<Provider[], Provider | null> =>
    providers ??
    createDefaultResourceState<Provider[], Provider | null>([], null),
);

export const selectTokens = createSelector(
  (state: RampsState) => state.metamask.tokens,
  (tokens): ResourceState<TokensResponse | null, RampsToken | null> =>
    tokens ??
    createDefaultResourceState<TokensResponse | null, RampsToken | null>(
      null,
      null,
    ),
);

export const selectPaymentMethods = createSelector(
  (state: RampsState) => state.metamask.paymentMethods,
  (paymentMethods): ResourceState<PaymentMethod[], PaymentMethod | null> =>
    paymentMethods ??
    createDefaultResourceState<PaymentMethod[], PaymentMethod | null>(
      [],
      null,
    ),
);

export const selectRampsOrders = createSelector(
  (state: RampsState) => state.metamask.orders,
  (orders): RampsOrder[] => orders ?? [],
);

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

export const selectProviderAutoSelected = createSelector(
  (state: RampsState) => state.metamask.providerAutoSelected,
  (providerAutoSelected): boolean => providerAutoSelected ?? false,
);
