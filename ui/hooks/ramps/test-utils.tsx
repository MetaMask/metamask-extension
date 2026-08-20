import React from 'react';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import configureStore from 'redux-mock-store';

export const rampsMockMetamaskState = {
  userRegion: {
    regionCode: 'us-ca',
    country: { currency: 'USD', isoCode: 'US', name: 'United States' },
  },
  countries: {
    data: [],
    selected: null,
    isLoading: false,
    error: null,
  },
  providers: {
    data: [],
    selected: null,
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
    data: [],
    selected: null,
    isLoading: false,
    error: null,
  },
  orders: [],
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
};

const mockStoreFactory = configureStore([]);

export function createRampsMockStore(overrides: Record<string, unknown> = {}) {
  return mockStoreFactory({
    metamask: {
      ...rampsMockMetamaskState,
      ...overrides,
    },
  });
}

export function createRampsTestWrapper(store = createRampsMockStore()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </Provider>
  );
}
