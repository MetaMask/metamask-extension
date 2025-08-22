import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { Provider } from 'react-redux';
import {
  AccountGroupId,
  AccountWalletId,
  AccountGroupType,
} from '@metamask/account-api';
import { EthAccountType, EthScope } from '@metamask/keyring-api';
import { ETH_EOA_METHODS } from '../../../../../shared/constants/eth-methods';
import { MultichainEditAccountsModal } from './multichain-edit-accounts-modal';
import { AccountGroupWithInternalAccounts } from '../../../../selectors/multichain-accounts/account-tree.types';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';

export default {
  title:
    'Components/MultichainAccounts/Permissions/MultichainEditAccountsModal',
  component: MultichainEditAccountsModal,
  parameters: {
    docs: {
      description: {
        component:
          'A modal for editing account permissions for a connected site',
      },
    },
  },
  argTypes: {
    onClose: { action: 'onClose' },
    onSubmit: { action: 'onSubmit' },
  },
} as Meta<typeof MultichainEditAccountsModal>;

const store = configureStore({
  metamask: mockState.metamask,
});

const walletOneId: AccountWalletId = 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ';
const walletOneGroupId: AccountGroupId = `${walletOneId}/0`;
const walletTwoId: AccountWalletId = 'entropy:01JKAF3PJ247KAM6C03G5Q0NP8';
const walletTwoGroupId: AccountGroupId = `${walletTwoId}/0`;
const walletThreeId: AccountWalletId = 'keyring:Ledger Hardware';
const walletThreeGroupId: AccountGroupId = `${walletThreeId}/0xc42edfcc21ed14dda456aa0756c153f7985d8813`;

const mockSupportedAccountGroups: AccountGroupWithInternalAccounts[] = [
  {
    id: walletOneGroupId,
    type: AccountGroupType.MultichainAccount,
    metadata: {
      name: 'Account 1',
      entropy: {
        groupIndex: 0,
      },
      hidden: false,
      pinned: false,
    },
    accounts: [
      {
        address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
        metadata: {
          name: 'Account 1',
          keyring: {
            type: 'HD Key Tree',
          },
          importTime: 0,
        },
        options: {},
        methods: ETH_EOA_METHODS,
        scopes: [EthScope.Eoa],
        type: EthAccountType.Eoa,
      },
    ],
  },
  {
    id: walletTwoGroupId,
    type: AccountGroupType.MultichainAccount,
    metadata: {
      name: 'Account 2',
      entropy: {
        groupIndex: 0,
      },
      hidden: false,
      pinned: false,
    },
    accounts: [
      {
        address: '0x123456789abcdef0123456789abcdef012345678',
        id: '784225f4-d30b-4e77-a900-c8bbce735b88',
        metadata: {
          name: 'Account 2',
          keyring: {
            type: 'HD Key Tree',
          },
          importTime: 0,
        },
        options: {},
        methods: ETH_EOA_METHODS,
        scopes: [EthScope.Eoa],
        type: EthAccountType.Eoa,
      },
    ],
  },
  {
    id: walletThreeGroupId,
    type: AccountGroupType.SingleAccount,
    metadata: {
      name: 'Ledger Account 1',
      hidden: false,
      pinned: false,
    },
    accounts: [
      {
        address: '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
        id: '15e69915-2a1a-4019-93b3-916e11fd432f',
        metadata: {
          name: 'Ledger Account 1',
          keyring: {
            type: 'Ledger Hardware',
          },
          importTime: 0,
        },
        options: {},
        methods: ETH_EOA_METHODS,
        scopes: [EthScope.Eoa],
        type: EthAccountType.Eoa,
      },
    ],
  },
];

const Template: StoryFn<typeof MultichainEditAccountsModal> = (args) => (
  <Provider store={store}>
    <MultichainEditAccountsModal {...args} />
  </Provider>
);

export const OneAccountConnected = Template.bind({});
OneAccountConnected.args = {
  defaultSelectedAccountGroups: [walletOneGroupId],
  supportedAccountGroups: mockSupportedAccountGroups,
  onClose: () => {},
  onSubmit: () => {},
};
OneAccountConnected.parameters = {
  docs: {
    description: {
      story: 'Shows the modal with 1 out of 3 accounts connected',
    },
  },
};

export const AllAccountsConnected = Template.bind({});
AllAccountsConnected.args = {
  defaultSelectedAccountGroups: [
    walletOneGroupId,
    walletTwoGroupId,
    walletThreeGroupId,
  ],
  supportedAccountGroups: mockSupportedAccountGroups,
  onClose: () => {},
  onSubmit: () => {},
};
AllAccountsConnected.parameters = {
  docs: {
    description: {
      story: 'Shows the modal with all 3 accounts connected',
    },
  },
};

export const NoAccountsConnected = Template.bind({});
NoAccountsConnected.args = {
  defaultSelectedAccountGroups: [],
  supportedAccountGroups: mockSupportedAccountGroups,
  onClose: () => {},
  onSubmit: () => {},
};
NoAccountsConnected.parameters = {
  docs: {
    description: {
      story: 'Shows the modal with no accounts connected',
    },
  },
};
