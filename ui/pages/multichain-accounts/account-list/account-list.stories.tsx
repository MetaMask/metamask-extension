import React from 'react';
import { StoryObj, Meta } from '@storybook/react';
import { AccountList } from './account-list';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';

const store = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

const meta: Meta<typeof AccountList> = {
  title: 'Pages/MultichainAccounts/AccountList',
  component: AccountList,
  decorators: [
    (story) => (
      story()
    ),
  ],
  parameters: {
    backgrounds: {
      default: 'light',
    },
  },
};

export default meta;
type Story = StoryObj<typeof AccountList>;

export const Default: Story = {};

Default.parameters = {
  docs: {
    description: {
      story:
        'Default state of the AccountList page showing various wallets and their accounts.',
    },
  },
};
