import React from 'react';
import { Provider } from 'react-redux';
import { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { Caip25CaveatType, Caip25EndowmentPermissionName } from '@metamask/chain-agnostic-permission';

import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { ConnectPage } from './connect-page';

const store = configureStore(mockState);

const meta: Meta<typeof ConnectPage> = {
  title: 'Pages/Permissions/ConnectPage',
  component: ConnectPage,
  decorators: [
    (story) => <Provider store={store}>{story()}</Provider>
  ],
};

export default meta;
type Story = StoryObj<typeof ConnectPage>;

// Mock data for the stories
const mockTargetSubjectMetadata = {
  extensionId: null,
  iconUrl: 'https://metamask.github.io/test-dapp/metamask-fox.svg',
  name: 'E2E Test Dapp',
  origin: 'https://metamask.github.io',
  subjectType: 'website',
};

const mockRequest = {
  id: '1',
  origin: 'https://metamask.github.io',
  permissions: {
    [Caip25EndowmentPermissionName]: {
      caveats: [
        {
          type: Caip25CaveatType,
          value: {
            requiredScopes: {},
            optionalScopes: {
              'eip155:1': {
                accounts: [],
              },
            },
            sessionProperties: {},
            isMultichainOrigin: false,
          },
        },
      ],
    },
  },
};

export const Default: Story = {
  args: {
    request: mockRequest,
    permissionsRequestId: '1',
    rejectPermissionsRequest: action('rejectPermissionsRequest'),
    approveConnection: action('approveConnection'),
    activeTabOrigin: 'https://metamask.github.io',
    targetSubjectMetadata: mockTargetSubjectMetadata,
  },
};

export const WithCustomDapp: Story = {
  args: {
    request: {
      ...mockRequest,
      origin: 'https://uniswap.org',
    },
    permissionsRequestId: '2',
    rejectPermissionsRequest: action('rejectPermissionsRequest'),
    approveConnection: action('approveConnection'),
    activeTabOrigin: 'https://uniswap.org',
    targetSubjectMetadata: {
      ...mockTargetSubjectMetadata,
      iconUrl: 'https://uniswap.org/favicon.ico',
      name: 'Uniswap',
      origin: 'https://uniswap.org',
    },
  },
};

export const WithNoIcon: Story = {
  args: {
    request: mockRequest,
    permissionsRequestId: '3',
    rejectPermissionsRequest: action('rejectPermissionsRequest'),
    approveConnection: action('approveConnection'),
    activeTabOrigin: 'https://example.com',
    targetSubjectMetadata: {
      ...mockTargetSubjectMetadata,
      iconUrl: null,
      name: 'Example Dapp',
      origin: 'https://example.com',
    },
  },
};

export const WithIpAddress: Story = {
  args: {
    request: {
      ...mockRequest,
      origin: 'http://192.168.1.1',
    },
    permissionsRequestId: '4',
    rejectPermissionsRequest: action('rejectPermissionsRequest'),
    approveConnection: action('approveConnection'),
    activeTabOrigin: 'http://192.168.1.1',
    targetSubjectMetadata: {
      ...mockTargetSubjectMetadata,
      iconUrl: null,
      name: 'Local Development',
      origin: 'http://192.168.1.1',
    },
  },
};
