import React from 'react';
import {DeFiDetails} from './defi-page';

export default {
  title: 'Pages/DeFiPage',
  argTypes: {
    protocolId: {
      control: 'text',
    },
    chainId: {
      control: 'text',
    },
  },
  args: {
    protocolId: 'aave-v3',
    chainId: '0x1',
  },
};

export const DefaultStory = (args) => <DeFiDetails {...args} />;

DefaultStory.storyName = 'Default-1';
