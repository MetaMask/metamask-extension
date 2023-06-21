import React from 'react';
import ReviewSpendingCap from './review-spending-cap';

export default {
  title: 'Components/UI/ReviewSpendingCap',

  argTypes: {
    tokenName: {
      control: { type: 'text' },
    },
    currentTokenBalance: {
      control: { type: 'number' },
    },
    tokenValue: {
      control: { type: 'text' },
    },
    onEdit: {
      action: 'onEdit',
    },
  },
  args: {
    tokenName: 'DAI',
    currentTokenBalance: 200.12,
    tokenValue: '7',
  },
};

export const DefaultStory = (args) => {
  return <ReviewSpendingCap {...args} />;
};

DefaultStory.storyName = 'Default';
