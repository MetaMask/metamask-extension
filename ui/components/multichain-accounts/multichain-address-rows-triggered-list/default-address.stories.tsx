import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { DefaultAddress } from './default-address';

const mockStore = configureStore([]);

const createMockState = (overrides = {}) => ({
  metamask: {
    preferences: {
      showDefaultAddress: true,
      defaultAddressScope: 'eip155',
      ...overrides,
    },
  },
});

const meta: Meta<typeof DefaultAddress> = {
  title: 'Components/MultichainAccounts/DefaultAddress',
  component: DefaultAddress,
  parameters: {
    docs: {
      description: {
        component:
          'Toggle and label for showing the default address in the account hover menu. Displays the current default scope (e.g. Ethereum) and a link to change it in Settings.',
      },
    },
  },
  decorators: [
    (Story) => (
      <Provider store={mockStore(createMockState())}>
        <div style={{ width: '380px', padding: '16px' }}>
          <Story />
        </div>
      </Provider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DefaultAddress>;

export const Default: Story = {};
