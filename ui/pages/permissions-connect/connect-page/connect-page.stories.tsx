import React from 'react';
import type { Meta, StoryFn } from '@storybook/react';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from '@metamask/chain-agnostic-permission';
import { Provider } from 'react-redux';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { ConnectPage, ConnectPageProps } from './connect-page';

const mockTargetSubjectMetadata = {
  extensionId: null,
  iconUrl: 'https://metamask.github.io/test-dapp/metamask-fox.svg',
  name: 'E2E Test Dapp',
  origin: 'https://metamask.github.io',
  subjectType: 'website' as const,
};

const mockRequest = {
  permissions: {
    [Caip25EndowmentPermissionName]: {
      caveats: [
        {
          type: Caip25CaveatType,
          value: {
            requiredScopes: {},
            optionalScopes: {
              'eip155:0x1': {
                methods: ['eth_sendTransaction', 'eth_signTransaction'],
                notifications: ['eth_subscription'],
                accounts: [
                  'eip155:0x1:0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
                ],
              },
              'eip155:0x5': {
                methods: ['eth_sendTransaction', 'eth_signTransaction'],
                notifications: ['eth_subscription'],
                accounts: [
                  'eip155:0x5:0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
                ],
              },
            },
            sessionProperties: {},
            isMultichainOrigin: false,
          },
        },
      ],
    },
  },
  metadata: {
    id: 'test-request-id',
    origin: 'https://metamask.github.io',
    isEip1193Request: true,
  },
};

const meta: Meta<typeof ConnectPage> = {
  title: 'Pages/PermissionsConnect/ConnectPage',
  component: ConnectPage,
  decorators: [
    (Story) => {
      const store = configureStore(mockState);
      return (
        <Provider store={store}>
          <Story />
        </Provider>
      );
    },
  ],
};

export default meta;

type Story = StoryFn<typeof ConnectPage>;

export const Default: Story = {
  args: {
    request: mockRequest,
    permissionsRequestId: 'test-request-id',
    rejectPermissionsRequest: (id: string) => {
      console.log('Rejected request:', id);
    },
    approveConnection: (request) => {
      console.log('Approved connection:', request);
    },
    activeTabOrigin: 'https://metamask.github.io',
    targetSubjectMetadata: mockTargetSubjectMetadata,
  },
};
