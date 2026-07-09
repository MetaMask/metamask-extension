import type { AccountsState } from '../../../shared/lib/selectors/accounts';
import {
  selectCountries,
  selectPaymentMethods,
  selectProviderAutoSelected,
  selectProviders,
  selectRampsControllerState,
  selectRampsOrders,
  selectRampsOrdersForSelectedAccount,
  selectTokens,
  selectUserRegion,
  type RampsState,
} from '.';

const populatedState = {
  metamask: {
    userRegion: {
      regionCode: 'us-ca',
      country: { currency: 'USD', isoCode: 'US', name: 'United States' },
    },
    countries: {
      data: [{ isoCode: 'US', name: 'United States' }],
      selected: null,
      isLoading: false,
      error: null,
    },
    providers: {
      data: [{ id: 'transak', name: 'Transak' }],
      selected: { id: 'transak', name: 'Transak' },
      isLoading: false,
      error: null,
    },
    tokens: {
      data: { topTokens: [], allTokens: [] },
      selected: null,
      isLoading: false,
      error: null,
    },
    paymentMethods: {
      data: [{ id: 'credit_debit_card', name: 'Card' }],
      selected: { id: 'credit_debit_card', name: 'Card' },
      isLoading: false,
      error: null,
    },
    orders: [
      {
        id: '1',
        providerOrderId: 'order-1',
        walletAddress: '0xAbC123',
        status: 'COMPLETED',
        createdAt: 1,
      },
      {
        id: '2',
        providerOrderId: 'order-2',
        walletAddress: '0xother',
        status: 'COMPLETED',
        createdAt: 2,
      },
    ],
    providerAutoSelected: true,
    internalAccounts: {
      selectedAccount: 'account-1',
      accounts: {
        'account-1': {
          id: 'account-1',
          address: '0xabc123',
          metadata: { name: 'Account 1' },
        },
      },
    },
  },
} as unknown as RampsState & AccountsState;

describe('rampsController selectors', () => {
  it('matches snapshot for populated state', () => {
    expect({
      selectUserRegion: selectUserRegion(populatedState),
      selectCountries: selectCountries(populatedState),
      selectProviders: selectProviders(populatedState),
      selectTokens: selectTokens(populatedState),
      selectPaymentMethods: selectPaymentMethods(populatedState),
      selectRampsOrders: selectRampsOrders(populatedState),
      selectRampsOrdersForSelectedAccount:
        selectRampsOrdersForSelectedAccount(populatedState),
      selectProviderAutoSelected: selectProviderAutoSelected(populatedState),
      selectRampsControllerState: selectRampsControllerState(populatedState),
    }).toMatchSnapshot();
  });

  it('matches snapshot for default state', () => {
    const emptyMetamask = { metamask: {} } as unknown as RampsState;
    const emptyAccountState = {
      metamask: {
        internalAccounts: {
          selectedAccount: 'missing',
          accounts: {},
        },
      },
    } as unknown as RampsState & AccountsState;

    expect({
      selectUserRegion: selectUserRegion(emptyMetamask),
      selectCountries: selectCountries(emptyMetamask),
      selectProviders: selectProviders(emptyMetamask),
      selectTokens: selectTokens(emptyMetamask),
      selectPaymentMethods: selectPaymentMethods(emptyMetamask),
      selectRampsOrders: selectRampsOrders(emptyMetamask),
      selectRampsOrdersForSelectedAccount:
        selectRampsOrdersForSelectedAccount(emptyAccountState),
      selectProviderAutoSelected: selectProviderAutoSelected(emptyMetamask),
      selectRampsControllerState: selectRampsControllerState(emptyMetamask),
    }).toMatchSnapshot();
  });
});
