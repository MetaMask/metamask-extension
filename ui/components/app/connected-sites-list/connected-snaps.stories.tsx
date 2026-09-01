import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import configureStore from '../../../store/store';
import ConnectedSnaps from './connected-snaps';

const mockStore = configureStore({
  metamask: {
    currentLocale: 'en',
    providerConfig: { chainId: '0x1' },
    snaps: {
      'npm:@metamask/example-snap': {
        id: 'npm:@metamask/example-snap',
        manifest: {
          proposedName: 'MetaMask Example Snap',
        },
        status: 'running',
      },
      'npm:@metamask/transaction-insights-snap': {
        id: 'npm:@metamask/transaction-insights-snap',
        manifest: {
          proposedName: 'Transaction Insights',
        },
        status: 'running',
      },
      'npm:@metamask/notifications-snap': {
        id: 'npm:@metamask/notifications-snap',
        manifest: {
          proposedName: 'Notifications Snap',
        },
        status: 'running',
      },
    },
    subjectMetadata: {
      'npm:@metamask/example-snap': {
        name: 'MetaMask Example Snap',
        subjectType: 'snap',
        iconUrl: null,
      },
      'npm:@metamask/transaction-insights-snap': {
        name: 'Transaction Insights',
        subjectType: 'snap',
        iconUrl: null,
      },
      'npm:@metamask/notifications-snap': {
        name: 'Notifications Snap',
        subjectType: 'snap',
        iconUrl: null,
      },
    },
  },
  activeTab: {
    origin: 'https://example.com',
  },
});

const meta: Meta<typeof ConnectedSnaps> = {
  title: 'Components/App/ConnectedSitesList/ConnectedSnaps',
  component: ConnectedSnaps,
  decorators: [
    (Story) => (
      <Provider store={mockStore}>
        <div style={{ width: '360px', padding: '16px' }}>
          <Story />
        </div>
      </Provider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ConnectedSnaps>;

export const Default: Story = {
  args: {
    connectedSubjects: [
      {
        name: 'MetaMask Example Snap',
        origin: 'npm:@metamask/example-snap',
      },
      {
        name: 'Transaction Insights',
        origin: 'npm:@metamask/transaction-insights-snap',
      },
      {
        name: 'Notifications Snap',
        origin: 'npm:@metamask/notifications-snap',
      },
    ],
  },
};
