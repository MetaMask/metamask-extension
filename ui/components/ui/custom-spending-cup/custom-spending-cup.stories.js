import React from 'react';
import CustomSpendingCup from './custom-spending-cup';

export default {
  title: 'Components/UI/CustomSpendingCup',
  id: __filename,
  argTypes: {
    tokenName: {
      control: { type: 'text' },
    },
    currentTokenBalance: {
      control: { type: 'number' },
    },
    dappProposedValue: {
      control: { type: 'number' },
    },
  },
  args: {
    tokenName: 'DAI',
    currentTokenBalance: 200.12,
    dappProposedValue: 7,
  },
};

export const DefaultStory = (args) => {
  return <CustomSpendingCup {...args} />;
};

DefaultStory.storyName = 'Default';
