import React from 'react';
import ContractTokenValues from './contract-token-values';

export default {
  title: 'Components/UI/ContractTokenValues',

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
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  },
};

export const DefaultStory = (args) => <ContractTokenValues {...args} />;

DefaultStory.storyName = 'Default';
