import React from 'react';
import { StoryObj, Meta } from '@storybook/react';
import { MultichainAccountDetailsPage } from './multichain-account-details-page';

const meta: Meta<typeof MultichainAccountDetailsPage> = {
  title: 'Pages/MultichainAccounts/MultichainAccountDetailsPage',
  component: MultichainAccountDetailsPage,
  parameters: {
    backgrounds: {
      default: 'light',
    },
    initialEntries: [
      `/multichain-account-details/${encodeURIComponent('entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0')}`,
    ],
    path: '/multichain-account-details/:id',
  },
};

export default meta;
type Story = StoryObj<typeof MultichainAccountDetailsPage>;

export const Default: Story = {};

Default.parameters = {
  docs: {
    description: {
      story:
        'Default state of the MultichainAccountDetailsPage showing account details for the selected account.',
    },
  },
};
