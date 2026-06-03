import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { ChooseNewWalletTypePage } from './choose-new-wallet-type-page';

const meta: Meta<typeof ChooseNewWalletTypePage> = {
  title: 'Pages/MultichainAccounts/ChooseNewWalletTypePage',
  component: ChooseNewWalletTypePage,
  parameters: {
    backgrounds: {
      default: 'light',
    },
    initialEntries: ['/choose-new-wallet-type'],
    path: '/choose-new-wallet-type',
  },
};

export default meta;
type Story = StoryObj<typeof ChooseNewWalletTypePage>;

export const Default: Story = {};

Default.parameters = {
  docs: {
    description: {
      story:
        'Default state of the ChooseNewWalletTypePage showing wallet type options: import wallet, import account, and connect hardware wallet.',
    },
  },
};
