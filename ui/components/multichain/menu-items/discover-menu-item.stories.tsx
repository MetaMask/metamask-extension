import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import configureStore from '../../../store/store';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { DiscoverMenuItem } from './discover-menu-item';

const mockStore = configureStore({
  metamask: {
    currentLocale: 'en',
    metaMetricsId: 'test-metrics-id',
    participateInMetaMetrics: true,
    dataCollectionForMarketing: false,
  },
});

const mockMetaMetricsContext = {
  trackEvent: () => {
    // Mock trackEvent function
  },
  trackPage: () => {
    // Mock trackPage function
  },
};

const meta: Meta<typeof DiscoverMenuItem> = {
  title: 'Components/Multichain/MenuItems/DiscoverMenuItem',
  component: DiscoverMenuItem,
  decorators: [
    (Story) => (
      <Provider store={mockStore}>
        <MetaMetricsContext.Provider value={mockMetaMetricsContext}>
          <div style={{ width: '280px', padding: '16px' }}>
            <Story />
          </div>
        </MetaMetricsContext.Provider>
      </Provider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DiscoverMenuItem>;

export const Default: Story = {
  args: {
    closeMenu: () => console.log('Menu closed'),
    metricsLocation: 'Global Menu',
  },
};
