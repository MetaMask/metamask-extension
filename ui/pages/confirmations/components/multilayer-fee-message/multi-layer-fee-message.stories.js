import React from 'react';
import MultilayerFeeMessage from './multi-layer-fee-message';

export default {
  title: 'Confirmations/Components/MultilayerFeeMessage',
  component: MultilayerFeeMessage,
  argTypes: {
    transaction: {
      control: 'object',
    },
    layer2fee: {
      control: 'text',
    },
    nativeCurrency: {
      control: 'text',
    },
    plainStyle: {
      control: 'boolean',
    },
  },
  args: {
    transaction: {
      txParams: {
        value: '0x123456789',
      },
    },
    layer2fee: '0x987654321',
    nativeCurrency: 'ETH',
    plainStyle: true,
  },
};

export const DefaultStory = (args) => <MultilayerFeeMessage {...args} />;

DefaultStory.storyName = 'Default';
