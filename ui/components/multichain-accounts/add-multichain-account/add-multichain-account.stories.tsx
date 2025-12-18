import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { AddMultichainAccount } from './add-multichain-account';
import { AddMultichainAccountProps } from './add-multichain-account';

export default {
  title: 'Components/MultichainAccounts/AddMultichainAccount',
  component: AddMultichainAccount,
  parameters: {
    docs: {
      description: {
        component:
          'A component that allows users to create a new multichain account for a given wallet.',
      },
    },
    controls: { sort: 'alpha' },
  },
  argTypes: {
    walletId: {
      control: 'text',
      description:
        'Unique identifier for the wallet where the new account will be created',
    },
  },
  args: {
    walletId: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ',
  },
} as Meta<typeof AddMultichainAccount>;

const Template: StoryFn<typeof AddMultichainAccount> = (
  args: AddMultichainAccountProps,
) => (
  <div style={{ width: '360px', margin: '0 auto' }}>
    <AddMultichainAccount {...args} />
  </div>
);

export const Default = Template.bind({});
Default.storyName = 'Default';
Default.parameters = {
  docs: {
    description: {
      story: 'Default state of the AddMultichainAccount component.',
    },
  },
};
