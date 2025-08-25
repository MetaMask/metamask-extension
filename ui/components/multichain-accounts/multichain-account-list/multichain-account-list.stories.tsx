import { StoryObj, Meta } from '@storybook/react';
import { Provider } from 'react-redux';
import {
  MultichainAccountList,
  type MultichainAccountListProps,
} from './multichain-account-list';
import { AccountGroupId } from '@metamask/account-api';
import { AccountTreeWallets } from '../../../selectors/multichain-accounts/account-tree.types';
import React from 'react';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';

const mockSelectedAccountGroup = mockState.metamask.accountTree
  .selectedAccountGroup as AccountGroupId;

const defaultArgs: MultichainAccountListProps = {
  wallets: mockState.metamask.accountTree
    .wallets as unknown as AccountTreeWallets,
  selectedAccountGroup: mockSelectedAccountGroup,
};

const store = configureStore({
  metamask: mockState.metamask,
});

const meta: Meta<typeof MultichainAccountList> = {
  title: 'Components/MultichainAccounts/MultichainAccountList',
  component: MultichainAccountList,
  parameters: {
    backgrounds: {
      default: 'light',
    },
  },
  decorators: [
    (Story) => (
      <Provider store={store}>
        <Story />
      </Provider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MultichainAccountList>;

export const Default: Story = {
  args: defaultArgs,
};

Default.parameters = {
  docs: {
    description: {
      story:
        'Default state of MultichainAccountList showing various wallets and their accounts.',
    },
  },
};
