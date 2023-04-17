import React from 'react';
import { MultichainAccountDetails } from '.';

export default {
  title: 'Components/Multichain/MultichainAccountDetails',
  component: MultichainAccountDetails,
  argTypes: {
    identity: {
      control: 'object',
    },
  },
  args: {
    identity: {
      address: '"0xb19ac54efa18cc3a14a5b821bfec73d284bf0c5e"',
      name: 'Account 1',
      balance: '0x152387ad22c3f0',
      tokenBalance: '32.09 ETH',
    },
  },
};

export const DefaultStory = (args) => <MultichainAccountDetails {...args} />;

DefaultStory.storyName = 'Default';
