import React from 'react';
import ContractTokenValues from './contract-token-values';

export default {
  title: 'Components/UI/ContractTokenValues',
  id: __filename,
  argTypes: {
    tokenName: {
      control: {
        type: 'text',
      },
    },
    address: {
      control: {
        type: 'text',
      },
    },
  },
  args: {
    tokenName: 'DAI',
    address: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f',
  },
};

export const DefaultStory = (args) => <ContractTokenValues {...args} />;

DefaultStory.storyName = 'Default';
