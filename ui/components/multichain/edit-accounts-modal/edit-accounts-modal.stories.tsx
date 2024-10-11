import React from 'react';
import { Provider } from 'react-redux';
import { EditAccountsModal } from '.';
import testData from '../../../../.storybook/test-data';
import configureStore from '../../../store/store';

const store = configureStore(testData);

export default {
  title: 'Components/Multichain/EditAccountsModal',
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
  argTypes: {
    onClose: { action: 'onClose' },
    activeTabOrigin: { control: 'text' },
    accounts: { control: 'array' },
  },
  args: {
    onClose: () => undefined,
    onClick: () => undefined,
    onDisconnectClick: () => undefined,
    approvedAccounts: [],
    activeTabOrigin: 'https://test.dapp',
    currentTabHasNoAccounts: false,
    defaultSelectedAccountAddresses: [
      '0x860092756917d3e069926ba130099375eeeb9440',
    ],
    accounts: [
      {
        id: '689821df-0e8f-4093-bbbb-b95cf0fa79cb',
        address: '0x860092756917d3e069926ba130099375eeeb9440',
        options: {},
        methods: [
          'personal_sign',
          'eth_sign',
          'eth_signTransaction',
          'eth_signTypedData_v1',
          'eth_signTypedData_v3',
          'eth_signTypedData_v4',
        ],
        type: 'eip155:eoa',
        metadata: {
          name: 'Account 1',
          importTime: 1726046726882,
          keyring: {
            type: 'HD Key Tree',
          },
          lastSelected: 1726046726882,
        },
        balance: '0x00',
      },
    ],
  },
};

export const DefaultStory = (args) => <EditAccountsModal {...args} />;

DefaultStory.storyName = 'Default';
