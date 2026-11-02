import React from 'react';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';
import { MoneyAccountAvailabilityServiceQueryKeys } from '../../../hooks/money/query-keys';
import { SideNav } from './side-nav';

const store = configureStore({
  activeTab: {
    origin: 'https://metamask.github.io',
    protocol: 'https:',
    url: 'https://metamask.github.io/test-dapp/',
  },
  metamask: {
    ...mockState.metamask,
    completedOnboarding: true,
    useExternalServices: true,
    remoteFeatureFlags: {
      ...mockState.metamask.remoteFeatureFlags,
      // The Perps item also needs the compile-time `PERPS_ENABLED` build flag,
      // which Storybook does not set, so it is not shown here.
      perpsEnabledVersion: { enabled: true, minimumVersion: '0.0.1' },
      moneyEnableMoneyAccount: { enabled: true, minimumVersion: '0.0.1' },
    },
  },
});

// The Money item depends on a background request that is not available in
// Storybook, so the availability query is seeded with a resolved value.
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});
queryClient.setQueryData(
  [MoneyAccountAvailabilityServiceQueryKeys.GetAvailability, true],
  {
    isAvailable: true,
    address: '0x0000000000000000000000000000000000000001',
  },
);

const meta: Meta<typeof SideNav> = {
  title: 'Components/App/SideNav',
  component: SideNav,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <div style={{ height: '100vh' }}>
            <Story />
          </div>
        </QueryClientProvider>
      </Provider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SideNav>;

export const Default: Story = {};
