import React from 'react';
import ConnectedAccountsList from '.';

export default {
  title: 'Components/App/ConnectedAccountsList',

  argTypes: {
    connectedAccounts: {
      control: 'array',
    },
    selectedAddress: {
      control: 'text',
    },
    shouldRenderListOptions: {
      control: 'boolean',
    },
  },
  args: {
    connectedAccounts: [
      {
        name: 'This is a Really Long Account Name',
        address: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
        index: 0,
        balance: '0x176e5b6f173ebe66',
      },
      {
        name: 'Account 2',
        address: '0xb19ac54efa18cc3a14a5b821bfec73d284bf0c5e',
        index: 1,
        balance: '0x2d3142f5000',
      },
    ],
  },
};

export const DefaultStory = (args) => <ConnectedAccountsList {...args} />;

DefaultStory.storyName = 'Default';
