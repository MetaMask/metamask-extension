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
} from '@metamask/ramps-controller';
import { getSelectedInternalAccount } from '../../../shared/lib/selectors/accounts';

type RampsControllerStateSlice = {
  metamask: {
    RampsController?: {
      userRegion?: UserRegion | null;
      countries?: ResourceState<Country[]>;
      providers?: ResourceState<Provider[], Provider | null>;
      tokens?: ResourceState<TokensResponse | null, RampsToken | null>;
      paymentMethods?: ResourceState<PaymentMethod[], PaymentMethod | null>;
      orders?: RampsOrder[];
      providerAutoSelected?: boolean;
    };
  };
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

export const selectRampsControllerState = (state: RampsControllerStateSlice) =>
  state.metamask.RampsController;

export const selectUserRegion = createSelector(
  selectRampsControllerState,
  (rampsControllerState): UserRegion | null =>
    rampsControllerState?.userRegion ?? null,
);

export const selectCountries = createSelector(
  selectRampsControllerState,
  (rampsControllerState): ResourceState<Country[]> =>
    rampsControllerState?.countries ??
    createDefaultResourceState<Country[]>([]),
);

export const selectProviders = createSelector(
  selectRampsControllerState,
  (rampsControllerState): ResourceState<Provider[], Provider | null> =>
    rampsControllerState?.providers ??
    createDefaultResourceState<Provider[], Provider | null>([], null),
);

export const selectTokens = createSelector(
  selectRampsControllerState,
  (
    rampsControllerState,
  ): ResourceState<TokensResponse | null, RampsToken | null> =>
    rampsControllerState?.tokens ??
    createDefaultResourceState<TokensResponse | null, RampsToken | null>(
      null,
      null,
    ),
);

export const selectPaymentMethods = createSelector(
  selectRampsControllerState,
  (
    rampsControllerState,
  ): ResourceState<PaymentMethod[], PaymentMethod | null> =>
    rampsControllerState?.paymentMethods ??
    createDefaultResourceState<PaymentMethod[], PaymentMethod | null>([], null),
);

export const selectRampsOrders = createSelector(
  selectRampsControllerState,
  (rampsControllerState): RampsOrder[] => rampsControllerState?.orders ?? [],
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
  selectRampsControllerState,
  (rampsControllerState): boolean =>
    rampsControllerState?.providerAutoSelected ?? false,
);
