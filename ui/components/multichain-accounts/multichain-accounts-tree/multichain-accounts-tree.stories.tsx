import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { EthAccountType, EthScope } from '@metamask/keyring-api';
import { ETH_EOA_METHODS } from '../../../../shared/constants/eth-methods';
import { MultichainAccountsTree } from './index';

export default {
  title: 'Components/MultichainAccounts/MultichainAccountsTree',
  component: MultichainAccountsTree,
  parameters: {
    docs: {
      description: {
        component:
          'A tree view for displaying accounts grouped by wallets',
      },
    },
  },
  argTypes: {
    onClose: { action: 'onClose' },
    onAccountListItemItemClicked: { action: 'onAccountListItemItemClicked' },
  },
} as Meta<typeof MultichainAccountsTree>;

const mockWalletAccountCollection = {
  'wallet-1': {
    metadata: {
      name: 'Wallet 1',
    },
    groups: {
      'group-1': {
        accounts: [
          {
            address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
            id: 'account-1',
            metadata: {
              name: 'Account 1',
              keyring: {
                type: 'HD Key Tree',
              },
            },
            options: {},
            methods: ETH_EOA_METHODS,
            scopes: [EthScope.Eoa],
            type: EthAccountType.Eoa,
            balance: '0x0',
          },
          {
            address: '0x123456789abcdef0123456789abcdef012345678',
            id: 'account-2',
            metadata: {
              name: 'Account 2',
              keyring: {
                type: 'HD Key Tree',
              },
            },
            options: {},
            methods: ETH_EOA_METHODS,
            scopes: [EthScope.Eoa],
            type: EthAccountType.Eoa,
            balance: '0x0',
          },
        ],
      },
    },
  },
  'wallet-2': {
    metadata: {
      name: 'Wallet 2',
    },
    groups: {
      'group-2': {
        accounts: [
          {
            address: '0xabcdef0123456789abcdef0123456789abcdef01',
            id: 'account-3',
            metadata: {
              name: 'Account 3',
              keyring: {
                type: 'HD Key Tree',
              },
            },
            options: {},
            methods: ETH_EOA_METHODS,
            scopes: [EthScope.Eoa],
            type: EthAccountType.Erc4337,
            balance: '0x0',
          },
        ],
      },
    },
  },
};

const mockConnectedSites = {
  '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': [
    {
      origin: 'https://test.dapp',
      iconUrl: 'https://test.dapp/icon.png',
    },
  ],
};

const Template: StoryFn<typeof MultichainAccountsTree> = (args) => (
  <div
    style={{ width: '375px', border: '1px solid #ccc', borderRadius: '8px' }}
  >
    <MultichainAccountsTree {...args} />
  </div>
);

export const Default = Template.bind({});
Default.args = {
  walletAccountCollection: mockWalletAccountCollection,
  allowedAccountTypes: [EthAccountType.Eoa, EthAccountType.Erc4337],
  connectedSites: mockConnectedSites,
  currentTabOrigin: 'https://test.dapp',
  privacyMode: false,
  selectedAccount: {
    address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
  },
};

export const EOAAccountsOnly = Template.bind({});
EOAAccountsOnly.args = {
  ...Default.args,
  allowedAccountTypes: [EthAccountType.Eoa],
};
EOAAccountsOnly.parameters = {
  docs: {
    description: {
      story: 'Shows only EOA (Externally Owned Account) type accounts',
    },
  },
};

export const ERC4337AccountsOnly = Template.bind({});
ERC4337AccountsOnly.args = {
  ...Default.args,
  allowedAccountTypes: [EthAccountType.Erc4337],
};
ERC4337AccountsOnly.parameters = {
  docs: {
    description: {
      story: 'Shows only ERC4337 (Smart Contract) type accounts',
    },
  },
};

export const WithPrivacyMode = Template.bind({});
WithPrivacyMode.args = {
  ...Default.args,
  privacyMode: true,
};
WithPrivacyMode.parameters = {
  docs: {
    description: {
      story: 'Displays accounts with privacy mode enabled',
    },
  },
};
