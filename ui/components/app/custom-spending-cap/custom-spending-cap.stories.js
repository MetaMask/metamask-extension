import React from 'react';
import CustomSpendingCap from './custom-spending-cap';

export default {
  title: 'Components/App/CustomSpendingCap',

  argTypes: {
    tokenName: {
      control: { type: 'text' },
    },
    currentTokenBalance: {
      control: { type: 'number' },
    },
    dappProposedValue: {
      control: { type: 'text' },
    },
    siteOrigin: {
      control: { type: 'text' },
    },
    passTheErrorText: {
      action: 'passTheErrorText',
    },
    decimals: {
      control: 'text',
    },
    customSpendingCap: {
      control: { type: 'text' },
    },
  },
  args: {
    tokenName: 'DAI',
    currentTokenBalance: 200.12,
    dappProposedValue: '7',
    siteOrigin: 'Uniswap.org',
    decimals: '4',
    customSpendingCap: '7',
  },
};

export const DefaultStory = (args) => {
  return <CustomSpendingCap {...args} />;
};

DefaultStory.storyName = 'Default';

export const CustomSpendingCapStory = (args) => {
  return <CustomSpendingCap {...args} />;
};
CustomSpendingCapStory.storyName = 'CustomSpendingCapStory';

CustomSpendingCapStory.args = {
  ...DefaultStory.args,
  customSpendingCap: '8',
};
